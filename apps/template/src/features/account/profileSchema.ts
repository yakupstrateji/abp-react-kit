import { z } from 'zod'

export const profileSchema = z.object({
  userName: z.string().min(1, 'Kullanıcı adı zorunlu'),
  email: z.string().min(1, 'E-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  name: z.string().optional(),
  surname: z.string().optional(),
  phoneNumber: z.string().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre zorunlu'),
    newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
    newPasswordConfirm: z.string().min(1, 'Şifre tekrarı zorunlu'),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: 'Şifreler eşleşmiyor',
    path: ['newPasswordConfirm'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
