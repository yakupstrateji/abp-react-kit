import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
} from './tenantSchema'
import { useL } from '@/i18n/i18n'

interface TenantFormProps {
  initialValues?: Partial<UpdateTenantInput & { id: string }>
  onSubmit: (data: CreateTenantInput | UpdateTenantInput) => void | Promise<void>
  loading?: boolean
}

export function TenantForm({ initialValues, onSubmit, loading }: TenantFormProps) {
  const L = useL()
  const isEdit = !!initialValues?.id
  const schema = isEdit ? updateTenantSchema : createTenantSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(schema) as Resolver<CreateTenantInput>,
    defaultValues: {
      name: initialValues?.name ?? '',
      ...(!isEdit
        ? {
            adminEmailAddress: '',
            adminPassword: '',
          }
        : {}),
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      noValidate
      className="flex flex-col gap-3"
    >
      <FormField
        label={L('SchollApp::TenantName', 'Kiracı Adı')}
        registration={register('name')}
        error={errors.name}
        type="text"
        autoComplete="off"
      />

      {!isEdit && (
        <>
          <FormField
            label={L('SchollApp::AdminEmail', 'Yönetici E-postası')}
            registration={register('adminEmailAddress' as keyof CreateTenantInput)}
            error={(errors as Record<string, any>).adminEmailAddress}
            type="email"
            autoComplete="email"
          />

          <FormField
            label={L('SchollApp::AdminPassword', 'Yönetici Şifresi')}
            registration={register('adminPassword' as keyof CreateTenantInput)}
            error={(errors as Record<string, any>).adminPassword}
            type="password"
            autoComplete="new-password"
          />
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </form>
  )
}
