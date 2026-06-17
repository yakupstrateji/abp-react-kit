// EXAMPLE — replace with real service or delete
// Local types for the Classes example feature (mirrors classSchema.ts fields exactly).

export interface SchoolClass {
  id?: string
  name: string
  level: string | null
  isActive: boolean
}

export type ClassInput = Omit<SchoolClass, 'id'>
