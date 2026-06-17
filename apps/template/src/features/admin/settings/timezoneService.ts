// src/features/admin/settings/timezoneService.ts
import {
  getApiSettingManagementTimezone,
  postApiSettingManagementTimezone,
  getApiSettingManagementTimezoneTimezones,
} from '@/api/generated/sdk.gen'

export interface TimezoneOption {
  name: string
  value: string
}

export async function getTimezone(): Promise<string> {
  const res = await getApiSettingManagementTimezone({ throwOnError: true })
  return res.data as string
}

export async function getTimezones(): Promise<TimezoneOption[]> {
  const res = await getApiSettingManagementTimezoneTimezones({ throwOnError: true })
  const items = res.data ?? []
  return items
    .filter((item): item is { name: string; value: string } =>
      typeof item.name === 'string' && typeof item.value === 'string',
    )
    .map((item) => ({ name: item.name, value: item.value }))
}

export async function setTimezone(timezone: string): Promise<void> {
  await postApiSettingManagementTimezone({ query: { timezone }, throwOnError: true })
}
