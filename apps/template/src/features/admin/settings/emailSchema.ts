import { z } from 'zod'

export const emailSettingsSchema = z.object({
  defaultFromAddress: z.string().min(1, 'Gönderen e-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  defaultFromDisplayName: z.string().min(1, 'Gönderen adı zorunlu'),
  smtpHost: z.string(),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUserName: z.string(),
  smtpPassword: z.string(),
  smtpDomain: z.string(),
  smtpEnableSsl: z.boolean(),
  smtpUseDefaultCredentials: z.boolean(),
})

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>
