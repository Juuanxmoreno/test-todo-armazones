import path from 'path';
import fs from 'fs';
import { FilterQuery } from 'mongoose';

import Category from '@models/Category';
import Subcategory from '@models/Subcategory';
import Product from '@models/Product';
import ProductVariant from '@models/ProductVariant';

import {
  GenerateCatalogRequestDto,
  GenerateCatalogResponseDto,
  CatalogDataDto,
  CatalogCategoryDto,
  CatalogSubcategoryDto,
  CatalogProductDto,
  CatalogProductVariantDto,
  PriceAdjustmentDto,
} from '@dto/catalog.dto';

import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { generateCatalogPDF } from '@utils/catalogPdfGenerator';
import env from '@config/env';
import transporter from '@config/nodemailer.config';

export class CatalogService {
  /**
   * Calcula el precio ajustado según los ajustes de precio configurados
   */
  private calculateAdjustedPrice(
    originalPrice: number,
    categoryId: string,
    subcategoryId: string,
    priceAdjustments: PriceAdjustmentDto[],
  ): number {
    if (!priceAdjustments || priceAdjustments.length === 0) {
      return originalPrice;
    }

    // Buscar ajuste específico por subcategoría (más específico)
    const subcategoryAdjustment = priceAdjustments.find(
      (adjustment) => adjustment.subcategoryId?.toString() === subcategoryId,
    );

    if (subcategoryAdjustment) {
      return originalPrice * (1 + subcategoryAdjustment.percentageIncrease / 100);
    }

    // Buscar ajuste por categoría (menos específico)
    const categoryAdjustment = priceAdjustments.find((adjustment) => adjustment.categoryId?.toString() === categoryId);

    if (categoryAdjustment) {
      return originalPrice * (1 + categoryAdjustment.percentageIncrease / 100);
    }

    return originalPrice;
  }

