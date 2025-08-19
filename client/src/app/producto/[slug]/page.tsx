"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import BagIcon from "@/components/atoms/Icon/BagIcon";
import { MinusIcon, PlusIcon } from "lucide-react";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { cartEvents } from "@/utils/eventBus";
import { addItemToCart } from "@/redux/slices/cartSlice";

const ProductPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const {
    addItem,
    clearSpecificError,
    getAddItemLoading,
    getAddItemError,
  } = useCart();

  // Usar el nuevo hook
  const { productDetail, loading, error, fetchProductBySlug } = useProducts();

  // Estado para el color seleccionado (ninguno al inicio)
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Si no tenemos un slug en la URL, redirigimos a la página principal
  useEffect(() => {
    if (!slug) {
      router.push("/");
    }
  }, [slug, router]);

  useEffect(() => {
    if (typeof slug === "string" && slug) {
      fetchProductBySlug(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        {/* Skeleton Breadcrumb */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <span className="text-gray-300">/</span>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <span className="text-gray-300">/</span>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Skeleton Layout */}
        <div className="flex flex-col md:flex-row gap-6 animate-pulse">
          {/* Skeleton Image */}
          <div className="flex-1 flex justify-center items-start">
            <div className="w-full h-96 md:h-[500px] bg-gray-200 rounded-none"></div>
          </div>

          {/* Skeleton Product Details */}
          <div className="flex-1">
            {/* Skeleton Title */}
            <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>

            {/* Skeleton Price */}
            <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>

            {/* Skeleton Size */}
            <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>

            {/* Skeleton Colors Label */}
            <div className="h-4 w-12 bg-gray-200 rounded mb-2"></div>

            {/* Skeleton Color Options */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>

            {/* Skeleton Quantity and Add to Cart */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-12 w-32 bg-gray-200 rounded"></div>
              <div className="h-12 w-48 bg-gray-200 rounded"></div>
            </div>

            {/* Skeleton Product Meta */}
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-56 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!productDetail) {
    return <div className="text-center">Producto no encontrado</div>;
  }

  // Obtener colores únicos de las variantes
  const uniqueColors = Array.from(
    new Map(productDetail.variants.map((v) => [v.color.hex, v.color])).values()
  );

  // Encontrar la variante seleccionada según el color
  const selectedVariant = selectedColor
    ? productDetail.variants.find((v) => v.color.hex === selectedColor) || null
    : null;

  // Imagen a mostrar: primaryImage si no hay variante seleccionada, si no la de la variante
  const imageToShow = selectedVariant
    ? selectedVariant.images[0]
    : productDetail.primaryImage;

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Agregar al carrito
  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    // Limpiar errores anteriores del carrito
    clearSpecificError("addItem");

    try {
      const result = await addItem({
        productVariantId: selectedVariant.id,
        quantity: quantity,
      });

      // Verificar si el thunk fue exitoso
      if (addItemToCart.fulfilled.match(result)) {
        // Éxito: abrir el cart drawer
        cartEvents.openCartDrawer();
      }
      // Los errores ya están manejados en el Redux slice
    } catch (error) {
      // Solo para errores realmente inesperados que no captura Redux
      console.error("Error inesperado al agregar al carrito:", error);
    }
  };

  const addLoading = selectedVariant
    ? getAddItemLoading(selectedVariant.id)
    : false;
  const addError = selectedVariant ? getAddItemError(selectedVariant.id) : null;

  return (
    <div className="container mx-auto p-4">
      {/* Breadcrumb DaisyUI */}
      <div className="mb-6 flex justify-center">
        <div className="breadcrumbs text-sm text-[#111111]">
          <ul>
            <li>
              <Link href="/" className="underline-animate no-underline">
                Inicio
              </Link>
            </li>
            <li>
              {productDetail.category.map((cat, idx, arr) => (
                <span key={cat.slug}>
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="underline-animate no-underline"
                  >
                    {cat.name}
                  </Link>
                  {idx < arr.length - 1 && "\u00A0"}
                </span>
              ))}
            </li>
            {productDetail.category.map((cat) => (
              <li key={`subcat-${cat.slug}`}>
                <Link
                  href={`/categorias/${cat.slug}/${productDetail.subcategory.slug}`}
                  className="underline-animate no-underline"
                >
                  {productDetail.subcategory.name}
                  {productDetail.category.length > 1 && ` (${cat.name})`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Responsive grid: image left, info right on desktop; stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Imágenes del producto */}
        <div className="flex-1 flex justify-center items-start">
          <Image
            src={process.env.NEXT_PUBLIC_API_URL + imageToShow}
            alt={productDetail.productModel}
            width={400}
            height={400}
            className="w-full h-auto rounded-none object-contain"
            priority
            style={{
              maxHeight:
                "calc(100vh - (var(--navbar-height) + var(--breadcrumb-height)))",
            }}
          />
        </div>
        {/* Detalles del producto */}
        <div className="flex-1">
          <h1 className="text-3xl font-medium mb-4 text-[#222222]">
            {productDetail.productModel + " " + productDetail.sku}
          </h1>
          <div className="mb-4">
            <p className="text-[#555555] text-xl font-normal mb-4">
              {formatCurrency(productDetail.variants[0].priceUSD, "en-US", "USD")}
            </p>
            <p className="font-normal text-sm text-[#555555] font-dm mb-2">
              {productDetail.size}
            </p>
            <p className="font-normal text-sm text-[#777777] mb-2">Colores</p>
            <div className="flex items-center gap-2">
              {uniqueColors.map((c) => {
                // Encontrar la variante correspondiente a este color para verificar stock
                const variantForColor = productDetail.variants.find(
                  (v) => v.color.hex === c.hex
                );
                const isOutOfStock =
                  !variantForColor || variantForColor.stock === 0;

                return (
                  <button
                    key={c.hex}
                    type="button"
                    className="flex items-center gap-1 focus:outline-none relative"
                    onClick={() => {
                      if (!isOutOfStock) {
                        setSelectedColor(c.hex);
                        // Limpiar error al seleccionar un nuevo color
                        clearSpecificError("addItem");
                      }
                    }}
                  >
                    <div
                      className="tooltip"
                      data-tip={isOutOfStock ? `${c.name} - Sin stock` : c.name}
                    >
                      <span
                        className={`inline-block w-6 h-6 rounded-full border border-gray-300 relative ${
                          isOutOfStock
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
                          selectedColor === c.hex && !isOutOfStock
                            ? "ring-2 ring-black"
                            : ""
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {/* Línea diagonal para colores sin stock */}
                        {isOutOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-7 h-px bg-red-500 rotate-45 transform"></span>
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {/* Selector de cantidad */}
              <div className="flex items-center border border-[#e1e1e1] bg-[#FFFFFF] text-[#888888] rounded-none h-12">
                <button
                  type="button"
                  className={`h-12 min-w-[28px] px-2 flex items-center justify-center transition-colors ${
                    !selectedVariant || quantity === 1
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "hover:bg-[#222222] cursor-pointer"
                  }`}
                  onClick={
                    !selectedVariant || quantity === 1
                      ? undefined
                      : handleDecrease
                  }
                  aria-label="Disminuir cantidad"
                >
                  <MinusIcon size={18} />
                </button>
                <span className="px-4 select-none text-base h-12 flex items-center text-[#222222] border-l border-r border-[#e1e1e1]">
                  {quantity}
                </span>
                <button
                  type="button"
                  className={`h-12 min-w-[28px] px-2 flex items-center justify-center transition-colors ${
                    !selectedVariant ||
                    (selectedVariant && quantity >= selectedVariant.stock)
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "hover:bg-[#222222] cursor-pointer"
                  }`}
                  onClick={
                    !selectedVariant ||
                    (selectedVariant && quantity >= selectedVariant.stock)
                      ? undefined
                      : handleIncrease
                  }
                  aria-label="Aumentar cantidad"
                >
                  <PlusIcon size={18} />
                </button>
              </div>
              {/* Botón agregar al carrito */}
              <div
                className={
                  selectedVariant && selectedVariant.stock > 0 ? "" : "tooltip"
                }
                data-tip={
                  !selectedVariant
                    ? "Selecciona un color antes de agregar al carrito"
                    : selectedVariant?.stock === 0
                    ? "Sin stock disponible"
                    : undefined
                }
              >
                <button
                  className={`btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 ${
                    selectedVariant && selectedVariant.stock > 0 && !addLoading
                      ? "bg-[#444444] text-white hover:bg-[#000000] cursor-pointer"
                      : "bg-[#7C7C7C] text-white cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={
                    selectedVariant && selectedVariant.stock > 0 && !addLoading
                      ? handleAddToCart
                      : undefined
                  }
                >
                  {addLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Agregando...</span>
                    </>
                  ) : (
                    <>
                      <BagIcon />
                      <span className="ml-2">Agregar al carrito</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error específico para agregar al carrito */}
            {addError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {addError}
              </div>
            )}
          </div>
          <div className="mb-4">
            <p className="font-normal text-sm text-[#222222]">
              SKU: <span className="text-[#888888]">{productDetail.sku}</span>
            </p>
            <p className="font-normal text-sm text-[#222222]">
              Categorías:{" "}
              <span className="text-[#888888]">
                {productDetail.category.map((cat, idx, arr) => (
                  <span key={cat.slug}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className="hover:underline"
                    >
                      {cat.name}
                    </Link>
                    {idx < arr.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </p>
            <p className="font-normal text-sm text-[#222222]">
              Subcategoria:{" "}
              <span className="text-[#888888]">
                {productDetail.category.length === 1 ? (
                  <Link
                    href={`/categorias/${productDetail.category[0].slug}/${productDetail.subcategory.slug}`}
                    className="hover:underline"
                  >
                    {productDetail.subcategory.name}
                  </Link>
                ) : (
                  productDetail.category.map((cat, idx, arr) => (
                    <span key={cat.slug}>
                      <Link
                        href={`/categorias/${cat.slug}/${productDetail.subcategory.slug}`}
                        className="hover:underline"
                      >
                        {productDetail.subcategory.name} ({cat.name})
                      </Link>
                      {idx < arr.length - 1 && ", "}
                    </span>
                  ))
                )}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
