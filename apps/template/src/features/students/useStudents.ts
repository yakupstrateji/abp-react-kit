import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import { createInMemoryStore } from '@/features/_mock/inMemoryStore'
import type { Student, StudentInput } from './student'

// EXAMPLE feature backed by an in-memory mock (works with no backend).
// For production: swap this for a backend-wired CrudService (see admin/users/useUsers.ts).
// To remove: delete this feature folder + its entry in the app's navigation.ts.
export const studentService: CrudService<Student, StudentInput, StudentInput> =
  createInMemoryStore<Student>([
    {
      id: '1',
      studentNumber: '1001',
      name: 'Ada',
      surname: 'Yılmaz',
      classroom: '5-A',
      classId: '1',
      email: 'ada@example.com',
      dateOfBirth: '2014-03-01',
      isActive: true,
    },
    {
      id: '2',
      studentNumber: '1002',
      name: 'Mert',
      surname: 'Demir',
      classroom: '5-A',
      classId: '1',
      email: null,
      dateOfBirth: null,
      isActive: true,
    },
    {
      id: '3',
      studentNumber: '1003',
      name: 'Elif',
      surname: 'Kaya',
      classroom: '6-B',
      classId: '2',
      email: null,
      dateOfBirth: null,
      isActive: false,
    },
  ])

export function useStudents(params: { skip: number; take: number; filter?: string }) {
  return useCrud<Student, StudentInput, StudentInput>('students', studentService, params)
}
