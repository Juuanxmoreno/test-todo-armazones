import { z } from 'zod';
import { Types } from 'mongoose';

// Helper para validar ObjectId
const ObjectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

export const GenerateCatalogRequestSchema = {
  body: z
    .object({
      categories: z
        .union([
          z.array(ObjectIdSchema),
          z.string().transform((str) => {
            try {
              const parsed = JSON.parse(str);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }),
        ])
        .optional()
        .default([]), // Aseguramos que sea un array vacío si no se proporciona
      subcategories: z
        .union([
          z.array(ObjectIdSchema),
          z.string().transform((str) => {
            try {
              const parsed = JSON.parse(str);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }),
        ])
        .optional()
        .default([]), // Aseguramos que sea un array vacío si no se proporciona
    })
    .superRefine((data, ctx) => {
      // Validación personalizada: al menos una de las dos propiedades debe tener valores
      if (data.categories.length === 0 && data.subcategories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe especificar al menos una categoría o subcategoría',
          path: ['categories'], // Indica dónde ocurrió el error
        });
      }
    }),
};
