import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentForm } from './StudentForm'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/features/classes/useClasses', () => ({
  useClassOptions: () => ({ data: [], isLoading: false }),
}))

describe('StudentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows required validation errors when submitted empty', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<StudentForm onSubmit={onSubmit} />)

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

    render(<StudentForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/öğrenci numarası/i), '12345')
    await user.type(screen.getByLabelText(/^ad$/i), 'Ali')
    await user.type(screen.getByLabelText(/^soyad$/i), 'Veli')

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const callArg = onSubmit.mock.calls[0][0]
    expect(callArg.studentNumber).toBe('12345')
    expect(callArg.name).toBe('Ali')
    expect(callArg.surname).toBe('Veli')
    expect(callArg.isActive).toBe(true)
  })

  it('renders with initial values in edit mode', () => {
    const onSubmit = vi.fn()

    render(
      <StudentForm
        initialValues={{
          id: 'abc123',
          name: 'Ayşe',
          surname: 'Kaya',
          studentNumber: '99999',
          classroom: '10-A',
          isActive: false,
        }}
        onSubmit={onSubmit}
      />,
    )

    expect((screen.getByLabelText(/^ad$/i) as HTMLInputElement).value).toBe('Ayşe')
    expect((screen.getByLabelText(/^soyad$/i) as HTMLInputElement).value).toBe('Kaya')
    expect((screen.getByLabelText(/öğrenci numarası/i) as HTMLInputElement).value).toBe('99999')
  })

  it('validates email format when provided', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<StudentForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/öğrenci numarası/i), '12345')
    await user.type(screen.getByLabelText(/^ad$/i), 'Ali')
    await user.type(screen.getByLabelText(/^soyad$/i), 'Veli')
    await user.type(screen.getByLabelText(/e-posta/i), 'not-an-email')

    const submitBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(submitBtn)

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
