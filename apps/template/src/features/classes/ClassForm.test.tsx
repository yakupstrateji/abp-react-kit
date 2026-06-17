import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClassForm } from './ClassForm'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('ClassForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows required validation errors when submitted empty', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ClassForm onSubmit={onSubmit} />)

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with valid payload when required fields are filled', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ClassForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/sınıf adı/i), '10-A')

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const callArg = onSubmit.mock.calls[0][0]
    expect(callArg.name).toBe('10-A')
    expect(callArg.isActive).toBe(true)
  })

  it('renders with initial values in edit mode', () => {
    const onSubmit = vi.fn()

    render(
      <ClassForm
        initialValues={{
          id: 'cls-1',
          name: '9-B',
          level: 'Lise',
          isActive: false,
        }}
        onSubmit={onSubmit}
      />,
    )

    expect((screen.getByLabelText(/sınıf adı/i) as HTMLInputElement).value).toBe('9-B')
    expect((screen.getByLabelText(/seviye/i) as HTMLInputElement).value).toBe('Lise')
  })
})
