import { OrderStatus, PaymentMethod, ShippingMethod } from "@/enums/order.enum";
import { UserRole, UserStatus } from "@/enums/user.enum";

export interface Order {
  id: string;
  orderNumber: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole.User | UserRole.Admin;
    status: UserStatus;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  orderStatus: OrderStatus;
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
    };
  };
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
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
}

export interface CreateOrderPayload {
  shippingMethod: ShippingMethod;
  shippingAddress: {
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
  };
  paymentMethod: PaymentMethod;
}

export interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
}
