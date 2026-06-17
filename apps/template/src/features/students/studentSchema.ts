import { z } from 'zod'

export const studentSchema = z.object({
  name: z.string().min(1, 'Ad zorunlu'),
  surname: z.string().min(1, 'Soyad zorunlu'),
  studentNumber: z.string().min(1, 'Öğrenci numarası zorunlu'),
  email: z
    .string()
    .email('Geçerli bir e-posta giriniz')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),
  classroom: z.string().optional(),
  classId: z.string().nullish(),
  isActive: z.boolean().default(true),
})

export type StudentFormInput = z.infer<typeof studentSchema>
