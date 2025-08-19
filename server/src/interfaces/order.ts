import { OrderStatus, PaymentMethod, ShippingMethod } from '@enums/order.enum';
import { Types } from 'mongoose';

export interface IOrderItem {
  productVariant: Types.ObjectId;
  quantity: number;
  subTotal: number;
  costUSDAtPurchase: number;
  priceUSDAtPurchase: number;
  gainUSD: number;
}

export interface IOrder {
  orderNumber: number;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: Types.ObjectId;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  subTotal: number;
  bankTransferExpense?: number;
  totalAmount: number;
  totalGainUSD: number;
  orderStatus: OrderStatus;
  allowViewInvoice: boolean;
}
