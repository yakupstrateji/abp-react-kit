import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppConfigContext } from '@/app-config/AppConfigProvider'

// Mock userManager so getAccessToken returns a token (httpClient needs this)
vi.mock('@/auth/userManager', () => ({
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
}))

// Dynamic import to avoid top-level import issues with the mock
import { UsersPage } from './UsersPage'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const grantedPolicies: Record<string, boolean> = {
    'AbpIdentity.Users': true,
    'AbpIdentity.Users.Create': true,
    'AbpIdentity.Users.Update': true,
    'AbpIdentity.Users.Delete': true,
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppConfigContext.Provider
          value={{
            currentUser: { id: '1', userName: 'admin', isAuthenticated: true, name: 'Admin' },
            grantedPolicies,
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

describe('UsersPage integration (MSW)', () => {
  it('renders the mocked admin user row from MSW', async () => {
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <UsersPage />
      </Wrapper>,
    )

    // Wait for the user row to appear (MSW returns { items: [{ userName: 'admin', ... }] })
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    // Also confirm the email column is rendered
    expect(screen.getByText('admin@abp.io')).toBeInTheDocument()
  })

  it('opens the create modal when the Yeni button is clicked', async () => {
    const user = userEvent.setup()
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <UsersPage />
      </Wrapper>,
    )

    // Wait for the page to finish loading
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    // Click the create button (rendered by CrudPage as "Yeni")
    const yeniButton = screen.getByRole('button', { name: /yeni/i })
    await user.click(yeniButton)

    // Assert the create modal title appears
    expect(screen.getByText('Yeni Kullanıcı')).toBeInTheDocument()

    // Assert the form fields are visible
    expect(screen.getByLabelText(/kullanıcı adı/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
  })
})
