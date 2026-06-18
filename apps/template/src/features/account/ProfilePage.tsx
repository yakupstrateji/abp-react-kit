// src/features/account/ProfilePage.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AbpError } from '@yakupsogut/abp-react-core'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useL } from '@yakupsogut/abp-react-core'
import { getMyProfile, updateMyProfile, changePassword } from './myProfileService'
import { profileSchema, changePasswordSchema } from './profileSchema'
import type { ProfileInput, ChangePasswordInput } from './profileSchema'

export function ProfilePage() {
  const L = useL()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  })

  // --- Profile info form ---
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileInput>,
    defaultValues: { userName: '', email: '', name: '', surname: '', phoneNumber: '' },
  })

  useEffect(() => {
    if (data) {
      resetProfile({
        userName: data.userName ?? '',
        email: data.email ?? '',
        name: data.name ?? '',
        surname: data.surname ?? '',
        phoneNumber: data.phoneNumber ?? '',
      })
    }
  }, [data, resetProfile])

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-profile'] })
      void qc.invalidateQueries({ queryKey: ['app-config'] })
      toast.success(L('ProfileSaved', 'Profil kaydedildi'))
    },
    onError: (e: unknown) =>
      toast.error(e instanceof AbpError ? e.message : L('OperationFailed', 'İşlem başarısız')),
  })

  async function onProfileSubmit(values: ProfileInput) {
    await saveMutation.mutateAsync({
      userName: values.userName,
      email: values.email,
      name: values.name || null,
      surname: values.surname || null,
      phoneNumber: values.phoneNumber || null,
      // Forward the optimistic-concurrency stamp like the other admin forms do.
      concurrencyStamp: data?.concurrencyStamp ?? undefined,
    })
  }

  // --- Change password form ---
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema) as Resolver<ChangePasswordInput>,
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirm: '' },
  })

  const pwdMutation = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      resetPwd()
      toast.success(L('PasswordChanged', 'Şifre değiştirildi'))
    },
    onError: (e: unknown) =>
      toast.error(e instanceof AbpError ? e.message : L('OperationFailed', 'İşlem başarısız')),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner label={L('Loading', 'Yükleniyor…')} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-gray-800">
        {L('MyProfile', 'Hesabım')}
      </h1>

      {/* Profile info section */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          {L('ProfileInfo', 'Profil bilgileri')}
        </h2>
        <form onSubmit={handleProfile(onProfileSubmit)} noValidate className="flex flex-col gap-4">
          <FormField
            label={L('UserName', 'Kullanıcı Adı')}
            registration={regProfile('userName')}
            error={profileErrors.userName}
            type="text"
            autoComplete="username"
          />
          <FormField
            label={L('Email', 'E-posta')}
            registration={regProfile('email')}
            error={profileErrors.email}
            type="email"
            autoComplete="email"
          />
          <FormField
            label={L('Name', 'Ad')}
            registration={regProfile('name')}
            error={profileErrors.name}
            type="text"
            autoComplete="given-name"
          />
          <FormField
            label={L('Surname', 'Soyad')}
            registration={regProfile('surname')}
            error={profileErrors.surname}
            type="text"
            autoComplete="family-name"
          />
          <FormField
            label={L('PhoneNumber', 'Telefon Numarası')}
            registration={regProfile('phoneNumber')}
            error={profileErrors.phoneNumber}
            type="tel"
            autoComplete="tel"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saveMutation.isPending}>
              {L('AbpUi::Save', 'Kaydet')}
            </Button>
          </div>
        </form>
      </section>

      {/* Change password section */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          {L('ChangePassword', 'Şifre değiştir')}
        </h2>
        <form onSubmit={handlePwd((v) => void pwdMutation.mutateAsync(v))} noValidate className="flex flex-col gap-4">
          <FormField
            label={L('CurrentPassword', 'Mevcut Şifre')}
            registration={regPwd('currentPassword')}
            error={pwdErrors.currentPassword}
            type="password"
            autoComplete="current-password"
          />
          <FormField
            label={L('NewPassword', 'Yeni Şifre')}
            registration={regPwd('newPassword')}
            error={pwdErrors.newPassword}
            type="password"
            autoComplete="new-password"
          />
          <FormField
            label={L('NewPasswordConfirm', 'Yeni Şifre (Tekrar)')}
            registration={regPwd('newPasswordConfirm')}
            error={pwdErrors.newPasswordConfirm}
            type="password"
            autoComplete="new-password"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={pwdMutation.isPending}>
              {L('ChangePassword', 'Şifre Değiştir')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
