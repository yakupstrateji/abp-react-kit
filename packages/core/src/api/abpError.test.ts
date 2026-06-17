import { describe, it, expect } from 'vitest'
import { parseAbpError, AbpError } from './abpError'

describe('parseAbpError', () => {
  it('extracts message and validation errors from ABP envelope', () => {
    const body = { error: { code: 'X', message: 'Geçersiz', validationErrors: [{ message: 'Ad zorunlu', members: ['name'] }] } }
    const err = parseAbpError(422, body)
    expect(err).toBeInstanceOf(AbpError)
    expect(err.message).toBe('Geçersiz')
    expect(err.validationErrors[0].members).toContain('name')
    expect(err.status).toBe(422)
  })
  it('falls back to a generic message when envelope missing', () => {
    const err = parseAbpError(500, {})
    expect(err.message).toBeTruthy()
    expect(err.status).toBe(500)
  })
})
