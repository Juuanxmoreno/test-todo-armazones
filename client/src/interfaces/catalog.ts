import { SubmitHandler, UseFormReturn } from 'react-hook-form';

// ============================================================================
// CATALOG INTERFACES - Interfaces para el sistema de catálogos
// ============================================================================

export interface Category {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
}

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  image: string;
  categories: string[]; // IDs de categorías a las que pertenece
}

// ============================================================================
// FORM INTERFACES - Interfaces para formularios
// ============================================================================

export interface PriceAdjustment {
  categoryId?: string;
  subcategoryId?: string;
  percentageIncrease: number;
}

export interface CatalogFormData {
  email: string;
  categories: string[];
  subcategories: string[];
  logo?: File;
  priceAdjustments: PriceAdjustment[];
}

// ============================================================================
// API INTERFACES - Interfaces para respuestas de la API
// ============================================================================

export interface GenerateCatalogRequest {
  email: string;
  categories?: string[];
  subcategories?: string[];
  priceAdjustments?: PriceAdjustment[];
}

export interface GenerateCatalogResponse {
  message: string;
  pdfUrl: string;
  fileName: string;
}

// ============================================================================
// COMPONENT STATE INTERFACES - Interfaces para estado de componentes
// ============================================================================

export interface CatalogPageState {
  loading: boolean;
  error: string | null;
  logoFile: File | null;
  logoPreview: string | null;
  generatedPdfUrl: string | null;
  emailSent: boolean;
  emailAddress: string | null;
}

export interface LogoUploadState {
  file: File | null;
  preview: string | null;
}

// ============================================================================
// HOOK RETURN INTERFACES - Interfaces para valores de retorno de hooks
// ============================================================================

export interface UseCatalogReturn {
  // Estado
  state: CatalogPageState;
  
  // Datos
  categories: Category[];
  subcategories: Subcategory[];
  filteredSubcategories: Subcategory[];
  
  // Formulario
  form: UseFormReturn<CatalogFormData>;
  
  // Handlers
  handlers: {
    handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeLogo: () => void;
    handleCategoryChange: (categoryId: string, checked: boolean) => void;
    handleSubcategoryChange: (subcategoryId: string, checked: boolean) => void;
    selectAllCategories: () => void;
    deselectAllCategories: () => void;
    selectAllSubcategories: () => void;
    deselectAllSubcategories: () => void;
    clearError: () => void;
    clearSuccess: () => void;
    addPriceAdjustment: () => void;
    removePriceAdjustment: (index: number) => void;
    updatePriceAdjustment: (index: number, field: keyof PriceAdjustment, value: string | number) => void;
    onSubmit: SubmitHandler<CatalogFormData>;
  };
  
  // Valores observados del formulario
  selectedCategories: string[];
  selectedSubcategories: string[];
  priceAdjustments: PriceAdjustment[];
  email: string;
}

// ============================================================================
// HOOK OPTIONS - Opciones para configurar el hook
// ============================================================================

export interface UseCatalogOptions {
  initialCategories?: string[];
  initialSubcategories?: string[];
  autoSelectAll?: boolean;
}

// ============================================================================
// CONSTANTS - Constantes del sistema
// ============================================================================

export const CATALOG_CATEGORIES: Category[] = [
  {
    id: "687817781dd5819a2483c7eb",
    slug: "hombres",
    name: "Hombres",
    title: "Hombres",
    description: "Categoría de hombres",
    image: "categoria-hombres.jpg"
  },
  {
    id: "6878179f1dd5819a2483c7ed",
    slug: "mujeres",
    name: "Mujeres",
    title: "Mujeres",
    description: "Categoría de mujeres",
    image: "categoria-mujeres.jpg"
  },
  {
    id: "687817d71dd5819a2483c7ef",
    slug: "ninos",
    name: "Niños",
    title: "Niños",
    description: "Categoría de niños",
    image: "categoria-niños.jpg"
  }
];

export const CATALOG_SUBCATEGORIES: Subcategory[] = [
  {
    id: "6878196acdda2752c5271779",
    slug: "armazon-de-receta",
    name: "Armazón de receta",
    title: "Armazón de receta",
    description: "Descripción armazón de receta",
    image: "sucategoria-armazon-de-receta.jpg",
    categories: ["687817781dd5819a2483c7eb", "6878179f1dd5819a2483c7ed", "687817d71dd5819a2483c7ef"]
  },
  {
    id: "687819d2cdda2752c527177b",
    slug: "anteojos-de-sol-polarizados",
    name: "Anteojos de sol",
    title: "Anteojos de sol polarizados",
    description: "Descripción anteojos de sol polarizados",
    image: "sucategoria-anteojos-de-sol-polarizados.jpg",
    categories: ["687817781dd5819a2483c7eb", "6878179f1dd5819a2483c7ed", "687817d71dd5819a2483c7ef"]
  },
  {
    id: "68781a06cdda2752c527177d",
    slug: "clip-on",
    name: "Clip On",
    title: "Clip On",
    description: "Descripción clip on",
    image: "sucategoria-clip-on.jpg",
    categories: ["687817781dd5819a2483c7eb", "6878179f1dd5819a2483c7ed", "687817d71dd5819a2483c7ef"]
  }
];