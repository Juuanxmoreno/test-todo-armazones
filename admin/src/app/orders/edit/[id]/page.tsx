"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useOrders from "@/hooks/useOrders";
import type {
  ShippingAddress,
  Order,
  UpdateOrderPayload,
} from "@/interfaces/order";
import type { ProductVariant } from "@/interfaces/product";
import { ShippingMethod, PaymentMethod, OrderStatus } from "@/enums/order.enum";
import { useProducts } from "@/hooks/useProducts";
import { Trash } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useUsersAnalytics } from "@/hooks/useUsersAnalytics";
import { AnalyticsPeriod } from "@/enums/analytics.enum";
import StockConflictAlert from "@/components/StockConflictAlert";
import PendingPaymentInfo from "@/components/PendingPaymentInfo";

const EditOrderPage = () => {
  // All hooks at the top, always called in the same order
  const { id } = useParams();
  const router = useRouter();
  const { 
    getOrderById, 
    orderById, 
    loading, 
    error, 
    updateOrderData,
    stockAvailability,
    stockCheckLoading,
    stockCheckError,
    checkStockAvailability,
    clearStockInfo
  } = useOrders();
  const [form, setForm] = useState<Order | null>(null);
  const [originalForm, setOriginalForm] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [itemOperationLoading, setItemOperationLoading] = useState<
    string | null
  >(null);
  const [isPaymentMethodUpdating, setIsPaymentMethodUpdating] = useState(false);
  const [isOrderStatusUpdating, setIsOrderStatusUpdating] = useState(false);
  const [isAllowViewInvoiceUpdating, setIsAllowViewInvoiceUpdating] = useState(false);
  const { searchProducts, searchResults, searchLoading, clearSearchResults } =
    useProducts();
  
  // Users analytics hook for customer history
  const {
    loadUserDetailedAnalytics,
    currentUserMetrics,
    isLoadingUserDetails
  } = useUsersAnalytics();

  useEffect(() => {
    if (id && !isInitialized) {
      getOrderById(id as string);
    }
  }, [id, getOrderById, isInitialized]);

  useEffect(() => {
    if (orderById && !isInitialized) {
      setForm(orderById);
      setOriginalForm(orderById);
      setIsInitialized(true);
    }
  }, [orderById, isInitialized]);

  // Load user analytics when form is available
  useEffect(() => {
    if (form?.user?.id) {
      loadUserDetailedAnalytics(form.user.id, AnalyticsPeriod.AllTime);
    }
  }, [form?.user?.id, loadUserDetailedAnalytics]);

  // Check stock availability when order is PENDING_PAYMENT
  useEffect(() => {
    if (form?.id && form.orderStatus === OrderStatus.PendingPayment) {
      // Limpiar información anterior de stock
      clearStockInfo();
      // Verificar disponibilidad de stock
      checkStockAvailability(form.id);
    } else {
      // Si no es PENDING_PAYMENT, limpiar información de stock
      clearStockInfo();
    }
  }, [form?.id, form?.orderStatus, checkStockAvailability, clearStockInfo]);

  if (!isInitialized || loading || !form)
    return <div className="p-8">Cargando orden...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // Handler para cambios en los campos de dirección
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [name]: value },
          }
        : prev
    );
  };

  // Handler para cambios en campos específicos de entrega
  const handleDeliveryFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [name]: value },
          }
        : prev
    );
  };

  // Handler para cambios en métodos de envío/pago/estado
  const handleFieldChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Actualizar estado local inmediatamente
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));

    // Si es paymentMethod, enviar automáticamente al backend
    if (name === "paymentMethod" && form) {
      setIsPaymentMethodUpdating(true);

      try {
        const updatePayload = {
          orderId: form.id,
          paymentMethod: value as PaymentMethod,
        };

        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar estado local con la respuesta del servidor
        setForm(result);
        setOriginalForm(result);
      } catch (error) {
        console.error("Error al actualizar método de pago:", error);
        alert(
          "Error al actualizar el método de pago: " +
            (error || "Error desconocido")
        );

        // Revertir el cambio local en caso de error
        if (originalForm) {
          setForm((prev) =>
            prev ? { ...prev, paymentMethod: originalForm.paymentMethod } : prev
          );
        }
      } finally {
        setIsPaymentMethodUpdating(false);
      }
    }

    // Si es orderStatus, enviar automáticamente al backend
    if (name === "orderStatus" && form) {
      setIsOrderStatusUpdating(true);

      try {
        const updatePayload = {
          orderId: form.id,
          orderStatus: value as OrderStatus,
        };

        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar estado local con la respuesta del servidor
        setForm(result);
        setOriginalForm(result);
      } catch (error) {
        console.error("Error al actualizar estado de la orden:", error);
        alert(
          "Error al actualizar el estado de la orden: " +
            (error || "Error desconocido")
        );

        // Revertir el cambio local en caso de error
        if (originalForm) {
          setForm((prev) =>
            prev ? { ...prev, orderStatus: originalForm.orderStatus } : prev
          );
        }
      } finally {
        setIsOrderStatusUpdating(false);
      }
    }
  };

  // Handler para verificar stock manualmente
  const handleRefreshStock = () => {
    if (form?.id) {
      checkStockAvailability(form.id);
    }
  };

  // Handler para cambios en la fecha de creación
  const handleCreatedAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Convertir el datetime-local a ISO string manteniendo la hora local
    if (value) {
      // Agregar segundos y milisegundos para crear un formato ISO completo
      const isoString = value + ":00.000Z";
      setForm((prev) => (prev ? { ...prev, createdAt: isoString } : prev));
    } else {
      setForm((prev) => (prev ? { ...prev, createdAt: "" } : prev));
    }
  };

  // Handler para cambios en allowViewInvoice checkbox
  const handleAllowViewInvoiceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;

    // Actualizar estado local inmediatamente
    setForm((prev) => (prev ? { ...prev, allowViewInvoice: checked } : prev));

    if (!form) return;

    setIsAllowViewInvoiceUpdating(true);

    try {
      const updatePayload = {
        orderId: form.id,
        allowViewInvoice: checked,
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
    } catch (error) {
      console.error("Error al actualizar permiso de ver factura:", error);
      alert(
        "Error al actualizar el permiso de ver factura: " +
          (error || "Error desconocido")
      );

      // Revertir el cambio local en caso de error
      if (originalForm) {
        setForm((prev) =>
          prev ? { ...prev, allowViewInvoice: originalForm.allowViewInvoice } : prev
        );
      }
    } finally {
      setIsAllowViewInvoiceUpdating(false);
    }
  };

  // Buscar productos/variantes
  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (productQuery) searchProducts(productQuery);
  };

  // Agregar ProductVariant a la orden
  const handleAddVariant = async (variant: ProductVariant) => {
    if (!form) return;
    if (form.items.some((v) => v.productVariant.id === variant.id)) return;

    setItemOperationLoading(variant.id);

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId: variant.id,
            action: "add" as const,
            quantity: 1,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
    } catch (error) {
      console.error("Error al agregar variante:", error);
      alert("Error al agregar el producto: " + (error || "Error desconocido"));
    } finally {
      setItemOperationLoading(null);
    }
  };

  // Quitar ProductVariant
  const handleRemoveVariant = async (variantId: string) => {
    if (!form) return;

    setItemOperationLoading(variantId);

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId: variantId,
            action: "remove" as const,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
    } catch (error) {
      console.error("Error al eliminar variante:", error);
      alert("Error al eliminar el producto: " + (error || "Error desconocido"));
    } finally {
      setItemOperationLoading(null);
    }
  };

  // Cambiar cantidad
  const handleQuantityChange = async (variantId: string, qty: number) => {
    if (!form) return;

    const newQuantity = Math.max(1, qty);
    const currentItem = form.items.find(
      (item) => item.productVariant.id === variantId
    );

    if (!currentItem || currentItem.quantity === newQuantity) return;

    setItemOperationLoading(variantId);

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId: variantId,
            action: "set" as const,
            quantity: newQuantity,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
    } catch (error) {
      console.error("Error al cambiar cantidad:", error);
      alert(
        "Error al actualizar la cantidad: " + (error || "Error desconocido")
      );
    } finally {
      setItemOperationLoading(null);
    }
  };

  // Verificar si hay cambios pendientes
  const hasChanges = () => {
    if (!form || !originalForm) return false;

    // Verificar cambios en createdAt
    const hasCreatedAtChanges = form.createdAt !== originalForm.createdAt;

    // Verificar cambios en shippingMethod
    const hasShippingMethodChanges =
      form.shippingMethod !== originalForm.shippingMethod;

    // Verificar cambios en deliveryWindow y declaredShippingAmount
    const hasDeliveryChanges =
      form.shippingAddress.deliveryWindow !==
        originalForm.shippingAddress.deliveryWindow ||
      form.shippingAddress.declaredShippingAmount !==
        originalForm.shippingAddress.declaredShippingAmount;

    // Verificar cambios en los campos de dirección
    const hasAddressChanges =
      form.shippingAddress.firstName !==
        originalForm.shippingAddress.firstName ||
      form.shippingAddress.lastName !== originalForm.shippingAddress.lastName ||
      form.shippingAddress.email !== originalForm.shippingAddress.email ||
      form.shippingAddress.phoneNumber !==
        originalForm.shippingAddress.phoneNumber ||
      form.shippingAddress.dni !== originalForm.shippingAddress.dni ||
      form.shippingAddress.streetAddress !==
        originalForm.shippingAddress.streetAddress ||
      form.shippingAddress.city !== originalForm.shippingAddress.city ||
      form.shippingAddress.state !== originalForm.shippingAddress.state ||
      form.shippingAddress.postalCode !==
        originalForm.shippingAddress.postalCode ||
      form.shippingAddress.companyName !==
        originalForm.shippingAddress.companyName ||
      form.shippingAddress.shippingCompany !==
        originalForm.shippingAddress.shippingCompany;

    return (
      hasCreatedAtChanges ||
      hasShippingMethodChanges ||
      hasDeliveryChanges ||
      hasAddressChanges
    );
  };

  // Manejar el submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !originalForm || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const updatePayload: UpdateOrderPayload = {
        orderId: form.id,
      };

      let hasChanges = false;

      // Verificar cambios en createdAt
      if (form.createdAt !== originalForm.createdAt) {
        updatePayload.createdAt = form.createdAt;
        hasChanges = true;
      }

      // Verificar cambios en shippingMethod
      if (form.shippingMethod !== originalForm.shippingMethod) {
        updatePayload.shippingMethod = form.shippingMethod;
        hasChanges = true;
      }

      // Verificar cambios en deliveryWindow y declaredShippingAmount
      if (
        form.shippingAddress.deliveryWindow !==
          originalForm.shippingAddress.deliveryWindow ||
        form.shippingAddress.declaredShippingAmount !==
          originalForm.shippingAddress.declaredShippingAmount
      ) {
        if (
          form.shippingAddress.deliveryWindow !==
          originalForm.shippingAddress.deliveryWindow
        ) {
          updatePayload.deliveryWindow = form.shippingAddress.deliveryWindow;
          hasChanges = true;
        }
        if (
          form.shippingAddress.declaredShippingAmount !==
          originalForm.shippingAddress.declaredShippingAmount
        ) {
          updatePayload.declaredShippingAmount =
            form.shippingAddress.declaredShippingAmount;
          hasChanges = true;
        }
      }

      // Verificar cambios en la dirección completa
      const hasAddressChanges =
        form.shippingAddress.firstName !==
          originalForm.shippingAddress.firstName ||
        form.shippingAddress.lastName !==
          originalForm.shippingAddress.lastName ||
        form.shippingAddress.email !== originalForm.shippingAddress.email ||
        form.shippingAddress.phoneNumber !==
          originalForm.shippingAddress.phoneNumber ||
        form.shippingAddress.dni !== originalForm.shippingAddress.dni ||
        form.shippingAddress.streetAddress !==
          originalForm.shippingAddress.streetAddress ||
        form.shippingAddress.city !== originalForm.shippingAddress.city ||
        form.shippingAddress.state !== originalForm.shippingAddress.state ||
        form.shippingAddress.postalCode !==
          originalForm.shippingAddress.postalCode ||
        form.shippingAddress.companyName !==
          originalForm.shippingAddress.companyName ||
        form.shippingAddress.shippingCompany !==
          originalForm.shippingAddress.shippingCompany;

      if (hasAddressChanges) {
        updatePayload.shippingAddress = form.shippingAddress;
        hasChanges = true;
      }

      // Solo enviar si hay cambios
      if (hasChanges) {
        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar el estado local con los datos del servidor
        setForm(result);
        setOriginalForm(result);
      } else {
        alert("No hay cambios que guardar");
      }
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      alert("Error al actualizar la orden: " + (error || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Order Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-none shadow-none p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#111111]">
            Editar Orden #{form.orderNumber}
            {hasChanges() && (
              <span className="ml-2 text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                Cambios pendientes
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="btn btn-sm rounded-none shadow-none border-none px-4 text-[#222222] bg-[#e0e0e0]"
          >
            Volver
          </button>
        </div>

        {/* Alerta de conflictos de stock para órdenes PENDING_PAYMENT */}
        {form.orderStatus === OrderStatus.PendingPayment && stockAvailability && stockAvailability.hasConflicts && (
          <StockConflictAlert
            conflicts={stockAvailability.conflicts}
            onRefreshStock={handleRefreshStock}
            isRefreshing={stockCheckLoading}
            className="mb-6"
          />
        )}

        {/* Indicador de verificación de stock */}
        {form.orderStatus === OrderStatus.PendingPayment && stockCheckLoading && !stockAvailability && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Verificando disponibilidad de stock...</span>
            </div>
          </div>
        )}

        {/* Error de verificación de stock */}
        {form.orderStatus === OrderStatus.PendingPayment && stockCheckError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-700">Error al verificar stock: {stockCheckError}</span>
              <button
                onClick={handleRefreshStock}
                className="text-sm text-red-600 underline hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Indicador de stock OK para órdenes PENDING_PAYMENT */}
        {form.orderStatus === OrderStatus.PendingPayment && 
         stockAvailability && 
         !stockAvailability.hasConflicts && 
         !stockCheckLoading && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">
                  ✅ Stock disponible para todos los productos
                </span>
              </div>
              <button
                onClick={handleRefreshStock}
                disabled={stockCheckLoading}
                className="text-sm text-green-600 underline hover:no-underline"
              >
                Verificar nuevamente
              </button>
            </div>
          </div>
        )}

        {/* Información sobre estado PENDING_PAYMENT */}
        <PendingPaymentInfo 
          orderStatus={form.orderStatus} 
          className="mb-6"
        />
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Fecha de creación */}
          <div className="mb-4">
            <label className="block text-sm text-[#7A7A7A] mb-2">
              Fecha de creación *
            </label>
            <input
              type="datetime-local"
              value={form.createdAt ? form.createdAt.slice(0, 16) : ""}
              onChange={handleCreatedAtChange}
              className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
              style={{ borderColor: "#e1e1e1" }}
              required
            />
          </div>
          {/* Estado de la orden */}
          <div className="mb-6 p-4 border border-[#e1e1e1] rounded-none bg-[#f9f9f9]">
            <label className="block text-sm text-[#7A7A7A] mb-2">
              Estado de la orden *
            </label>
            <div className="flex items-center gap-4">
              <select
                name="orderStatus"
                value={form.orderStatus}
                onChange={handleFieldChange}
                disabled={isOrderStatusUpdating}
                className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2 flex-1"
              >
                <option value={OrderStatus.Processing}>Processing</option>
                <option value={OrderStatus.OnHold}>On Hold</option>
                <option value={OrderStatus.PendingPayment}>Pending Payment</option>
                <option value={OrderStatus.Completed}>Completed</option>
                <option value={OrderStatus.Cancelled}>Cancelled</option>
                <option value={OrderStatus.Refunded}>Refunded</option>
              </select>
              {isOrderStatusUpdating && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
            </div>
            <p className="text-xs text-[#7A7A7A] mt-2">
              El estado se actualiza automáticamente al seleccionar una nueva opción.
            </p>
          </div>
          {/* Permitir ver factura */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowViewInvoice}
                onChange={handleAllowViewInvoiceChange}
                disabled={isAllowViewInvoiceUpdating}
                className="checkbox checkbox-sm border-[#e1e1e1] checked:bg-[#222222] checked:border-[#222222]"
              />
              <span className="text-sm text-[#222222]">
                Permitir ver factura de compra
              </span>
              {isAllowViewInvoiceUpdating && (
                <span className="loading loading-spinner loading-xs ml-2"></span>
              )}
            </label>
          </div>
          {/* Dirección de envío */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "dni",
              "streetAddress",
              "city",
              "state",
              "postalCode",
              "companyName",
            ].map((name) => (
              <div
                key={name}
                className={
                  name === "email" || name === "streetAddress"
                    ? "col-span-2"
                    : ""
                }
              >
                <label
                  htmlFor={name}
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  {name === "firstName"
                    ? "Nombre *"
                    : name === "lastName"
                    ? "Apellidos *"
                    : name === "email"
                    ? "Email *"
                    : name === "phoneNumber"
                    ? "Teléfono *"
                    : name === "dni"
                    ? "DNI *"
                    : name === "streetAddress"
                    ? "Dirección *"
                    : name === "city"
                    ? "Ciudad *"
                    : name === "state"
                    ? "Provincia *"
                    : name === "postalCode"
                    ? "Código Postal *"
                    : name === "companyName"
                    ? "Nombre de Empresa (opcional)"
                    : name}
                </label>
                <input
                  id={name}
                  type={name === "email" ? "email" : "text"}
                  value={
                    form.shippingAddress[name as keyof ShippingAddress] || ""
                  }
                  onChange={handleAddressChange}
                  name={name}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                  required={!["companyName"].includes(name)}
                />
              </div>
            ))}
          </div>
          {/* Métodos de envío y pago */}
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de envío *
              </label>
              <div className="flex flex-col gap-2">
                {[ShippingMethod.Motorcycle, ShippingMethod.ParcelCompany].map(
                  (method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method}
                        checked={form.shippingMethod === method}
                        onChange={handleFieldChange}
                        className="radio border-[#e1e1e1] checked:bg-[#222222]"
                      />
                      <span className="text-[#222222] text-sm">
                        {method === ShippingMethod.Motorcycle
                          ? "Moto"
                          : "Transporte/Empresa de encomienda"}
                        <span className="text-xs text-[#7A7A7A]">
                          {" "}
                          (Costo de envío extra a cargo del Cliente)
                        </span>
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de pago *
              </label>
              <div className="flex flex-col gap-2">
                {[PaymentMethod.BankTransfer, PaymentMethod.CashOnDelivery].map(
                  (method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={form.paymentMethod === method}
                        onChange={handleFieldChange}
                        disabled={isPaymentMethodUpdating}
                        className="radio border-[#e1e1e1] checked:bg-[#222222]"
                      />
                      <span className="text-[#222222] text-sm">
                        {method === PaymentMethod.BankTransfer
                          ? "Transferencia / Depósito bancario"
                          : "Efectivo contra reembolso"}
                        {method === PaymentMethod.BankTransfer && (
                          <span className="text-xs text-[#7A7A7A]">
                            {" "}
                            (4% extra)
                          </span>
                        )}
                      </span>
                      {isPaymentMethodUpdating && (
                        <span className="loading loading-spinner loading-xs ml-2"></span>
                      )}
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
          {/* Campos de entrega */}
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Ventana de entrega (opcional)
              </label>
              <input
                type="text"
                name="deliveryWindow"
                value={form.shippingAddress.deliveryWindow || ""}
                onChange={handleDeliveryFieldChange}
                placeholder="Ej: 9AM-5PM, Lunes a Viernes"
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
              />
            </div>
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Monto declarado de envío (opcional)
              </label>
              <input
                type="text"
                name="declaredShippingAmount"
                value={form.shippingAddress.declaredShippingAmount || ""}
                onChange={handleDeliveryFieldChange}
                placeholder="Ej: $50.00"
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
              />
            </div>
          </div>
          {/* Edición de ítems */}
          <div className="mb-2">
            <label className="block mb-1 text-sm" style={{ color: "#7A7A7A" }}>
              Buscar producto o SKU para agregar variante
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Buscar producto o SKU"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProductSearch(e as React.FormEvent);
                  }
                }}
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
              />
              <button
                type="button"
                className="btn rounded-none shadow-none border-none h-12 px-4 text-white bg-[#222222]"
                onClick={handleProductSearch}
              >
                Buscar
              </button>
              <button
                type="button"
                className="btn rounded-none shadow-none border-none h-12 px-4 text-[#222222] bg-[#e0e0e0]"
                onClick={clearSearchResults}
              >
                Limpiar
              </button>
            </div>
            {searchLoading && (
              <div className="text-[#222222] mt-1">Buscando productos...</div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold mb-1 text-[#222222]">
                  Resultados:
                </div>
                <ul className="space-y-1">
                  {searchResults.map((product) => (
                    <li
                      key={product.id}
                      className="border rounded p-2 bg-white"
                    >
                      <div className="font-medium text-[#222222]">
                        {product.productModel} ({product.sku})
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            className="btn btn-xs btn-outline text-[#222222] border-[#bdbdbd] bg-white rounded-none"
                            onClick={() => handleAddVariant(variant)}
                            disabled={
                              form.items.some(
                                (v) => v.productVariant.id === variant.id
                              ) || itemOperationLoading === variant.id
                            }
                          >
                            {itemOperationLoading === variant.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              `${variant.color.name} (Stock: ${variant.stock})`
                            )}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Lista de variantes seleccionadas */}
          {form.items.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold mb-1 text-[#222222]">
                Ítems de la orden:
              </div>
              <div className="overflow-x-auto">
                <table className="table border border-[#e1e1e1]">
                  {/* head */}
                  <thead>
                    <tr className="text-[#111111]">
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item) => (
                      <tr
                        key={item.productVariant.id}
                        className="text-[#222222]"
                      >
                        <td>
                          <div className="flex flex-col">
                            <span className="font-medium text-[#222222]">
                              {item.productVariant.product.productModel}{" "}
                              {item.productVariant.product.sku}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                Color: {item.productVariant.color.name}
                              </span>
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    item.productVariant.color.hex,
                                }}
                              ></span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {formatCurrency(
                            item.priceUSDAtPurchase,
                            "en-US",
                            "USD"
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.productVariant.id,
                                Number(e.target.value)
                              )
                            }
                            disabled={
                              itemOperationLoading === item.productVariant.id
                            }
                            className="input input-xs w-16 text-[#222222] bg-white border-[#bdbdbd] rounded-md shadow-sm focus:ring-2 focus:ring-[#388e3c] focus:outline-none disabled:opacity-50"
                          />
                        </td>
                        <td>{formatCurrency(item.subTotal, "en-US", "USD")}</td>
                        <td>
                          <button
                            className="btn btn-xs text-white bg-[#d32f2f] border-[#d32f2f] rounded-md shadow-md hover:bg-[#b71c1c] hover:border-[#b71c1c] transition-colors duration-200 ease-in-out"
                            onClick={() =>
                              handleRemoveVariant(item.productVariant.id)
                            }
                            disabled={
                              itemOperationLoading === item.productVariant.id
                            }
                          >
                            {itemOperationLoading === item.productVariant.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Trash size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Subtotal y Total */}
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#222222]">
                Subtotal:
              </span>
              <span className="text-sm text-[#222222]">
                {formatCurrency(form.subTotal, "en-US", "USD")}
              </span>
            </div>
            {form.bankTransferExpense && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold text-[#222222]">
                  Gasto por Transferencia bancaria:
                </span>
                <span className="text-sm text-[#222222]">
                  {formatCurrency(form.bankTransferExpense, "en-US", "USD")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-semibold text-[#222222]">
                Total:
              </span>
              <span className="text-sm text-[#222222]">
                {formatCurrency(form.totalAmount, "en-US", "USD")}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !hasChanges()}
            className="mt-4 btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out text-white bg-[#388e3c] border-[#388e3c] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Guardando..."
              : hasChanges()
              ? "Guardar cambios"
              : "Sin cambios"}
          </button>
        </form>
            </div>
          </div>

          {/* Customer History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-[#111111] mb-4">Customer History</h3>
              
              {/* Customer Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">
                      {form.user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{form.user.displayName}</p>
                    <p className="text-xs text-gray-500">{form.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Analytics Metrics */}
              {isLoadingUserDetails ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : currentUserMetrics ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900">{currentUserMetrics.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(currentUserMetrics.totalRevenue, "en-US", "USD")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(currentUserMetrics.averageOrderValue, "en-US", "USD")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No analytics data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderPage;
