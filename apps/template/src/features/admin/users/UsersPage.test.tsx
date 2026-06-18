import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppConfigContext } from '@yakupsogut/abp-react-core'
import { server } from '@/test/msw/server'

const BASE_URL = 'https://localhost:44334'

// Mock getAccessToken so httpClient attaches a token on requests
vi.mock('@yakupsogut/abp-react-core', async (importActual) => {
  const actual = await importActual<typeof import('@yakupsogut/abp-react-core')>()
  return {
    ...actual,
    getAccessToken: vi.fn().mockResolvedValue('test-token'),
  }
})

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

  it('preserves existing roles and omits a blank password when editing a user', async () => {
    // Regression: the edit form must wait for the user's current roles to load
    // before mounting, otherwise a save would send roleNames:[] and strip every
    // role. A blank password must also be omitted from the update payload.
    let putBody: Record<string, unknown> | null = null
    server.use(
      http.get(`${BASE_URL}/api/identity/users/assignable-roles`, () =>
        HttpResponse.json({ items: [{ id: 'r1', name: 'admin' }, { id: 'r2', name: 'editor' }] }),
      ),
      http.get(`${BASE_URL}/api/identity/users/u1/roles`, () =>
        HttpResponse.json({ items: [{ id: 'r1', name: 'admin' }] }),
      ),
      http.put(`${BASE_URL}/api/identity/users/u1`, async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'u1', userName: 'admin', concurrencyStamp: 'stamp2' })
      }),
    )

    const user = userEvent.setup()
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <UsersPage />
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    // Open the edit modal for the admin user row.
    await user.click(screen.getByRole('button', { name: /düzenle/i }))

    // The form mounts only after roles load; the 'admin' role checkbox is checked.
    const adminRole = await screen.findByRole('checkbox', { name: 'admin' })
    await waitFor(() => expect(adminRole).toBeChecked())

    // Save without touching roles or password.
    await user.click(screen.getByRole('button', { name: /kaydet/i }))

    await waitFor(() => expect(putBody).not.toBeNull())
    expect(putBody!.roleNames).toEqual(['admin'])
    expect(putBody!).not.toHaveProperty('password')
  })
})
