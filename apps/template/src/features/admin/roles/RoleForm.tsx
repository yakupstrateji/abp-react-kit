import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { roleSchema, type RoleInput } from './roleSchema'
import { useL } from '@/i18n/i18n'

interface RoleFormProps {
  initialValues?: Partial<RoleInput>
  onSubmit: (data: RoleInput) => void | Promise<void>
  loading?: boolean
}

export function RoleForm({ initialValues, onSubmit, loading }: RoleFormProps) {
  const L = useL()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleInput>({
    resolver: zodResolver(roleSchema) as Resolver<RoleInput>,
    defaultValues: {
      name: initialValues?.name ?? '',
      isDefault: initialValues?.isDefault ?? false,
      isPublic: initialValues?.isPublic ?? false,
      concurrencyStamp: initialValues?.concurrencyStamp,
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as RoleInput))}
      noValidate
      className="flex flex-col gap-3"
    >
      <FormField
        label={L('SchollApp::RoleName', 'Ad')}
        registration={register('name')}
        error={errors.name}
        type="text"
        autoComplete="off"
      />

      <div className="flex items-center gap-2">
        <Controller
          name="isDefault"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="role-isDefault"
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(!!checked)}
              aria-label={L('SchollApp::IsDefault', 'Varsayılan')}
            />
          )}
        />
        <Label htmlFor="role-isDefault" className="cursor-pointer">
          {L('SchollApp::IsDefault', 'Varsayılan')}
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="isPublic"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="role-isPublic"
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(!!checked)}
              aria-label={L('SchollApp::IsPublic', 'Genel')}
            />
          )}
        />
        <Label htmlFor="role-isPublic" className="cursor-pointer">
          {L('SchollApp::IsPublic', 'Genel')}
        </Label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </form>
  )
}
