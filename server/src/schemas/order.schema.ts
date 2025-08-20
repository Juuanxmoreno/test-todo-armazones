import { z } from 'zod';
import { ShippingMethod, PaymentMethod, OrderStatus, DeliveryType } from '@enums/order.enum';
import { Types } from 'mongoose';

// Schema base para dirección con validación condicional
const baseAddressSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder los 50 caracteres'),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(50, 'El apellido no puede exceder los 50 caracteres'),
  companyName: z.string().max(50, 'El nombre de la empresa no puede exceder los 50 caracteres').optional(),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .max(100, 'El correo electrónico no puede exceder los 100 caracteres'),
  phoneNumber: z
    .string()
    .min(1, 'El número de teléfono es obligatorio')
    .max(20, 'El número de teléfono no puede exceder los 20 caracteres'),
  dni: z.string().min(1, 'El DNI es obligatorio').max(20, 'El DNI no puede exceder los 20 caracteres'),
  city: z.string().min(1, 'La ciudad es obligatoria').max(50, 'La ciudad no puede exceder los 50 caracteres'),
  state: z.string().min(1, 'El estado es obligatorio').max(50, 'El estado no puede exceder los 50 caracteres'),
  postalCode: z
    .string()
    .min(1, 'El código postal es obligatorio')
    .max(20, 'El código postal no puede exceder los 20 caracteres'),
  shippingCompany: z.string().max(50, 'La empresa de envío no puede exceder los 50 caracteres').optional(),
  declaredShippingAmount: z
    .string()
    .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
    .optional(),
  deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
  deliveryType: z.nativeEnum(DeliveryType).optional(),
  streetAddress: z.string().max(100, 'La dirección no puede exceder los 100 caracteres').optional(),
  pickupPointAddress: z
    .string()
    .max(200, 'La dirección del punto de retiro no puede exceder los 200 caracteres')
    .optional(),
});

// Schema con validación condicional para tipos de entrega
const addressSchema = baseAddressSchema
  .refine(
    (data) => {
      // Si deliveryType es HOME_DELIVERY o no está definido (por defecto es HOME_DELIVERY), streetAddress es obligatorio
      if (!data.deliveryType || data.deliveryType === DeliveryType.HomeDelivery) {
        return !!data.streetAddress;
      }
      return true;
    },
    {
      message: 'La dirección es obligatoria cuando el tipo de entrega es a domicilio',
      path: ['streetAddress'],
    },
  )
  .refine(
    (data) => {
      // Si deliveryType es PICKUP_POINT, pickupPointAddress es obligatorio
      if (data.deliveryType === DeliveryType.PickupPoint) {
        return !!data.pickupPointAddress;
      }
      return true;
    },
    {
      message: 'La dirección del punto de retiro es obligatoria cuando el tipo de entrega es punto de retiro',
      path: ['pickupPointAddress'],
    },
  );

export const createOrderBodySchema = z.object({
  shippingMethod: z.nativeEnum(ShippingMethod),
  shippingAddress: addressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const createOrderAdminBodySchema = z.object({
  userId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El userId debe ser un ObjectId válido',
  }),
  items: z
    .array(
      z.object({
        productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: 'El productVariantId debe ser un ObjectId válido',
        }),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
      }),
    )
    .min(1, 'Debe especificar al menos un item'),
  shippingMethod: z.nativeEnum(ShippingMethod),
  shippingAddress: addressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  createdAt: z
    .string()
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      {
        message: 'La fecha debe ser un string de fecha válido (formato ISO)',
      },
    )
    .optional(),
  allowViewInvoice: z.boolean().optional(),
});

export const getAllOrdersParamsSchema = z.object({
  cursor: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: 'El cursor debe ser un ObjectId válido',
    })
    .optional(),
  limit: z.number().min(1, 'El límite debe ser al menos 1').optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

export const updateOrderParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

