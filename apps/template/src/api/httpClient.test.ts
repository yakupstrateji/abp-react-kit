import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, axiosInstance } from './httpClient'
import { AbpError } from '@strateji/abp-react-core'

vi.mock('@/auth/userManager', () => ({
  getAccessToken: vi.fn().mockResolvedValue('tok'),
  userManager: { signinSilent: vi.fn(), signinRedirect: vi.fn() },
}))

// Import the mocked module so we can access and configure the mock fns
import * as userManagerModule from '@/auth/userManager'

// Helper to build an Axios-like error that axios.isAxiosError() recognises
function makeAxiosError(status: number, data: unknown, config?: unknown) {
  const err: any = new Error(`Request failed with status code ${status}`)
  err.isAxiosError = true
  err.response = { status, data, headers: {} }
  // Real axios errors always carry the request config; the 401-retry interceptor
  // relies on it to re-dispatch. Synthetic errors must include it too.
  if (config) err.config = config
  return err
}

describe('http', () => {
  // Save the original adapter and restore after each test
  const origAdapter = axiosInstance.defaults.adapter

  beforeEach(() => {
    vi.mocked(userManagerModule.getAccessToken).mockResolvedValue('tok')
    vi.mocked(userManagerModule.userManager.signinSilent).mockReset()
    vi.mocked(userManagerModule.userManager.signinRedirect).mockReset()
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = origAdapter
  })

  it('adds bearer token and returns json', async () => {
    let capturedConfig: any
    axiosInstance.defaults.adapter = async (config: any) => {
      capturedConfig = config
      return { status: 200, data: { ok: 1 }, headers: {}, config, request: {}, statusText: 'OK' }
    }

    const data = await http<{ ok: number }>('/api/x')
    expect(data.ok).toBe(1)
    // Request interceptor attaches Authorization before the adapter runs
    expect(capturedConfig?.headers?.Authorization).toBe('Bearer tok')
  })

  it('throws AbpError on non-2xx', async () => {
    axiosInstance.defaults.adapter = async (_config: any) => {
      throw makeAxiosError(400, { error: { message: 'no' } })
    }
    await expect(http('/api/x')).rejects.toBeInstanceOf(AbpError)
  })

  it('retries once after 401 when signinSilent succeeds', async () => {
    vi.mocked(userManagerModule.userManager.signinSilent).mockResolvedValue(undefined as any)

    let callCount = 0
    axiosInstance.defaults.adapter = async (config: any) => {
      callCount++
      if (callCount === 1) throw makeAxiosError(401, null, config)
      return { status: 200, data: { result: 'ok' }, headers: {}, config, request: {}, statusText: 'OK' }
    }

    const data = await http<{ result: string }>('/api/x')
    expect(data.result).toBe('ok')
    expect(userManagerModule.userManager.signinSilent).toHaveBeenCalledTimes(1)
    expect(callCount).toBe(2)
  })

  it('generated-SDK path: a direct axiosInstance call also yields AbpError with the real message + validationErrors', async () => {
    // The generated client calls axiosInstance directly (bypassing http()). The
    // shared response interceptor must still turn ABP errors into AbpError so
    // useCrud.onError shows the backend's real message — not a generic fallback.
    axiosInstance.defaults.adapter = async () => {
      throw makeAxiosError(422, {
        error: { message: 'Geçersiz giriş', validationErrors: [{ message: 'Ad zorunlu', members: ['name'] }] },
      })
    }
    let caught: any
    try {
      await axiosInstance.get('/api/app/student')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(AbpError)
    expect(caught.message).toBe('Geçersiz giriş')
    expect(caught.validationErrors[0].members).toContain('name')
  })

  it('calls signinRedirect when signinSilent rejects on 401', async () => {
    vi.mocked(userManagerModule.userManager.signinSilent).mockRejectedValue(new Error('silent failed'))
    vi.mocked(userManagerModule.userManager.signinRedirect).mockResolvedValue(undefined as any)

    axiosInstance.defaults.adapter = async (config: any) => {
      throw makeAxiosError(401, null, config)
    }

    await expect(http('/api/x')).rejects.toBeInstanceOf(AbpError)
    expect(userManagerModule.userManager.signinSilent).toHaveBeenCalledTimes(1)
    expect(userManagerModule.userManager.signinRedirect).toHaveBeenCalledTimes(1)
  })
})
