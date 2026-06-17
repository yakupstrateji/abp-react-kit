// src/features/account/ProfilePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppConfigContext } from '@strateji/abp-react-core'

vi.mock('@strateji/abp-react-core', async (importActual) => {
  const actual = await importActual<typeof import('@strateji/abp-react-core')>()
  return {
    ...actual,
    userManager: {
      getUser: vi.fn().mockResolvedValue(null),
      events: {
        addUserLoaded: vi.fn(),
        addUserUnloaded: vi.fn(),
        removeUserLoaded: vi.fn(),
        removeUserUnloaded: vi.fn(),
      },
    },
    getAccessToken: vi.fn().mockResolvedValue('test-token'),
  }
})

import { ProfilePage } from './ProfilePage'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppConfigContext.Provider
          value={{
            currentUser: { id: '1', userName: 'admin', isAuthenticated: true, name: 'Admin' },
            grantedPolicies: {},
            isLoading: false,
          }}
        >
          {children}
        </AppConfigContext.Provider>
      </QueryClientProvider>
    )
  }
  return Wrapper
}

describe('ProfilePage — change password validation', () => {
  it('shows an error when new passwords do not match', async () => {
    const user = userEvent.setup()
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <ProfilePage />
      </Wrapper>,
    )

    // Wait for the profile to load (MSW handler returns a mock profile)
    await waitFor(() => {
      expect(screen.getByLabelText(/mevcut şifre/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/mevcut şifre/i), 'OldPass123')
    await user.type(screen.getByLabelText(/^yeni şifre$/i), 'NewPass123')
    await user.type(screen.getByLabelText(/yeni şifre \(tekrar\)/i), 'WrongPass999')

    // Submit the change-password form
    const submitButtons = screen.getAllByRole('button', { name: /şifre değiştir/i })
    await user.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/şifreler eşleşmiyor/i)).toBeInTheDocument()
    })
  })

  it('shows error when new password confirm is empty', async () => {
    const user = userEvent.setup()
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <ProfilePage />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/mevcut şifre/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/mevcut şifre/i), 'OldPass123')
    await user.type(screen.getByLabelText(/^yeni şifre$/i), 'NewPass123')
    // Leave newPasswordConfirm empty

    const submitButtons = screen.getAllByRole('button', { name: /şifre değiştir/i })
    await user.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/şifre tekrarı zorunlu/i)).toBeInTheDocument()
    })
  })
})
