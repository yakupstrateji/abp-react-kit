import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldError, FieldErrors, Resolver } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { VoloAbpIdentityIdentityRoleDto } from '@/api/generated/types.gen'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from './userSchema'
import { useL } from '@strateji/abp-react-core'

interface UserFormProps {
  initialValues?: Partial<UpdateUserInput & { id: string }>
  assignableRoles: VoloAbpIdentityIdentityRoleDto[]
  onSubmit: (data: CreateUserInput | UpdateUserInput) => void | Promise<void>
  loading?: boolean
}

export function UserForm({ initialValues, assignableRoles, onSubmit, loading }: UserFormProps) {
  const L = useL()
  const isEdit = !!initialValues?.id
  const schema = isEdit ? updateUserSchema : createUserSchema

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(schema) as Resolver<UpdateUserInput>,
    defaultValues: {
      userName: initialValues?.userName ?? '',
      email: initialValues?.email ?? '',
      name: initialValues?.name ?? '',
      surname: initialValues?.surname ?? '',
      phoneNumber: initialValues?.phoneNumber ?? '',
      password: '',
      roleNames: initialValues?.roleNames ?? [],
      ...(isEdit
        ? { concurrencyStamp: (initialValues as UpdateUserInput)?.concurrencyStamp }
        : {}),
    },
  })

  const typedErrors: FieldErrors<UpdateUserInput> = errors

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      noValidate
      className="flex flex-col gap-3"
    >
      <FormField
        label={L('SchollApp::UserName', 'Kullanıcı Adı')}
        registration={register('userName')}
        error={typedErrors.userName}
        type="text"
        autoComplete="username"
      />

      <FormField
        label={L('SchollApp::Email', 'E-posta')}
        registration={register('email')}
        error={typedErrors.email}
        type="email"
        autoComplete="email"
      />

      <FormField
        label={L('SchollApp::FirstName', 'Ad')}
        registration={register('name')}
        error={typedErrors.name}
        type="text"
      />

      <FormField
        label={L('SchollApp::LastName', 'Soyad')}
        registration={register('surname')}
        error={typedErrors.surname}
        type="text"
      />

      <FormField
        label={L('SchollApp::PhoneNumber', 'Telefon')}
        registration={register('phoneNumber')}
        error={typedErrors.phoneNumber}
        type="tel"
      />

      <FormField
        label={L('SchollApp::Password', 'Şifre')}
        registration={register('password')}
        error={typedErrors.password as FieldError | undefined}
        type="password"
        autoComplete="new-password"
        placeholder={isEdit ? L('SchollApp::FillToChange', 'Değiştirmek için doldurun') : ''}
      />

      {assignableRoles.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-gray-700 mb-1">{L('SchollApp::Roles', 'Roller')}</legend>
          <Controller
            name="roleNames"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-3">
                {assignableRoles.map((role) => {
                  const roleName = role.name ?? ''
                  const checkboxId = `role-${role.id ?? roleName}`
                  const value: string[] = Array.isArray(field.value) ? field.value : []
                  const checked = value.includes(roleName)
                  return (
                    <div key={role.id ?? roleName} className="flex items-center gap-1.5">
                      <Checkbox
                        id={checkboxId}
                        aria-label={roleName}
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) {
                            field.onChange([...value, roleName])
                          } else {
                            field.onChange(value.filter((r) => r !== roleName))
                          }
                        }}
                      />
                      <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                        {roleName}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          />
          {typedErrors.roleNames && (
            <p className="text-xs text-red-600" role="alert">
              {String(typedErrors.roleNames.message ?? '')}
            </p>
          )}
        </fieldset>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </form>
  )
}
