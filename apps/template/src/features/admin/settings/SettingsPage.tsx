// src/features/admin/settings/SettingsPage.tsx
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  getApiSettingManagementEmailing,
  postApiSettingManagementEmailing,
  postApiSettingManagementEmailingSendTestEmail,
} from '@/api/generated/sdk.gen'
import { AbpError } from '@strateji/abp-react-core'
import { usePermission } from '@/app-config/usePermission'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  VoloAbpSettingManagementEmailSettingsDto,
  VoloAbpSettingManagementUpdateEmailSettingsDto,
  VoloAbpSettingManagementSendTestEmailInput,
} from '@/api/generated/types.gen'
import { emailSettingsSchema, type EmailSettingsInput } from './emailSchema'
import { getTimezone, getTimezones, setTimezone } from './timezoneService'
import { useL } from '@/i18n/i18n'

// ── Emailing API ────────────────────────────────────────────────────────────

async function getEmailSettings(): Promise<VoloAbpSettingManagementEmailSettingsDto> {
  const res = await getApiSettingManagementEmailing({ throwOnError: true })
  return res.data
}

async function updateEmailSettings(
  input: VoloAbpSettingManagementUpdateEmailSettingsDto,
): Promise<void> {
  await postApiSettingManagementEmailing({ body: input, throwOnError: true })
}

async function sendTestEmail(input: VoloAbpSettingManagementSendTestEmailInput): Promise<void> {
  await postApiSettingManagementEmailingSendTestEmail({ body: input, throwOnError: true })
}

// ── Send Test Email schema ──────────────────────────────────────────────────

