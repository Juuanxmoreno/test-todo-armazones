import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder los 100 caracteres'),
    confirmPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder los 100 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Debe ser un correo válido').max(100, 'El correo no puede exceder los 100 caracteres'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder los 100 caracteres'),
});
