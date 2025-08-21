import { OrderStatus, PaymentMethod, ShippingMethod, DeliveryType } from '@enums/order.enum';
import { IAddress } from '@interfaces/address';
import { Types } from 'mongoose';

export interface CreateOrderDto {
  shippingMethod: ShippingMethod;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  shippingAddress: IAddress; // Solo objeto, no ObjectId
  paymentMethod: PaymentMethod;
}

// DTO para que el admin cree órdenes directamente con ProductVariants
export interface CreateOrderItemAdminDto {
  productVariantId: Types.ObjectId;
  quantity: number;
}

export interface CreateOrderAdminDto {
  userId: Types.ObjectId;
  items: CreateOrderItemAdminDto[];
  shippingMethod: ShippingMethod;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  shippingAddress: IAddress;
  paymentMethod: PaymentMethod;
  createdAt?: Date; // Fecha personalizada para la orden
  allowViewInvoice?: boolean; // Permitir ver factura al crear
}

// DTOs para actualización completa de órdenes
export interface UpdateOrderItemDto {
  productVariantId: Types.ObjectId;
  action: 'increase' | 'decrease' | 'remove' | 'add' | 'set' | 'update_prices' | 'update_all';
  quantity?: number; // Para 'add', 'increase', 'decrease', 'set'
  // Nuevos campos para actualización de precios y valores financieros
  costUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  priceUSDAtPurchase?: number; // Para 'update_prices', 'update_all'
  subTotal?: number; // Para 'update_all' (override manual del subtotal)
  gainUSD?: number; // Para 'update_all' (override manual de la ganancia)
}

export interface UpdateOrderDto {
  orderStatus?: OrderStatus;
  items?: UpdateOrderItemDto[];
  createdAt?: Date;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  shippingAddress?: IAddress;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  allowViewInvoice?: boolean;
}

// DTO para actualización masiva de estados de órdenes
export interface BulkUpdateOrderStatusDto {
  orderIds: Types.ObjectId[];
  newStatus: OrderStatus;
}

// DTO de respuesta para un item de la orden
export interface ProductBaseResponse {
  id: string;
  slug: string;
  thumbnail: string;
  productModel: string;
  sku: string;
  size?: string | undefined;
}
export interface ProductVariantResponse {
  id: string;
  color: { name: string; hex: string };
  images: string[];
  priceUSD: number;
  product: ProductBaseResponse;
}
export interface OrderItemResponse {
  productVariant: ProductVariantResponse;
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  gainUSD: number;
}

// DTO seguro para exponer datos de usuario en respuestas de orden
export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  phone?: string;
  role: string;
  status: string;
}

export interface AddressResponse {
  firstName: string;
  lastName: string;
  companyName?: string | undefined;
  email: string;
  phoneNumber: string;
  dni: string;
  streetAddress?: string | undefined; // Ahora opcional
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string | undefined;
  declaredShippingAmount?: string | undefined;
  deliveryWindow?: string | undefined;
  deliveryType?: DeliveryType | undefined; // Nuevo campo
  pickupPointAddress?: string | undefined; // Nuevo campo
}

// DTO de respuesta general para una orden
export interface OrderResponseDto {
  id: string;
  orderNumber: number;
  user: UserResponse; // Ahora es el DTO seguro
  items: OrderItemResponse[];
  shippingAddress: AddressResponse;
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

// Versiones para usuario usando Omit
export type OrderItemUserResponse = Omit<OrderItemResponse, 'costUSDAtPurchase' | 'gainUSD'>;

export type OrderUserResponseDto = Omit<OrderResponseDto, 'totalGainUSD' | 'items'> & {
  items: OrderItemUserResponse[];
};

// DTO de respuesta para actualización masiva
export interface BulkUpdateOrderStatusResponseDto {
  successfulUpdates: string[]; // IDs de órdenes actualizadas exitosamente
  failedUpdates: {
    orderId: string;
    error: string;
  }[]; // IDs de órdenes que fallaron con sus errores
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
}

// DTOs para manejo de conflictos de stock en cambios de estado
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

export interface OrderStatusUpdateResultDto {
  success: boolean;
  order?: OrderResponseDto;
  stockConflicts?: StockConflictItem[];
  message: string;
}
