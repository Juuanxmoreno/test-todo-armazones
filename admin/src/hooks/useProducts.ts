import {
  CreateProductPayload,
  UpdateProductPayload,
} from "@/interfaces/product";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchProducts,
  searchProducts,
  clearSearchResults,
  createProduct,
  updateProduct,
} from "../redux/slices/productSlice";

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    nextCursor,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
  } = useAppSelector((state) => state.products);

  return {
    products,
    nextCursor,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    fetchProducts: (params?: {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
    }) => dispatch(fetchProducts(params)),
    searchProducts: (q: string) => dispatch(searchProducts(q)),
    clearSearchResults: () => dispatch(clearSearchResults()),
    createProduct: (payload: CreateProductPayload) =>
      dispatch(createProduct(payload)),
    updateProduct: (payload: UpdateProductPayload) =>
      dispatch(updateProduct(payload)),
  };
};
