"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useOrders } from "@/hooks/useOrders";
import { PaymentMethod, ShippingMethod, OrderStatus } from "@/enums/order.enum";
import { formatCurrency } from "@/utils/formatCurrency";
import { OrderStatusBadge } from "@/components/atoms/OrderStatusBadge";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { debounce } from "@/utils/debounce";

const SKELETON_COUNT = 6;

const OrdersPage = () => {
  const {
    orders,
    nextCursor,
    loading,
    error,
    statusFilter,
    getOrders,
    setFilter,
    clearOrders,
  } = useOrders();

  const [localStatusFilter, setLocalStatusFilter] = useState<OrderStatus | "">(
    ""
  );

  // Scroll pagination
  const observer = useRef<IntersectionObserver | null>(null);
  const lastOrderRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMore = loading && orders.length > 0;

  // Debounced fetch for next page
  const debouncedLoadMore = useMemo(
    () =>
      debounce(() => {
        if (nextCursor && !loading) {
          getOrders({ status: statusFilter, cursor: nextCursor });
        }
      }, 300),
    [nextCursor, loading, statusFilter, getOrders]
  );

  const loadMore = useCallback(() => {
    debouncedLoadMore();
  }, [debouncedLoadMore]);

  // Observe last order for infinite scroll
  useEffect(() => {
    // Siempre desconectar cualquier observer previo
    if (observer.current) observer.current.disconnect();

    // Solo observar si hay nextCursor (hay más páginas)
    if (nextCursor && !loading && lastOrderRef.current) {
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      });
      observer.current.observe(lastOrderRef.current);
    }
    // Si no hay nextCursor, no observar nada
    return () => observer.current?.disconnect();
  }, [orders, nextCursor, loading, loadMore]);

  // Fetch orders on mount and when filter changes
  useEffect(() => {
    clearOrders();
    getOrders(localStatusFilter ? { status: localStatusFilter } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatusFilter]);

  if (loading && orders.length === 0) return <p>Cargando órdenes...</p>;
  if (error) {
    const errorMsg = typeof error === "string" ? error : error.message;
    return <p>Error: {errorMsg}</p>;
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-[#222222] mb-6">Mis pedidos</h2>
      {/* Filtro por estado */}
      <fieldset className="fieldset mb-4">
        <legend className="fieldset-legend text-[#666666]">
          Filtrar por estado
        </legend>
        <select
          className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2"
          value={localStatusFilter}
          onChange={(e) => {
            setLocalStatusFilter(e.target.value as OrderStatus | "");
            setFilter(
              e.target.value ? (e.target.value as OrderStatus) : undefined
            );
          }}
        >
          <option value="">Todos</option>
          <option value={OrderStatus.Processing}>Procesando</option>
          <option value={OrderStatus.OnHold}>En espera</option>
          <option value={OrderStatus.PendingPayment}>Pendiente de pago</option>
          <option value={OrderStatus.Completed}>Completado</option>
          <option value={OrderStatus.Cancelled}>Cancelado</option>
          <option value={OrderStatus.Refunded}>Reembolsado</option>
        </select>
        <span className="label text-[#666666]">Opcional</span>
      </fieldset>
      {orders.map((order, idx) => {
        const isLast = idx === orders.length - 1;
        return (
          <div
            key={order.id}
            ref={isLast && nextCursor ? lastOrderRef : undefined}
            className="collapse collapse-arrow bg-[#FFFFFF] text-[#222222] border rounded-none mb-4"
          >
            <input type="checkbox" />
            <div className="collapse-title font-semibold flex justify-between items-center">
              <span>Orden #{order.orderNumber}</span>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <div className="collapse-content text-sm">
              <div className="mb-2">
                <strong>Fecha:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="mb-2">
                <strong>Método de pago:</strong>{" "}
                {order.paymentMethod === PaymentMethod.BankTransfer
                  ? "Transferencia bancaria"
                  : "Efectivo"}
              </div>
              <div className="mb-2">
                <strong>Método de envío:</strong>{" "}
                {order.shippingMethod === ShippingMethod.Motorcycle
                  ? "Moto"
                  : "Empresa de encomienda"}
              </div>
              {order.shippingMethod === ShippingMethod.ParcelCompany && (
                <div className="mb-2">
                  <strong>Empresa de encomienda:</strong>{" "}
                  {order.shippingAddress.shippingCompany}
                </div>
              )}
              {order.shippingMethod === ShippingMethod.ParcelCompany && (
                <div className="mb-2">
                  <strong>Valor declarado:</strong>{" "}
                  {order.shippingAddress.declaredShippingAmount}
                </div>
              )}
              {order.shippingMethod === ShippingMethod.Motorcycle && (
                <div className="mb-2">
                  <strong>Franja horaria de entrega:</strong>{" "}
                  {order.shippingAddress.deliveryWindow}
                </div>
              )}
              <div className="mb-2">
                <strong>Dirección de envío:</strong>
                <div className="ml-2">
                  <div>
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </div>
                  <div>
                    {order.shippingAddress.streetAddress},{" "}
                    {order.shippingAddress.city}, {order.shippingAddress.state}.{" "}
                    {order.shippingAddress.postalCode}.
                  </div>
                  <div>Email: {order.shippingAddress.email}</div>
                  <div>Tel: {order.shippingAddress.phoneNumber}</div>
                  <div>DNI: {order.shippingAddress.dni}</div>
                </div>
              </div>
              <div className="mb-2">
                <strong>Ítems:</strong>
                <ul className="ml-4 list-disc">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      <div>
                        <span className="font-medium">
                          {item.productVariant.product.productModel}{" "}
                          {item.productVariant.product.sku}
                        </span>{" "}
                        - Cantidad: {item.quantity}
                      </div>
                      <div>
                        Color:{" "}
                        <span style={{ color: item.productVariant.color.hex }}>
                          {item.productVariant.color.name}
                        </span>
                      </div>
                      <div>
                        Precio unitario:{" "}
                        {formatCurrency(
                          item.priceUSDAtPurchase,
                          "en-US",
                          "USD"
                        )}
                      </div>
                      <div>
                        Subtotal:{" "}
                        {formatCurrency(item.subTotal, "es-AR", "ARS")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 border-t pt-2 text-sm">
                <div>
                  <strong>Subtotal:</strong>{" "}
                  {formatCurrency(order.subTotal, "es-AR", "ARS")}
                </div>
                {order.paymentMethod === PaymentMethod.BankTransfer && (
                  <div>
                    <strong>Gasto por transferencia bancaria:</strong>{" "}
                    {formatCurrency(
                      order.bankTransferExpense ?? 0,
                      "es-AR",
                      "ARS"
                    )}
                  </div>
                )}
                <div>
                  <strong>Total:</strong>{" "}
                  {formatCurrency(order.totalAmount, "es-AR", "ARS")}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Última actualización:{" "}
                {new Date(order.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
      {loading &&
        orders.length === 0 &&
        Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
          <div
            key={idx}
            className="collapse collapse-arrow bg-[#FFFFFF] text-[#222222] border rounded-none mb-4 animate-pulse"
          >
            <div className="collapse-title font-semibold flex justify-between items-center">
              <span className="w-32 h-4 bg-gray-200 rounded"></span>
              <span className="w-16 h-4 bg-gray-200 rounded"></span>
            </div>
            <div className="collapse-content text-sm">
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/3 bg-gray-200 rounded mb-2"></div>
            </div>
          </div>
        ))}
      {isLoadingMore && (
        <div className="flex justify-center py-4 text-[#888888]">
          <LoadingSpinner />
        </div>
      )}
      {!nextCursor && !loading && orders.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay más órdenes.
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
