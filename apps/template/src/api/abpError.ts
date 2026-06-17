export interface AbpValidationError { message: string; members: string[] }
export class AbpError extends Error {
  status: number
  code?: string
  details?: string
  validationErrors: AbpValidationError[]
  constructor(status: number, message: string, opts: { code?: string; details?: string; validationErrors?: AbpValidationError[] } = {}) {
    super(message)
    this.name = 'AbpError'
    this.status = status
    this.code = opts.code
    this.details = opts.details
    this.validationErrors = opts.validationErrors ?? []
  }
}
// Fallback messages are in Turkish; the UI layer uses L() to translate them if keys are present.
export function parseAbpError(status: number, body: any): AbpError {
  const e = body?.error
  if (e) return new AbpError(status, e.message || 'İşlem başarısız', { code: e.code, details: e.details, validationErrors: e.validationErrors ?? [] })
  return new AbpError(status, status === 0 ? 'Sunucuya ulaşılamadı' : `Beklenmeyen hata (${status})`)
}
