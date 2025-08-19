// src/app/orders/page.tsx
"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/atoms/OrderStatusBadge";
import { OrderStatus, PaymentMethod, ShippingMethod } from "@/enums/order.enum";
import useOrders from "@/hooks/useOrders";
import { debounce } from "@/utils/debounce";
import { formatCurrency } from "@/utils/formatCurrency";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { Eye, X } from "lucide-react";
import { OrderItem } from "@/interfaces/order";
import { downloadOrderPDF } from "@/utils/downloadOrderPDF";
import Image from "next/image";

const OrdersPage = () => {
  const {
    orders,
    nextCursor,
    loading,
    bulkUpdateLoading,
    error,
    statusFilter,
    getOrders,
    setFilter,
    clearOrders,
    bulkUpdateOrderStatusData,
  } = useOrders();

  const [previewOrder, setPreviewOrder] = useState<any | null>(null); // Orden para modal
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<OrderStatus | "">("");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastOrderRef = useRef<HTMLTableRowElement | null>(null);
  const isLoadingMore = loading && orders.length > 0;

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

  useEffect(() => {
    if (!nextCursor || loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    if (lastOrderRef.current) {
      observer.current.observe(lastOrderRef.current);
    }
    return () => observer.current?.disconnect();
  }, [orders, nextCursor, loading, loadMore]);

  useEffect(() => {
    clearOrders();
    getOrders(statusFilter ? { status: statusFilter } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCheckboxChange = (orderId: string, isChecked: boolean) => {
    setSelectedOrders((prev) =>
      isChecked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handleBatchAction = () => {
    if (batchAction && selectedOrders.length > 0) {
      bulkUpdateOrderStatusData(
        {
          orderIds: selectedOrders,
          newStatus: batchAction as OrderStatus,
        },
        (response) => {
          // Manejar éxito
          const { successfulUpdates, failedUpdates } = response;

          if (successfulUpdates.length > 0) {
            alert(
              `✅ ${successfulUpdates.length} órdenes actualizadas exitosamente.`
            );
          }

          if (failedUpdates.length > 0) {
            const errorMessages = failedUpdates
              .map((f) => `#${f.orderId}: ${f.error}`)
              .join("\n");
            alert(
              `⚠️ ${failedUpdates.length} órdenes fallaron:\n${errorMessages}`
            );
          }

          // Limpiar selección
          setSelectedOrders([]);
          setBatchAction("");
        },
        (error) => {
          // Manejar error
          console.error("Error en bulk update:", error);
          alert("❌ Error al actualizar las órdenes. Intenta de nuevo.");
        }
      );
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-[#111111] font-bold text-2xl mb-4">
        Órdenes de clientes
      </h1>

      {error && <div className="p-4 text-center text-error">{error}</div>}

      {/* Filtro */}
      <div className="flex justify-between items-center mb-4">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-[#666666]">
            Filtrar por estado
          </legend>
          <select
            className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2"
            value={statusFilter || ""}
            onChange={(e) =>
              setFilter(
                e.target.value ? (e.target.value as OrderStatus) : undefined
              )
            }
          >
            <option value="">All</option>
            <option value={OrderStatus.Processing}>Processing</option>
            <option value={OrderStatus.OnHold}>On Hold</option>
            <option value={OrderStatus.PendingPayment}>Pending Payment</option>
            <option value={OrderStatus.Completed}>Completed</option>
            <option value={OrderStatus.Cancelled}>Cancelled</option>
            <option value={OrderStatus.Refunded}>Refunded</option>
          </select>
        </fieldset>
        <Link
          href="/orders/create"
          className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none"
        >
          Crear Orden
        </Link>
      </div>

      {/* Acciones en lote */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <select
            className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2"
            value={batchAction}
            onChange={(e) => setBatchAction(e.target.value as OrderStatus | "")}
          >
            <option value="">Acciones en lote</option>
            <option value={OrderStatus.Processing}>
              Marcar como Processing
            </option>
            <option value={OrderStatus.OnHold}>Marcar como On Hold</option>
            <option value={OrderStatus.PendingPayment}>
              Marcar como Pending Payment
            </option>
            <option value={OrderStatus.Completed}>Marcar como Completed</option>
            <option value={OrderStatus.Cancelled}>Marcar como Cancelled</option>
            <option value={OrderStatus.Refunded}>Marcar como Refunded</option>
          </select>
          {selectedOrders.length > 0 && (
            <span className="text-sm text-[#666666]">
              ({selectedOrders.length} seleccionadas)
            </span>
          )}
        </div>
        <button
          className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none"
          onClick={handleBatchAction}
          disabled={
            !batchAction || selectedOrders.length === 0 || bulkUpdateLoading
          }
        >
          {bulkUpdateLoading ? "Aplicando..." : "Aplicar"}
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="table border border-[#e1e1e1]">
          <thead>
            <tr className="border-b border-[#e1e1e1]">
              <th>
                <input
                  type="checkbox"
                  className="checkbox checkbox-neutral"
                  onChange={(e) =>
                    setSelectedOrders(
                      e.target.checked ? orders.map((o) => o.id) : []
                    )
                  }
                  checked={
                    selectedOrders.length > 0 &&
                    selectedOrders.length === orders.length
                  }
                />
              </th>
              <th className="text-[#222222]">Orden</th>
              <th className="text-[#222222]">Fecha</th>
              <th className="text-[#222222]">Estado</th>
              <th className="text-[#222222]">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const isLast = idx === orders.length - 1;
              return (
                <tr
                  key={order.id}
                  ref={isLast && nextCursor ? lastOrderRef : undefined}
                  className="text-[#333333] border-b border-[#e1e1e1]"
                >
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-neutral"
                      onChange={(e) =>
                        handleCheckboxChange(order.id, e.target.checked)
                      }
                      checked={selectedOrders.includes(order.id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Link
                          href={`orders/edit/${order.id}`}
                          className="font-bold text-[#2271B1]"
                        >
                          #{order.orderNumber} -{" "}
                          {order.shippingAddress.firstName}
                        </Link>
                      </div>
                      <button
                        className="btn btn-xs bg-transparent border-none shadow-none text-[#2271B1]"
                        onClick={() => setPreviewOrder(order)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    {order.allowViewInvoice && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="text-xs text-[#999999] hover:underline flex items-center gap-1 cursor-pointer"
                          onClick={() => downloadOrderPDF(order.id)}
                        >
                          <Image
                            src="/pdf.svg"
                            alt="PDF Icon"
                            width={16}
                            height={16}
                          />
                          Ver factura
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="text-[#555555]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="text-[#555555]">
                    {formatCurrency(order.totalAmount, "en-US", "USD")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && orders.length === 0 && (
        <div className="p-4 text-center text-[#666666]">
          <LoadingSpinner />
        </div>
      )}

      {isLoadingMore && (
        <div className="flex justify-center py-4 text-[#666666]">
          <LoadingSpinner />
        </div>
      )}

      {!nextCursor && !loading && orders.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay más órdenes.
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay órdenes
        </div>
      )}

      {/* Modal Preview */}
      {previewOrder && (
        <dialog id="preview_modal" className="modal modal-open">
          <div
            className="modal-box max-w-3xl rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Orden #{previewOrder.orderNumber}
              </h3>
              <div className="flex items-center gap-4 h-full">
                <OrderStatusBadge status={previewOrder.orderStatus} />
                <button
                  className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
                  onClick={() => setPreviewOrder(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-12 gap-4">
              {/* Client Details */}
              <div className="col-span-5">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Datos del cliente:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong> {previewOrder.user.firstName}{" "}
                  {previewOrder.user.lastName}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${previewOrder.user.email}`}
                    className="text-[#2271B1] hover:underline"
                  >
                    {previewOrder.user.email}
                  </a>
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>DNI:</strong> {previewOrder.user.dni || "N/A"}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Teléfono:</strong> {previewOrder.user.phone || "N/A"}
                </p>
              </div>

              {/* Shipping Details */}
              <div className="col-span-7">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Detalles de envío:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong>{" "}
                  {previewOrder.shippingAddress.firstName}{" "}
                  {previewOrder.shippingAddress.lastName}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Dirección:</strong>{" "}
                  {previewOrder.shippingAddress.streetAddress},{" "}
                  {previewOrder.shippingAddress.city},{" "}
                  {previewOrder.shippingAddress.state}{" "}
                  {previewOrder.shippingAddress.postalCode}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Método de envío:</strong>{" "}
                  {previewOrder.shippingMethod ===
                    ShippingMethod.ParcelCompany &&
                    "Transporte / Empresa de encomienda"}
                  {previewOrder.shippingMethod === ShippingMethod.Motorcycle &&
                    "Moto"}
                </p>
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.shippingCompany && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Empresa de encomienda:</strong>{" "}
                      {previewOrder.shippingAddress.shippingCompany}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.declaredShippingAmount && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Monto declarado:</strong>{" "}
                      {previewOrder.shippingAddress.declaredShippingAmount}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.deliveryWindow && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Ventana de entrega:</strong>{" "}
                      {previewOrder.shippingAddress.deliveryWindow}
                    </p>
                  )}
                <p className="mb-2 text-[#333333]">
                  <strong>Método de pago:</strong>{" "}
                  {previewOrder.paymentMethod ===
                    PaymentMethod.CashOnDelivery && "Efectivo contra reembolso"}
                  {previewOrder.paymentMethod === PaymentMethod.BankTransfer &&
                    "Transferencia / Depósito bancario (4% extra)"}
                </p>
              </div>
            </div>
            <div className="p-4">
              {previewOrder.items.length > 0 && (
                <div className="mb-4">
                  <div className="overflow-x-auto">
                    <table className="table border border-[#e1e1e1]">
                      <thead>
                        <tr className="border-b border-[#e1e1e1]">
                          <th className="text-[#222222]">Producto</th>
                          <th className="text-[#222222]">Cantidad</th>
                          <th className="text-[#222222]">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewOrder.items.map(
                          (item: OrderItem, index: number) => (
                            <tr
                              key={index}
                              className="text-[#333333] border-b border-[#e1e1e1]"
                            >
                              <td>
                                <div className="flex flex-col">
                                  <strong>
                                    {item.productVariant.product.productModel}{" "}
                                    {item.productVariant.product.sku}
                                  </strong>
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
                              <td>{item.quantity}</td>
                              <td>
                                {formatCurrency(item.subTotal, "en-US", "USD")}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="mb-2 text-[#333333]">
                <strong>Subtotal:</strong>{" "}
                {formatCurrency(previewOrder.subTotal, "en-US", "USD")}
              </p>
              {previewOrder.bankTransferExpense && (
                <p className="mb-2 text-[#333333]">
                  <strong>Gastos de Transferencia Bancaria:</strong>{" "}
                  {formatCurrency(
                    previewOrder.bankTransferExpense,
                    "en-US",
                    "USD"
                  )}
                </p>
              )}
              <p className="mb-2 text-[#333333]">
                <strong>Total:</strong>{" "}
                {formatCurrency(previewOrder.totalAmount, "en-US", "USD")}
              </p>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default OrdersPage;
