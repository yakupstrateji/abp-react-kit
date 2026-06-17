import { z } from 'zod'

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Kiracı adı zorunlu'),
  adminEmailAddress: z.string().min(1, 'E-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  adminPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Kiracı adı zorunlu'),
  concurrencyStamp: z.string().optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
