import { IOrder, IOrderItem } from '@interfaces/order';
import { Schema, model, Document, Types } from 'mongoose';
import { OrderStatus, PaymentMethod, ShippingMethod } from '@enums/order.enum';

// Interfaz extendida para Mongoose
export interface IOrderDocument extends Omit<IOrder, 'items' | 'shippingAddress'>, Document {
  _id: Types.ObjectId;
  items: Types.DocumentArray<IOrderItemDocument>;
  shippingAddress: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItemDocument extends Omit<IOrderItem, 'productVariant'>, Document {
  productVariant: Types.ObjectId;
}

// Usa IOrderItem aquí para evitar conflicto con DocumentArray
const orderItemSchema = new Schema<IOrderItem>(
  {
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    subTotal: { type: Number, required: true },
    costUSDAtPurchase: { type: Number, required: true },
    priceUSDAtPurchase: { type: Number, required: true },
    gainUSD: { type: Number, required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: Object.values(ShippingMethod),
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    subTotal: { type: Number, required: true, default: 0 },
    bankTransferExpense: { type: Number, required: false },
    totalAmount: { type: Number, required: true, default: 0 },
    totalGainUSD: { type: Number, required: true, default: 0 },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Processing,
    },
    allowViewInvoice: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Índices para optimizar consultas de analytics
orderSchema.index({ createdAt: 1, orderStatus: 1 }); // Para filtrar por fecha y estado
orderSchema.index({ createdAt: -1 }); // Para ordenamiento por fecha descendente

const Order = model<IOrderDocument>('Order', orderSchema);

export default Order;
