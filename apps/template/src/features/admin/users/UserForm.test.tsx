import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from './UserForm'
import type { VoloAbpIdentityIdentityRoleDto } from '@/api/generated/types.gen'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockRoles: VoloAbpIdentityIdentityRoleDto[] = [
  { id: '1', name: 'admin' },
  { id: '2', name: 'user' },
]

describe('UserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows required validation errors when submitted empty (CREATE mode)', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <UserForm
        assignableRoles={[]}
        onSubmit={onSubmit}
      />,
    )

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      // Expect validation errors to appear
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with valid payload when form is filled correctly', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <UserForm
        assignableRoles={mockRoles}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/kullanıcı adı/i), 'testuser')
    await user.type(screen.getByLabelText(/e-posta/i), 'test@example.com')
    await user.type(screen.getByLabelText(/şifre/i), 'password123')

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const callArg = onSubmit.mock.calls[0][0]
    expect(callArg.userName).toBe('testuser')
    expect(callArg.email).toBe('test@example.com')
    expect(callArg.password).toBe('password123')
    expect(Array.isArray(callArg.roleNames)).toBe(true)
  })

  it('renders role checkboxes for assignable roles', async () => {
    const onSubmit = vi.fn()

    render(
      <UserForm
        assignableRoles={mockRoles}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /admin/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /user/i })).toBeInTheDocument()
  })
})
