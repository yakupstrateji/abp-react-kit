import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { classSchema, type ClassFormInput } from './classSchema'
import { useL } from '@yakupsogut/abp-react-core'
import type { SchoolClass } from './class'

interface ClassFormProps {
  initialValues?: Partial<SchoolClass>
  onSubmit: (data: ClassFormInput) => void | Promise<void>
  loading?: boolean
}

export function ClassForm({ initialValues, onSubmit, loading }: ClassFormProps) {
  const L = useL()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClassFormInput>({
    resolver: zodResolver(classSchema) as Resolver<ClassFormInput>,
    defaultValues: {
      name: initialValues?.name ?? '',
      level: initialValues?.level ?? '',
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
        label={L('Class', 'Sınıf Adı')}
        registration={register('name')}
        error={errors.name}
        type="text"
        autoComplete="off"
      />

      <FormField
        label={L('Level', 'Seviye')}
        registration={register('level')}
        error={errors.level}
        type="text"
        autoComplete="off"
      />

      <div className="flex flex-col gap-1">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="classIsActive"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(!!checked)}
              />
              <Label htmlFor="classIsActive" className="cursor-pointer text-sm font-normal">
                {L('IsActive', 'Aktif')}
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
