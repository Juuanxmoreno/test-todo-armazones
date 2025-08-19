import { z } from "zod";
import { ShippingMethod } from "@/enums/order.enum";

export const addressSchema = z
  .object({
    firstName: z.string().min(1, "Nombre requerido"),
    lastName: z.string().min(1, "Apellido requerido"),
    email: z.string().email("Email inválido"),
    phoneNumber: z.string().min(1, "Teléfono requerido"),
    dni: z.string().min(1, "DNI requerido"),
    streetAddress: z.string().min(1, "Dirección requerida"),
    city: z.string().min(1, "Ciudad requerida"),
    state: z.string().min(1, "Provincia requerida"),
    postalCode: z.string().min(1, "Código postal requerido"),
    companyName: z.string().optional(),
    shippingCompany: z.string().optional(),
    declaredShippingAmount: z.string().optional(),
    deliveryWindow: z.string().optional(),
    // Agregamos shippingMethod solo para validación contextual
    shippingMethod: z.nativeEnum(ShippingMethod),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod === ShippingMethod.ParcelCompany && !data.shippingCompany) {
      ctx.addIssue({
        path: ["shippingCompany"],
        code: z.ZodIssueCode.custom,
        message: "Transporte / Empresa de encomienda es requerido",
      });
    }
  });

export type AddressFormData = z.infer<typeof addressSchema>;
