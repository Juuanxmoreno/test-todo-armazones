import { Types } from 'mongoose';

export interface GenerateCatalogRequestDto {
  categories?: Types.ObjectId[]; // IDs de categorías específicas a incluir
  subcategories?: Types.ObjectId[]; // IDs de subcategorías específicas a incluir
}

export interface GenerateCatalogResponseDto {
  message: string;
  pdfUrl: string; // URL del PDF generado
  fileName: string; // Nombre del archivo PDF
}

export interface CatalogCategoryDto {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  subcategories: CatalogSubcategoryDto[];
}

export interface CatalogSubcategoryDto {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  products: CatalogProductDto[];
}

export interface CatalogProductDto {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  productModel: string;
  sku: string;
  size?: string;
  variants: CatalogProductVariantDto[];
}

export interface CatalogProductVariantDto {
  id: string;
  color: {
    name: string;
    hex: string;
  };
  stock: number;
  thumbnail: string;
  images: string[];
  priceUSD: number;
}

export interface CatalogDataDto {
  title: string;
  description: string;
  clientName: string;
  logoUrl: string;
  generatedAt: string;
  categories: CatalogCategoryDto[];
  totalProducts: number;
  totalVariants: number;
}
