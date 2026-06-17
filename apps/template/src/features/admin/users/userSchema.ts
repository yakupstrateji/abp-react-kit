import { z } from 'zod'

export const createUserSchema = z.object({
  userName: z.string().min(1, 'Kullanıcı adı zorunlu'),
  email: z.string().min(1, 'E-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  name: z.string().optional(),
  surname: z.string().optional(),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  roleNames: z.array(z.string()).default([]),
})

export const updateUserSchema = z.object({
  userName: z.string().min(1, 'Kullanıcı adı zorunlu'),
  email: z.string().min(1, 'E-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  name: z.string().optional(),
  surname: z.string().optional(),
  phoneNumber: z.string().optional(),
  password: z.union([z.string().min(6, 'Şifre en az 6 karakter olmalıdır'), z.literal('')]).optional(),
  roleNames: z.array(z.string()).default([]),
  concurrencyStamp: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
