interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariantColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  color: ProductVariantColor;
  stock: number;
  images: string[];
  averageCostUSD: number;
  priceUSD: number;
}

export interface Product {
  id: string;
  slug: string;
  thumbnail: string;
  primaryImage: string;
  category: ProductCategory[];
  subcategory: ProductSubcategory;
  productModel: string;
  sku: string;
  size?: string;
  variants: ProductVariant[];
}

export interface ProductsResponse {
  products: Product[];
  nextCursor: string | null;
}

export interface CreateProductPayload {
  product: {
    category: string[]; // IDs de categorías
    subcategory: string; // ID de subcategoría
    productModel: string;
    sku: string;
    size?: string;
  };
  variants: Array<{
    color: ProductVariantColor;
    stock: number;
    initialCostUSD: number;
    priceUSD: number;
  }>;
  files?: {
    primaryImage?: File;
    variantImages?: Record<string, File[]>;
  };
}

export type CreateProductResponse = {
  product: Product;
  variants: ProductVariant[];
};

export interface UpdateProductPayload {
  productId: string;
  product: {
    category?: string[];
    subcategory?: string;
    productModel?: string;
    sku?: string;
    size?: string;
  };
  variants: Array<{
    id: string; // ID de la variante
    data: {
      color?: { name: string; hex: string };
      priceUSD?: number;
    };
  }>;
  files?: {
    primaryImage?: File;
    variantImages?: Record<string, File[]>;
  };
}
