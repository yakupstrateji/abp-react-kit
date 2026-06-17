import {
  getApiAccountMyProfile,
  putApiAccountMyProfile,
  postApiAccountMyProfileChangePassword,
} from '@/api/generated/sdk.gen'
import type {
  VoloAbpAccountProfileDto,
  VoloAbpAccountUpdateProfileDtoWritable,
  VoloAbpAccountChangePasswordInput,
} from '@/api/generated/types.gen'

export async function getMyProfile(): Promise<VoloAbpAccountProfileDto> {
  const res = await getApiAccountMyProfile({ throwOnError: true })
  return res.data
}

export async function updateMyProfile(
  input: VoloAbpAccountUpdateProfileDtoWritable,
): Promise<VoloAbpAccountProfileDto> {
  const res = await putApiAccountMyProfile({ body: input, throwOnError: true })
  return res.data
}

export async function changePassword(input: VoloAbpAccountChangePasswordInput): Promise<void> {
  await postApiAccountMyProfileChangePassword({ body: input, throwOnError: true })
}