export const updateOrderBodySchema = z.object({
  orderStatus: z.enum(Object.values(OrderStatus) as string[]).optional(),
  items: z
    .array(
      z
        .object({
          productVariantId: z.string().refine((val) => Types.ObjectId.isValid(val), {
            message: 'El productVariantId debe ser un ObjectId válido',
          }),
          action: z.enum(['increase', 'decrease', 'remove', 'add', 'set'], {
            message: 'La acción debe ser: increase, decrease, remove, add o set',
          }),
          quantity: z.number().min(1, 'La cantidad debe ser mayor a 0').optional(),
        })
        .refine(
          (data) => {
            // Para 'add', 'increase', 'decrease', 'set' la cantidad es requerida
            if (['add', 'increase', 'decrease', 'set'].includes(data.action)) {
              return data.quantity !== undefined;
            }
            return true;
          },
          {
            message: 'La cantidad es requerida para las acciones: add, increase, decrease, set',
          },
        ),
    )
    .optional(),
  createdAt: z
    .string()
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      {
        message: 'La fecha debe ser un string de fecha válido (formato ISO)',
      },
    )
    .optional(),
  shippingMethod: z.nativeEnum(ShippingMethod).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  shippingAddress: z
    .object({
      firstName: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder los 50 caracteres'),
      lastName: z
        .string()
        .min(1, 'El apellido es obligatorio')
        .max(50, 'El apellido no puede exceder los 50 caracteres'),
      companyName: z.string().max(50, 'El nombre de la empresa no puede exceder los 50 caracteres').optional(),
      email: z
        .string()
        .email('El correo electrónico no es válido')
        .max(100, 'El correo electrónico no puede exceder los 100 caracteres'),
      phoneNumber: z
        .string()
        .min(1, 'El número de teléfono es obligatorio')
        .max(20, 'El número de teléfono no puede exceder los 20 caracteres'),
      dni: z.string().min(1, 'El DNI es obligatorio').max(20, 'El DNI no puede exceder los 20 caracteres'),
      streetAddress: z
        .string()
        .min(1, 'La dirección es obligatoria')
        .max(100, 'La dirección no puede exceder los 100 caracteres'),
      city: z.string().min(1, 'La ciudad es obligatoria').max(50, 'La ciudad no puede exceder los 50 caracteres'),
      state: z.string().min(1, 'El estado es obligatorio').max(50, 'El estado no puede exceder los 50 caracteres'),
      postalCode: z
        .string()
        .min(1, 'El código postal es obligatorio')
        .max(20, 'El código postal no puede exceder los 20 caracteres'),
      shippingCompany: z.string().max(50, 'La empresa de envío no puede exceder los 50 caracteres').optional(),
      declaredShippingAmount: z
        .string()
        .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
        .optional(),
      deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
    })
    .optional(),
  deliveryWindow: z.string().max(50, 'La ventana de entrega no puede exceder los 50 caracteres').optional(),
  declaredShippingAmount: z
    .string()
    .max(20, 'El monto declarado de envío no puede exceder los 20 caracteres')
    .optional(),
  allowViewInvoice: z.boolean().optional(),
});

export const bulkUpdateOrderStatusBodySchema = z.object({
  orderIds: z
    .array(
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: 'Cada orderId debe ser un ObjectId válido',
      }),
    )
    .min(1, 'Debe especificar al menos una orden')
    .max(100, 'No se pueden actualizar más de 100 órdenes a la vez'),
  newStatus: z.enum(Object.values(OrderStatus) as string[], {
    message: 'El estado debe ser uno de los valores válidos',
  }),
});

// Schema para verificar disponibilidad de stock
export const checkStockAvailabilityParamsSchema = z.object({
  orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'El orderId debe ser un ObjectId válido',
  }),
});

// Schema para actualizar estado con manejo de conflictos
export const updateOrderStatusWithConflictsBodySchema = z.object({
  orderStatus: z.enum(Object.values(OrderStatus) as string[], {
    message: 'El estado debe ser uno de los valores válidos',
  }),
});
