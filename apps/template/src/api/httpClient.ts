import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env, parseAbpError, getCurrentCulture } from '@strateji/abp-react-core'
import { getAccessToken, userManager } from '@/auth/userManager'

/** Shared axios instance with baseURL pointing to the ABP backend. */
export const axiosInstance = axios.create({
  baseURL: env.apiUrl,
})

type RetryConfig = InternalAxiosRequestConfig & { __isRetry?: boolean }

// Request interceptor: attach Bearer token + Accept-Language on every request.
// Lives on the INSTANCE so both http() and the generated SDK client get it.
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = getCurrentCulture()
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

// Response interceptor: parse the ABP error envelope into AbpError and perform a
// one-time 401 silent-renew + retry. This MUST live on the instance (not inside
// http()) so the generated SDK client — which calls axiosInstance directly — gets
// identical behavior: real ABP message + validationErrors and token refresh on
// EVERY call, not just http() calls.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(parseAbpError(0, null))
    }
    const axiosErr = error as AxiosError
    const status = axiosErr.response?.status ?? 0
    const config = axiosErr.config as RetryConfig | undefined

    if (status === 401 && config && !config.__isRetry) {
      config.__isRetry = true
      try {
        await userManager.signinSilent()
        // Re-run the request; the request interceptor attaches the fresh token.
        return await axiosInstance.request(config)
      } catch {
        await userManager.signinRedirect()
        return Promise.reject(parseAbpError(401, null))
      }
    }

    return Promise.reject(parseAbpError(status, axiosErr.response?.data ?? null))
  },
)

/**
 * Thin typed helper over the shared axios instance for the few hand-written
 * calls (e.g. application-configuration). Error handling (ABP envelope + 401
 * retry) is done by the response interceptor above, so http() and the generated
 * SDK behave identically.
 */
export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET') as string
  const data =
    init.body !== undefined
      ? typeof init.body === 'string'
        ? JSON.parse(init.body)
        : init.body
      : undefined
  const extraHeaders = init.headers as Record<string, string> | undefined

  const response = await axiosInstance.request<T>({ url: path, method, data, headers: extraHeaders })

  if (
    response.status === 204 ||
    response.data === undefined ||
    response.data === null ||
    (response.data as unknown) === ''
  ) {
    return undefined as T
  }
  return response.data
}
