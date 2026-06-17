import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string().min(1, 'Ad zorunludur'),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  concurrencyStamp: z.string().optional(),
})

export type RoleInput = z.infer<typeof roleSchema>
