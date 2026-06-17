import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { studentSchema, type StudentFormInput } from './studentSchema'
import { useL } from '@strateji/abp-react-core'
import type { StratejiSchollAppStudentsStudentDto } from '@/api/generated/types.gen'
import { useClassOptions } from '@/features/classes/useClasses'

interface StudentFormProps {
  initialValues?: Partial<StratejiSchollAppStudentsStudentDto>
  onSubmit: (data: StudentFormInput) => void | Promise<void>
  loading?: boolean
}

export function StudentForm({ initialValues, onSubmit, loading }: StudentFormProps) {
  const L = useL()
  const classOptions = useClassOptions()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema) as Resolver<StudentFormInput>,
    defaultValues: {
      name: initialValues?.name ?? '',
      surname: initialValues?.surname ?? '',
      studentNumber: initialValues?.studentNumber ?? '',
      email: initialValues?.email ?? '',
      dateOfBirth: initialValues?.dateOfBirth
        ? initialValues.dateOfBirth.slice(0, 10)
        : '',
      classroom: initialValues?.classroom ?? '',
      classId: initialValues?.classId ?? null,
      isActive: initialValues?.isActive ?? true,
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      noValidate
      className="flex flex-col gap-3"
    >
      <FormField
        label={L('SchollApp::StudentNumber', 'Öğrenci Numarası')}
        registration={register('studentNumber')}
        error={errors.studentNumber}
        type="text"
        autoComplete="off"
      />

      <FormField
        label={L('SchollApp::FirstName', 'Ad')}
        registration={register('name')}
        error={errors.name}
        type="text"
      />

      <FormField
        label={L('SchollApp::LastName', 'Soyad')}
        registration={register('surname')}
        error={errors.surname}
        type="text"
      />

      <FormField
        label={L('SchollApp::Email', 'E-posta')}
        registration={register('email')}
        error={errors.email}
        type="email"
        autoComplete="email"
      />

      <FormField
        label={L('SchollApp::DateOfBirth', 'Doğum Tarihi')}
        registration={register('dateOfBirth')}
        error={errors.dateOfBirth}
        type="date"
      />

      <FormField
        label={L('SchollApp::Classroom', 'Sınıf')}
        registration={register('classroom')}
        error={errors.classroom}
        type="text"
      />

      <div className="flex flex-col gap-1">
        <Label htmlFor="classId">{L('SchollApp::Class', 'Sınıf')}</Label>
        <Controller
          name="classId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? '__none__'}
              onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
            >
              <SelectTrigger id="classId">
                <SelectValue placeholder={L('SchollApp::Class', 'Sınıf seçin...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sınıf yok —</SelectItem>
                {(classOptions.data ?? []).map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.classId && (
          <p className="text-xs text-destructive" role="alert">
            {errors.classId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(!!checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer text-sm font-normal">
                {L('SchollApp::IsActive', 'Aktif')}
              </Label>
            </div>
          )}
        />
        {errors.isActive && (
          <p className="text-xs text-destructive" role="alert">
            {errors.isActive.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </form>
  )
}