const testEmailSchema = z.object({
  senderEmailAddress: z.string().min(1, 'Gönderen e-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  targetEmailAddress: z.string().min(1, 'Hedef e-posta zorunlu').email('Geçerli bir e-posta giriniz'),
  subject: z.string().min(1, 'Konu zorunlu'),
  body: z.string().optional(),
})
type TestEmailInput = z.infer<typeof testEmailSchema>

// ── Emailing Tab ────────────────────────────────────────────────────────────

function EmailingTab() {
  const L = useL()

  const { data, isLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: getEmailSettings,
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EmailSettingsInput>({
    resolver: zodResolver(emailSettingsSchema) as Resolver<EmailSettingsInput>,
    defaultValues: {
      defaultFromAddress: '',
      defaultFromDisplayName: '',
      smtpHost: '',
      smtpPort: 25,
      smtpUserName: '',
      smtpPassword: '',
      smtpDomain: '',
      smtpEnableSsl: false,
      smtpUseDefaultCredentials: false,
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        defaultFromAddress: data.defaultFromAddress ?? '',
        defaultFromDisplayName: data.defaultFromDisplayName ?? '',
        smtpHost: data.smtpHost ?? '',
        smtpPort: data.smtpPort ?? 25,
        smtpUserName: data.smtpUserName ?? '',
        smtpPassword: data.smtpPassword ?? '',
        smtpDomain: data.smtpDomain ?? '',
        smtpEnableSsl: data.smtpEnableSsl ?? false,
        smtpUseDefaultCredentials: data.smtpUseDefaultCredentials ?? false,
      })
    }
  }, [data, reset])

  const saveMutation = useMutation({
    mutationFn: updateEmailSettings,
    onSuccess: () => toast.success(L('SchollApp::EmailSettingsSaved', 'E-posta ayarları kaydedildi')),
    onError: (e: unknown) =>
      toast.error(e instanceof AbpError ? e.message : L('SchollApp::OperationFailed', 'İşlem başarısız')),
  })

  // -- Send Test Email form --
  const {
    register: regTest,
    handleSubmit: handleTest,
    formState: { errors: testErrors },
  } = useForm<TestEmailInput>({
    resolver: zodResolver(testEmailSchema) as Resolver<TestEmailInput>,
    defaultValues: {
      senderEmailAddress: '',
      targetEmailAddress: '',
      subject: 'Test E-postası',
      body: 'Bu bir test e-postasıdır.',
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: () => toast.success(L('SchollApp::TestEmailSent', 'Test e-postası gönderildi')),
    onError: (e: unknown) =>
      toast.error(e instanceof AbpError ? e.message : L('SchollApp::OperationFailed', 'İşlem başarısız')),
  })

  if (isLoading) {
    return <Spinner label={L('SchollApp::LoadingSettings', 'Ayarlar yükleniyor…')} />
  }

  async function onSubmit(values: EmailSettingsInput) {
    const payload: VoloAbpSettingManagementUpdateEmailSettingsDto = {
      defaultFromAddress: values.defaultFromAddress,
      defaultFromDisplayName: values.defaultFromDisplayName,
      smtpHost: values.smtpHost || null,
      smtpPort: values.smtpPort,
      smtpUserName: values.smtpUserName || null,
      smtpPassword: values.smtpPassword || null,
      smtpDomain: values.smtpDomain || null,
      smtpEnableSsl: values.smtpEnableSsl,
      smtpUseDefaultCredentials: values.smtpUseDefaultCredentials,
    }
    await saveMutation.mutateAsync(payload)
  }

  async function onTestEmailSubmit(values: TestEmailInput) {
    await testEmailMutation.mutateAsync({
      senderEmailAddress: values.senderEmailAddress,
      targetEmailAddress: values.targetEmailAddress,
      subject: values.subject,
      body: values.body ?? null,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Email settings form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3 rounded border border-gray-200 p-4">
          <legend className="px-1 text-sm font-semibold text-gray-700">
            {L('SchollApp::SenderInfo', 'Gönderen Bilgileri')}
          </legend>

          <FormField
            label={L('SchollApp::SenderEmail', 'Gönderen E-posta Adresi')}
            registration={register('defaultFromAddress')}
            error={errors.defaultFromAddress}
            type="email"
            autoComplete="off"
          />
          <FormField
            label={L('SchollApp::SenderName', 'Gönderen Adı')}
            registration={register('defaultFromDisplayName')}
            error={errors.defaultFromDisplayName}
            type="text"
            autoComplete="off"
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded border border-gray-200 p-4">
          <legend className="px-1 text-sm font-semibold text-gray-700">
            {L('SchollApp::SmtpServer', 'SMTP Sunucusu')}
          </legend>

          <FormField
            label={L('SchollApp::SmtpHost', 'SMTP Sunucusu')}
            registration={register('smtpHost')}
            error={errors.smtpHost}
            type="text"
            placeholder="mail.example.com"
            autoComplete="off"
          />
          <FormField
            label={L('SchollApp::SmtpPort', 'SMTP Portu')}
            registration={register('smtpPort')}
            error={errors.smtpPort}
            type="number"
            min={1}
            max={65535}
          />
          <FormField
            label={L('SchollApp::SmtpUserName', 'Kullanıcı Adı')}
            registration={register('smtpUserName')}
            error={errors.smtpUserName}
            type="text"
            autoComplete="off"
          />
          <FormField
            label={L('SchollApp::Password', 'Şifre')}
            registration={register('smtpPassword')}
            error={errors.smtpPassword}
            type="password"
            autoComplete="new-password"
          />
          <FormField
            label={L('SchollApp::SmtpDomain', 'Domain')}
            registration={register('smtpDomain')}
            error={errors.smtpDomain}
            type="text"
            autoComplete="off"
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Controller
                name="smtpEnableSsl"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="smtpEnableSsl"
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="smtpEnableSsl" className="cursor-pointer">
                {L('SchollApp::SmtpEnableSsl', 'SSL Etkin')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller
                name="smtpUseDefaultCredentials"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="smtpUseDefaultCredentials"
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="smtpUseDefaultCredentials" className="cursor-pointer">
                {L('SchollApp::SmtpUseDefaultCredentials', 'Varsayılan Kimlik Bilgilerini Kullan')}
              </Label>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saveMutation.isPending}>
            {L('AbpUi::Save', 'Kaydet')}
          </Button>
        </div>
      </form>

      {/* Send test email section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {L('SchollApp::SendTestEmail', 'Test e-postası gönder')}
        </h3>
        <form
          onSubmit={handleTest(onTestEmailSubmit)}
          noValidate
          className="flex flex-col gap-3 rounded border border-gray-200 p-4"
        >
          <FormField
            label={L('SchollApp::TestEmailSender', 'Gönderen E-posta')}
            registration={regTest('senderEmailAddress')}
            error={testErrors.senderEmailAddress}
            type="email"
            autoComplete="off"
          />
          <FormField
            label={L('SchollApp::TestEmailTarget', 'Hedef E-posta')}
            registration={regTest('targetEmailAddress')}
            error={testErrors.targetEmailAddress}
            type="email"
            autoComplete="off"
          />
          <FormField
            label={L('SchollApp::TestEmailSubject', 'Konu')}
            registration={regTest('subject')}
            error={testErrors.subject}
            type="text"
            autoComplete="off"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="ghost" loading={testEmailMutation.isPending}>
              {L('SchollApp::SendTestEmail', 'Test e-postası gönder')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

// ── Timezone Tab ────────────────────────────────────────────────────────────

function TimezoneTab() {
  const L = useL()
  const [selected, setSelected] = useState('')

  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['timezone-current'],
    queryFn: getTimezone,
  })

  const { data: timezones = [], isLoading: loadingList } = useQuery({
    queryKey: ['timezone-list'],
    queryFn: getTimezones,
  })

  useEffect(() => {
    if (current) setSelected(current)
  }, [current])

  const saveMutation = useMutation({
    mutationFn: (tz: string) => setTimezone(tz),
    onSuccess: () => toast.success(L('SchollApp::TimezoneSaved', 'Zaman dilimi kaydedildi')),
    onError: (e: unknown) =>
      toast.error(e instanceof AbpError ? e.message : L('SchollApp::OperationFailed', 'İşlem başarısız')),
  })

  if (loadingCurrent || loadingList) {
    return <Spinner label={L('SchollApp::Loading', 'Yükleniyor…')} />
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <Label htmlFor="tz-select">
          {L('SchollApp::Timezone', 'Zaman Dilimi')}
        </Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger id="tz-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          loading={saveMutation.isPending}
          onClick={() => void saveMutation.mutate(selected)}
        >
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </div>
  )
}

// ── Root SettingsPage ───────────────────────────────────────────────────────

export function SettingsPage() {
  const L = useL()
  const canManage = usePermission('SettingManagement.Emailing')

  if (!canManage) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {L('SchollApp::Settings', 'Ayarlar')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {L('SchollApp::NoPermission', 'Bu sayfayı görüntüleme yetkiniz yok.')}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">
        {L('SchollApp::Settings', 'Ayarlar')}
      </h1>

      <Tabs defaultValue="emailing">
        <TabsList className="mb-6">
          <TabsTrigger value="emailing">
            {L('SchollApp::Tab:Emailing', 'E-posta')}
          </TabsTrigger>
          <TabsTrigger value="timezone">
            {L('SchollApp::Tab:Timezone', 'Zaman Dilimi')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="emailing">
          <EmailingTab />
        </TabsContent>
        <TabsContent value="timezone">
          <TimezoneTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

