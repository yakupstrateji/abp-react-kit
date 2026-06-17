import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AppConfigContext } from '@strateji/abp-react-core'
import { usePermission } from '@strateji/abp-react-core'

const wrapper = (granted: Record<string, boolean>) => ({ children }: any) =>
  <AppConfigContext.Provider value={{ currentUser: { id: '1', userName: 'admin' } as any, grantedPolicies: granted, isLoading: false }}>{children}</AppConfigContext.Provider>

describe('usePermission', () => {
  it('true when policy granted', () => {
    const { result } = renderHook(() => usePermission('AbpIdentity.Users.Create'), { wrapper: wrapper({ 'AbpIdentity.Users.Create': true }) })
    expect(result.current).toBe(true)
  })
  it('false when missing', () => {
    const { result } = renderHook(() => usePermission('AbpIdentity.Users.Delete'), { wrapper: wrapper({}) })
    expect(result.current).toBe(false)
  })
})
