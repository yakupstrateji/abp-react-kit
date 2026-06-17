import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PermissionEditor } from './PermissionEditor'
import type { VoloAbpPermissionManagementPermissionGroupDto } from '@/api/generated/types.gen'

const groups: VoloAbpPermissionManagementPermissionGroupDto[] = [
  {
    name: 'TestGroup',
    displayName: 'Test Group',
    permissions: [
      {
        name: 'Permission.A',
        displayName: 'Permission A',
        isGranted: false,
        isEditable: true,
      },
      {
        name: 'Permission.B',
        displayName: 'Permission B',
        isGranted: true,
        isEditable: true,
      },
    ],
  },
]

describe('PermissionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders group name and all permissions as checkboxes', () => {
    const onSave = vi.fn()
    render(
      <PermissionEditor
        groups={groups}
        onSave={onSave}
      />,
    )

    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Permission A/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Permission B/i })).toBeInTheDocument()
  })

  it('reflects initial grant state in checkboxes', () => {
    const onSave = vi.fn()
    render(
      <PermissionEditor
        groups={groups}
        onSave={onSave}
      />,
    )

    const checkboxA = screen.getByRole('checkbox', { name: /Permission A/i })
    const checkboxB = screen.getByRole('checkbox', { name: /Permission B/i })

    expect(checkboxA).not.toBeChecked()
    expect(checkboxB).toBeChecked()
  })

  it('calls onSave with only the CHANGED permissions (delta) when Kaydet is clicked', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()

    render(
      <PermissionEditor
        groups={groups}
        onSave={onSave}
      />,
    )

    // Toggle Permission.A from false -> true
    const checkboxA = screen.getByRole('checkbox', { name: /Permission A/i })
    await user.click(checkboxA)

    const saveBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const callArg = onSave.mock.calls[0][0] as Array<{ name: string; isGranted: boolean }>

    // Only the changed permission should be in the payload
    expect(callArg).toHaveLength(1)
    expect(callArg[0]).toEqual({ name: 'Permission.A', isGranted: true })
  })

  it('does NOT include unchanged permissions in the delta', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()

    render(
      <PermissionEditor
        groups={groups}
        onSave={onSave}
      />,
    )

    // Toggle Permission.A (false -> true), then toggle it back (true -> false) — net no change
    const checkboxA = screen.getByRole('checkbox', { name: /Permission A/i })
    await user.click(checkboxA)
    await user.click(checkboxA)

    const saveBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const callArg = onSave.mock.calls[0][0] as Array<{ name: string; isGranted: boolean }>
    // No net changes
    expect(callArg).toHaveLength(0)
  })
})
