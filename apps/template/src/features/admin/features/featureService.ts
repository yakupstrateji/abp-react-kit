import {
  getApiFeatureManagementFeatures,
  putApiFeatureManagementFeatures,
} from '@/api/generated/sdk.gen'
import type {
  VoloAbpFeatureManagementGetFeatureListResultDto,
  VoloAbpFeatureManagementUpdateFeatureDto,
} from '@/api/generated/types.gen'

const PROVIDER_NAME = 'T'

export async function getFeatures(
  tenantId: string,
): Promise<VoloAbpFeatureManagementGetFeatureListResultDto> {
  const res = await getApiFeatureManagementFeatures({
    query: { providerName: PROVIDER_NAME, providerKey: tenantId },
    throwOnError: true,
  })
  return res.data
}

export async function updateFeatures(
  tenantId: string,
  changes: VoloAbpFeatureManagementUpdateFeatureDto[],
): Promise<void> {
  await putApiFeatureManagementFeatures({
    query: { providerName: PROVIDER_NAME, providerKey: tenantId },
    body: { features: changes },
    throwOnError: true,
  })
}
