// EXAMPLE feature — local Student types, decoupled from any generated API client.
// Replace the mock service in useStudents.ts with a real backend-wired CrudService
// (see features/admin/users/useUsers.ts) for production, or delete this feature
// and its navigation entry.

export interface Student {
  id?: string
  studentNumber: string
  name: string
  surname: string
  classroom: string | null
  classId: string | null
  email: string | null
  dateOfBirth: string | null
  isActive: boolean
}

export type StudentInput = Omit<Student, 'id'>
