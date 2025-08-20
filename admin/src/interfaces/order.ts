import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
} from "@/enums/order.enum";
import { UserStatus } from "@/enums/user.enum";

export interface Order {
  id: string;
  orderNumber: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "USER" | "ADMIN";
    status: UserStatus;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  totalGainUSD: number;
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productVariant: {
    id: string;
    color: {
      name: string;
      hex: string;
    };
    images: string[];
    product: {
      id: string;
      slug: string;
      thumbnail: string;
      productModel: string;
      sku: string;
      size?: string;
      costUSD: number;
      priceUSD: number;
      primaryImage: string;
    };
  };
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  gainUSD: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  dni: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: DeliveryType; // Nuevo campo
  pickupPointAddress?: string; // Nuevo campo
}

// Payload para actualizar items de la orden
export interface UpdateOrderItemPayload {
  productVariantId: string;
  action: "increase" | "decrease" | "remove" | "add" | "set";
  quantity?: number;
}

export interface UpdateOrderPayload {
  orderId: string;
  orderStatus?: OrderStatus;
  items?: UpdateOrderItemPayload[];
  createdAt?: string;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  shippingAddress?: ShippingAddress;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  allowViewInvoice?: boolean;
}

export interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
}

// Payload para actualización masiva de estados
export interface BulkUpdateOrderStatusPayload {
  orderIds: string[];
  newStatus: OrderStatus;
}

// Respuesta de la actualización masiva
export interface BulkUpdateOrderStatusResponse {
  successfulUpdates: string[];
  failedUpdates: {
    orderId: string;
    error: string;
  }[];
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
}

// Conflictos de stock
export interface StockConflictItem {
  productVariantId: string;
  requiredQuantity: number;
  availableStock: number;
  productInfo: {
    productModel: string;
    sku: string;
    color: { name: string; hex: string };
  };
}

// Respuesta de verificación de stock
export interface StockAvailabilityResponse {
  hasConflicts: boolean;
  conflicts: StockConflictItem[];
}

// Respuesta de actualización de estado con manejo de conflictos
export interface OrderStatusUpdateResult {
  success: boolean;
  order?: Order;
  stockConflicts?: StockConflictItem[];
  message: string;
}