  /**
   * Convierte una URL relativa a una URL absoluta con el SERVER_URL
   */
  private getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl; // Ya es una URL absoluta
    }

    // Si la URL empieza con /, la agregamos al SERVER_URL
    if (imageUrl.startsWith('/')) {
      return `${env.SERVER_URL}${imageUrl}`;
    }

    // Si no empieza con /, asumimos que es una ruta relativa a uploads
    return `${env.SERVER_URL}/uploads/${imageUrl}`;
  }

  /**
   * Genera un catálogo en PDF con las opciones especificadas y lo envía por email
   */
  public async generateCatalog(
    catalogData: GenerateCatalogRequestDto,
    logoFile?: Express.Multer.File,
  ): Promise<GenerateCatalogResponseDto> {
    try {
      // Validar que al menos se especifique una opción de filtrado
      if (!catalogData.categories?.length && !catalogData.subcategories?.length) {
        throw new AppError('Debe especificar al menos una categoría o subcategoría', 400);
      }

      // Validar email
      if (!catalogData.email) {
        throw new AppError('El email es requerido', 400);
      }

      // Procesar logo
      let logoUrl = 'https://i.imgur.com/nzdfwS7.png'; // Logo por defecto
      if (logoFile) {
        // Construir URL del logo subido
        logoUrl = this.getAbsoluteImageUrl(`/uploads/${logoFile.filename}`);
      }

      // Obtener datos del catálogo
      const catalogInfo = await this.getCatalogData(catalogData);

      const fullCatalogData: CatalogDataDto = {
        title: 'Catálogo de Productos',
        description: 'Catálogo completo de productos disponibles',
        clientName: 'Cliente',
        logoUrl,
        generatedAt: new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Argentina/Buenos_Aires',
        }),
        ...catalogInfo,
      };

      // Generar PDF
      const pdfBuffer = await generateCatalogPDF(fullCatalogData);

      // Guardar PDF en uploads (misma carpeta que usa multer y app.ts)
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }

      const fileName = `catalog-${Date.now()}.pdf`;
      const filePath = path.join(uploadsPath, fileName);

      fs.writeFileSync(filePath, pdfBuffer);

      // Enviar catálogo por email usando la plantilla Handlebars
      await transporter.sendMail({
        from: `Todo Armazones Argentina <${env.EMAIL_USER}>`,
        to: catalogData.email,
        subject: 'Tu catálogo de productos está listo',
        // @ts-expect-error - nodemailer with handlebars template property not typed
        template: 'catalog-email',
        context: {
          logoUrl,
          generatedAt: fullCatalogData.generatedAt,
          categoriesCount: catalogInfo.categories.length,
          totalProducts: catalogInfo.totalProducts,
          totalVariants: catalogInfo.totalVariants,
        },
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      logger.info('Catálogo generado y enviado exitosamente', {
        fileName,
        email: catalogData.email,
        categoriesCount: catalogInfo.categories.length,
        totalProducts: catalogInfo.totalProducts,
        totalVariants: catalogInfo.totalVariants,
        priceAdjustmentsApplied: catalogData.priceAdjustments?.length || 0,
      });

      return {
        message: 'Catálogo generado y enviado por email exitosamente',
        pdfUrl: `/uploads/${fileName}`,
        fileName,
      };
    } catch (error) {
      logger.error('Error al generar catálogo', { error, catalogData });
      throw error;
    }
  }

  /**
   * Obtiene los datos estructurados del catálogo según los filtros especificados
   */
  private async getCatalogData(catalogData: GenerateCatalogRequestDto): Promise<{
    categories: CatalogCategoryDto[];
    totalProducts: number;
    totalVariants: number;
  }> {
    const categoryFilter: FilterQuery<typeof Category> = {};
    const subcategoryFilter: FilterQuery<typeof Subcategory> = {};
    const productFilter: FilterQuery<typeof Product> = {};

    // Aplicar filtros según los parámetros
    if (catalogData.categories?.length) {
      categoryFilter._id = { $in: catalogData.categories };
    }

    if (catalogData.subcategories?.length) {
      subcategoryFilter._id = { $in: catalogData.subcategories };
      // Si se especifican subcategorías, los productos deben pertenecer a esas subcategorías
      productFilter.subcategory = { $in: catalogData.subcategories };
    }

    if (catalogData.categories?.length && !catalogData.subcategories?.length) {
      // Si solo se especifican categorías, los productos deben pertenecer a esas categorías
      productFilter.category = { $in: catalogData.categories };
    }

    // Obtener categorías
    const categories = await Category.find(categoryFilter).lean();

    const catalogCategories: CatalogCategoryDto[] = [];
    let totalProducts = 0;
    let totalVariants = 0;

    for (const category of categories) {
      const categoryDto: CatalogCategoryDto = {
        id: category._id.toString(),
        slug: category.slug,
        name: category.name,
        title: category.title,
        description: category.description,
        image: this.getAbsoluteImageUrl(category.image),
        subcategories: [],
      };

      // Obtener subcategorías de esta categoría
      const subcategoryQuery: FilterQuery<typeof Subcategory> = { category: category._id };
      if (catalogData.subcategories?.length) {
        subcategoryQuery._id = { $in: catalogData.subcategories };
      }

      const subcategories = await Subcategory.find(subcategoryQuery).lean();

      for (const subcategory of subcategories) {
        const subcategoryDto: CatalogSubcategoryDto = {
          id: subcategory._id.toString(),
          slug: subcategory.slug,
          name: subcategory.name,
          title: subcategory.title,
          description: subcategory.description,
          image: this.getAbsoluteImageUrl(subcategory.image),
          products: [],
        };

        // Obtener productos de esta subcategoría y categoría
        const productQuery: FilterQuery<typeof Product> = {
          subcategory: subcategory._id,
          category: category._id,
        };

        const products = await Product.find(productQuery).lean();

        for (const product of products) {
          const productDto: CatalogProductDto = {
            id: product._id.toString(),
            slug: product.slug,
            thumbnail: this.getAbsoluteImageUrl(product.thumbnail),
            primaryImage: this.getAbsoluteImageUrl(product.primaryImage),
            productModel: product.productModel,
            sku: product.sku,
            ...(product.size && { size: product.size }),
            variants: [],
          };

          // Obtener variantes del producto
          const variants = await ProductVariant.find({
            product: product._id,
          }).lean();

          for (const variant of variants) {
            // Calcular precio ajustado
            const adjustedPrice = this.calculateAdjustedPrice(
              variant.priceUSD,
              category._id.toString(),
              subcategory._id.toString(),
              catalogData.priceAdjustments || [],
            );

            const variantDto: CatalogProductVariantDto = {
              id: variant._id.toString(),
              color: variant.color,
              stock: variant.stock,
              thumbnail: this.getAbsoluteImageUrl(variant.thumbnail),
              images: variant.images.map((img) => this.getAbsoluteImageUrl(img)),
              priceUSD: adjustedPrice,
            };

            productDto.variants.push(variantDto);
            totalVariants++;
          }

          subcategoryDto.products.push(productDto);
          totalProducts++;
        }

        // Solo incluir subcategoría si tiene productos
        if (subcategoryDto.products.length > 0) {
          categoryDto.subcategories.push(subcategoryDto);
        }
      }

      // Solo incluir categoría si tiene subcategorías con productos
      if (categoryDto.subcategories.length > 0) {
        catalogCategories.push(categoryDto);
      }
    }

    return {
      categories: catalogCategories,
      totalProducts,
      totalVariants,
    };
  }
}
