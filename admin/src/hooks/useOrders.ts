import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchOrders,
  updateOrder,
  setStatusFilter,
  resetOrders,
  createOrderAsAdmin,
  fetchOrderById,
  bulkUpdateOrderStatus,
  checkOrderStockAvailability,
  updateOrderStatusWithConflictHandling,
  clearStockAvailability,
  CreateOrderAdminPayload,
} from "@/redux/slices/orderSlice";
import type { 
  Order, 
  UpdateOrderPayload, 
  BulkUpdateOrderStatusPayload, 
  BulkUpdateOrderStatusResponse,
  StockAvailabilityResponse,
  OrderStatusUpdateResult
} from "@/interfaces/order";
import { OrderStatus } from "@/enums/order.enum";

const useOrders = () => {
  const dispatch = useAppDispatch();

  // Selectores
  const orders = useAppSelector((state) => state.orders.orders);
  const orderById = useAppSelector((state) => state.orders.orderById);
  const nextCursor = useAppSelector((state) => state.orders.nextCursor);
  const loading = useAppSelector((state) => state.orders.loading);
  const bulkUpdateLoading = useAppSelector((state) => state.orders.bulkUpdateLoading);
  const error = useAppSelector((state) => state.orders.error);
  const statusFilter = useAppSelector((state) => state.orders.statusFilter);
  const stockAvailability = useAppSelector((state) => state.orders.stockAvailability);
  const stockCheckLoading = useAppSelector((state) => state.orders.stockCheckLoading);
  const stockCheckError = useAppSelector((state) => state.orders.stockCheckError);
  const getOrderById = useCallback(
    (orderId: string) => {
      dispatch(fetchOrderById(orderId));
    },
    [dispatch]
  );

  // Actions
  const getOrders = useCallback(
    (params?: { status?: OrderStatus; cursor?: string; limit?: number }) => {
      dispatch(fetchOrders(params));
    },
    [dispatch]
  );

  const updateOrderData = useCallback(
    (payload: UpdateOrderPayload) => {
      return dispatch(updateOrder(payload));
    },
    [dispatch]
  );

  const setFilter = useCallback(
    (status?: OrderStatus) => {
      dispatch(setStatusFilter(status));
    },
    [dispatch]
  );

  const clearOrders = useCallback(() => {
    dispatch(resetOrders());
  }, [dispatch]);

  const bulkUpdateOrderStatusData = useCallback(
    (
      payload: BulkUpdateOrderStatusPayload,
      onSuccess?: (response: BulkUpdateOrderStatusResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(bulkUpdateOrderStatus(payload))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const checkStockAvailability = useCallback(
    (
      orderId: string,
      onSuccess?: (response: StockAvailabilityResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(checkOrderStockAvailability(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const updateOrderStatusWithConflicts = useCallback(
    (
      orderId: string,
      newStatus: OrderStatus,
      onSuccess?: (response: OrderStatusUpdateResult) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(updateOrderStatusWithConflictHandling({ orderId, newStatus }))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const clearStockInfo = useCallback(() => {
    dispatch(clearStockAvailability());
  }, [dispatch]);

  return {
    orders,
    orderById,
    nextCursor,
    loading,
    bulkUpdateLoading,
    error,
    statusFilter,
    stockAvailability,
    stockCheckLoading,
    stockCheckError,
    getOrders,
    getOrderById,
    updateOrderData,
    bulkUpdateOrderStatusData,
    checkStockAvailability,
    updateOrderStatusWithConflicts,
    clearStockInfo,
    setFilter,
    clearOrders,
    createOrderAsAdmin: useCallback(
      (
        payload: CreateOrderAdminPayload,
        onSuccess?: (order: Order) => void,
        onError?: (err: unknown) => void
      ) => {
        dispatch(createOrderAsAdmin(payload))
          .unwrap()
          .then((order) => {
            if (onSuccess) onSuccess(order);
          })
          .catch((err) => {
            if (onError) onError(err);
          });
      },
      [dispatch]
    ),
  };
};

export default useOrders;
