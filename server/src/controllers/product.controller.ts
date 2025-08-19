import { Request, Response } from 'express';
import { ProductService } from '@services/product.service';
import { CreateProductRequestDto, UpdateProductRequestDto } from '@dto/product.dto';
import { CreateProductVariantRequestDto, UpdateProductVariantRequestDto } from '@dto/product-variant.dto';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import path from 'path';
import sharp from 'sharp';
import { normalizeColorName } from '@utils/normalizeColorName';
import { getSessionUserId } from '@utils/sessionUtils';
import { ApiResponse, ApiErrorResponse } from '../types/response';
import fs from 'fs/promises';

export class ProductController {
  private productService: ProductService = new ProductService();

  public createProductWithVariants = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    // Utilidad para limpiar archivos
    const cleanupFiles = async (paths: string[]) => {
      for (const filePath of paths) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn('No se pudo eliminar archivo temporal', {
            filePath,
            err,
          });
        }
      }
    };

    const files = req.files as Express.Multer.File[];
    const generatedFiles: string[] = [];
    try {
      // Primary image
      const primaryImageFile = files.find((file) => file.fieldname === 'primaryImage');
      if (!primaryImageFile) throw new AppError('Primary image is required', 400, 'fail', false);
      generatedFiles.push(primaryImageFile.path);

      // 2. Crear thumbnail con Sharp
      const thumbnailFilename = 'thumb-' + primaryImageFile.filename;
      const thumbnailPath = path.join(primaryImageFile.destination, thumbnailFilename);
      await sharp(primaryImageFile.path).resize(300, 300).toFile(thumbnailPath);
      generatedFiles.push(thumbnailPath);

      // 3. Parsear los datos recibidos como string JSON
      const productData = typeof req.body.product === 'string' ? JSON.parse(req.body.product) : req.body.product;
      const variantsData = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;

      // 4. Asociar imágenes a cada variante usando el nombre del color como identificador
      const variantsDto: CreateProductVariantRequestDto[] = await Promise.all(
        variantsData.map(async (variant: CreateProductVariantRequestDto) => {
          const colorKey = `images_${normalizeColorName(variant.color.name)}`;
          const imagesForVariant = files.filter((img) => img.fieldname === colorKey).map((img) => img);
          if (!imagesForVariant.length) {
            throw new AppError(
              `La variante de color '${variant.color.name}' debe tener al menos una imagen.`,
              400,
              'fail',
              false,
            );
          }
          // Solo generar thumbnail de la primera imagen de la variante
          const firstImg = imagesForVariant[0];
          generatedFiles.push(firstImg.path);
          const thumbName = 'thumb-' + firstImg.filename;
          const thumbPath = path.join(firstImg.destination, thumbName);
          await sharp(firstImg.path).resize(300, 300).toFile(thumbPath);
          generatedFiles.push(thumbPath);
          // Guardar rutas de imágenes y thumbnail principal
          return {
            ...variant,
            images: imagesForVariant.map((img) => '/uploads/' + img.filename),
            thumbnail: '/uploads/' + thumbName,
          };
        }),
      );

      // 5. Asignar rutas de imágenes procesadas al producto
      const productDto: CreateProductRequestDto = {
        ...productData,
        primaryImage: '/uploads/' + primaryImageFile.filename,
        thumbnail: '/uploads/' + thumbnailFilename,
      };

      // Obtener el ID del usuario desde la sesión
      const userId = getSessionUserId(req.session);

      // Llamada al servicio para crear el producto y variantes
      const result = await this.productService.createProductWithVariants(productDto, variantsDto, userId);

      res.status(201).json({
        status: 'success',
        message: 'Producto y variantes creados correctamente.',
        data: result,
      });
    } catch (error: unknown) {
      // Limpiar archivos generados si ocurre un error
      await cleanupFiles(generatedFiles);
      logger.error('Error creating product with variants:', {
        error,
        productDto: req.body.product,
        variantsDto: req.body.variants,
      });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProducts = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      // Validación de parámetros de consulta
      const limitParam = req.query.limit as string;
      const cursor = req.query.cursor as string | undefined;
      const categorySlug = req.query.categorySlug as string | undefined;
      const subcategorySlug = req.query.subcategorySlug as string | undefined;

      let limit = 10;
      if (limitParam) {
        limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit <= 0) {
          res.status(400).json({
            status: 'fail',
            message: "El parámetro 'limit' debe ser un número positivo.",
          });
          return;
        }
      }

      // Llamada al servicio para obtener productos
      const result = await this.productService.getProducts(limit, cursor, categorySlug, subcategorySlug);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      logger.error('Error fetching products:', { error });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public getProductVariantsByProductSlug = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    const { slug } = req.params;

    try {
      const variants = await this.productService.getProductVariantsByProductSlug(slug);
      res.status(200).json({
        status: 'success',
        data: variants,
      });
    } catch (error) {
      logger.error('Error fetching product variants:', { error });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error fetching product variants',
        } as ApiErrorResponse);
      }
    }
  };

  public updateProductWithVariants = async (
    req: Request,
    res: Response<ApiResponse | ApiErrorResponse>,
  ): Promise<void> => {
    const { productId } = req.params;

    // Utilidad para limpiar archivos
    const cleanupFiles = async (paths: string[]) => {
      for (const filePath of paths) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          logger.warn('No se pudo eliminar archivo temporal', {
            filePath,
            err,
          });
        }
      }
    };

    const files = (req.files as Express.Multer.File[]) || [];
    const generatedFiles: string[] = [];
    try {
      // Procesar imagen principal si se envía
      let productDto = (
        typeof req.body.product === 'string' ? JSON.parse(req.body.product) : req.body.product
      ) as UpdateProductRequestDto;

      let thumbnailFilename: string | undefined;

      const primaryImageFile = files.find((file) => file.fieldname === 'primaryImage');
      if (primaryImageFile) {
        // Crear thumbnail
        thumbnailFilename = 'thumb-' + primaryImageFile.filename;
        const thumbnailPath = path.join(primaryImageFile.destination, thumbnailFilename);
        await sharp(primaryImageFile.path).resize(300, 300).toFile(thumbnailPath);
        generatedFiles.push(primaryImageFile.path);
        generatedFiles.push(thumbnailPath);

        productDto = {
          ...productDto,
          primaryImage: '/uploads/' + primaryImageFile.filename,
          thumbnail: '/uploads/' + thumbnailFilename,
        };
      }

      // Procesar variantes y asociar imágenes si se envían
      const variantsRaw = (
        typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants
      ) as { id: string; data: UpdateProductVariantRequestDto }[];

      const variantsDto = await Promise.all(
        variantsRaw.map(async (variant) => {
          if (variant.data && variant.data.color && variant.data.color.name) {
            const colorKey = `images_${normalizeColorName(variant.data.color.name)}`;
            const imagesForVariant = files.filter((img) => img.fieldname === colorKey).map((img) => img);
            if (imagesForVariant.length > 0) {
              // Solo generar thumbnail de la primera imagen de la variante
              const firstImg = imagesForVariant[0];
              generatedFiles.push(firstImg.path);
              const thumbName = 'thumb-' + firstImg.filename;
              const thumbPath = path.join(firstImg.destination, thumbName);
              await sharp(firstImg.path).resize(300, 300).toFile(thumbPath);
              generatedFiles.push(thumbPath);
              return {
                ...variant,
                data: {
                  ...variant.data,
                  images: imagesForVariant.map((img) => '/uploads/' + img.filename),
                  thumbnail: '/uploads/' + thumbName,
                },
              };
            }
          }
          return variant;
        }),
      );

      const result = await this.productService.updateProductWithVariants(productId, productDto, variantsDto);

      res.status(200).json({
        status: 'success',
        message: 'Producto y variantes actualizados correctamente.',
        data: result,
      });
    } catch (error) {
      await cleanupFiles(generatedFiles);
      logger.error('Error updating product and variants:', {
        error,
        productId,
        productDto: req.body.product,
        variantsDto: req.body.variants,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        const appError = new AppError('Internal Server Error', 500, 'error', false);
        res.status(appError.statusCode).json({
          status: appError.status,
          message: appError.message,
        } as ApiErrorResponse);
      }
    }
  };

  public searchProducts = async (req: Request, res: Response<ApiResponse | ApiErrorResponse>): Promise<void> => {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(400).json({
          status: 'fail',
          message: "Falta el parámetro de búsqueda 'q'",
        } as ApiErrorResponse);
        return;
      }
      const result = await this.productService.searchProducts(q);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Error searching products:', { error });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
          details: error.details,
        } as ApiErrorResponse);
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error searching products',
        } as ApiErrorResponse);
      }
    }
  };
}
