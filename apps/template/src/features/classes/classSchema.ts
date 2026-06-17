import { z } from 'zod'

export const classSchema = z.object({
  name: z.string().min(1, 'Sınıf adı zorunlu'),
  level: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type ClassFormInput = z.infer<typeof classSchema>
