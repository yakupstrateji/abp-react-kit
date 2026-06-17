import {
  getApiPermissionManagementPermissions,
  putApiPermissionManagementPermissions,
} from '@/api/generated/sdk.gen'
import type { VoloAbpPermissionManagementGetPermissionListResultDto } from '@/api/generated/types.gen'

export async function getPermissions(
  providerName: string,
  providerKey: string,
): Promise<VoloAbpPermissionManagementGetPermissionListResultDto> {
  const res = await getApiPermissionManagementPermissions({
    query: { providerName, providerKey },
    throwOnError: true,
  })
  return res.data
}

export async function updatePermissions(
  providerName: string,
  providerKey: string,
  permissions: Array<{ name: string; isGranted: boolean }>,
): Promise<void> {
  await putApiPermissionManagementPermissions({
    query: { providerName, providerKey },
    body: { permissions },
    throwOnError: true,
  })
}
