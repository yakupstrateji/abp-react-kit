import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeatureEditor } from './FeatureEditor'

// ---------------------------------------------------------------------------
// Mock featureService
// ---------------------------------------------------------------------------

const mockGetFeatures = vi.fn()
const mockUpdateFeatures = vi.fn()

vi.mock('./featureService', () => ({
  getFeatures: (...args: unknown[]) => mockGetFeatures(...args),
  updateFeatures: (...args: unknown[]) => mockUpdateFeatures(...args),
}))

// ---------------------------------------------------------------------------
// Mock sonner
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Test payload
// ---------------------------------------------------------------------------

const mockGroups = [
  {
    name: 'FeatureGroup1',
    displayName: 'Feature Group 1',
    features: [
      {
        name: 'Feature.Toggle',
        displayName: 'Toggle Feature',
        value: 'false',
        description: 'A toggle feature',
        valueType: { name: 'ToggleStringValueType', properties: {} },
        depth: 0,
        parentName: null,
      },
      {
        name: 'Feature.Text',
        displayName: 'Text Feature',
        value: 'hello',
        description: 'A text feature',
        valueType: { name: 'FreeTextStringValueType', properties: {} },
        depth: 0,
        parentName: null,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helper: create a fresh QueryClient per test
// ---------------------------------------------------------------------------

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function renderEditor(props?: { onClose?: () => void }) {
  const onClose = props?.onClose ?? vi.fn()
  const client = makeClient()
  const result = render(
    <QueryClientProvider client={client}>
      <FeatureEditor
        tenantId="tenant-1"
        tenantName="Test Tenant"
        open={true}
        onClose={onClose}
      />
    </QueryClientProvider>,
  )
  return { ...result, onClose }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeatureEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFeatures.mockResolvedValue({ groups: mockGroups })
    mockUpdateFeatures.mockResolvedValue(undefined)
  })

  it('shows a spinner while loading', () => {
    // Keep the promise pending
    mockGetFeatures.mockReturnValue(new Promise(() => {}))
    renderEditor()
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it('renders group name and all features after loading', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByText('Feature Group 1')).toBeInTheDocument()
    })
    expect(screen.getByRole('checkbox', { name: /Toggle Feature/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Text Feature/i })).toBeInTheDocument()
  })

  it('reflects initial feature values', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Toggle Feature/i })).toBeInTheDocument()
    })
    const toggle = screen.getByRole('checkbox', { name: /Toggle Feature/i })
    expect(toggle).not.toBeChecked() // initial value is 'false'

    const textInput = screen.getByRole('textbox', { name: /Text Feature/i })
    expect(textInput).toHaveValue('hello')
  })

  it('calls updateFeatures with ONLY the changed feature when Kaydet is clicked', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Toggle Feature/i })).toBeInTheDocument()
    })

    // Toggle the checkbox: 'false' -> 'true'
    const toggle = screen.getByRole('checkbox', { name: /Toggle Feature/i })
    await user.click(toggle)

    // Click Kaydet
    const saveBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateFeatures).toHaveBeenCalledTimes(1)
    })

    const [tenantId, changes] = mockUpdateFeatures.mock.calls[0] as [
      string,
      Array<{ name: string; value: string }>,
    ]

    expect(tenantId).toBe('tenant-1')
    // Only the changed feature should be in the delta
    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({ name: 'Feature.Toggle', value: 'true' })
  })

  it('does NOT include unchanged features in the delta', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Toggle Feature/i })).toBeInTheDocument()
    })

    // Toggle on then off — net change = none
    const toggle = screen.getByRole('checkbox', { name: /Toggle Feature/i })
    await user.click(toggle)
    await user.click(toggle)

    const saveBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateFeatures).toHaveBeenCalledTimes(1)
    })

    const [, changes] = mockUpdateFeatures.mock.calls[0] as [
      string,
      Array<{ name: string; value: string }>,
    ]
    expect(changes).toHaveLength(0)
  })

  it('shows success toast and closes on successful save', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    const onClose = vi.fn()

    const client = makeClient()
    render(
      <QueryClientProvider client={client}>
        <FeatureEditor
          tenantId="tenant-1"
          tenantName="Test Tenant"
          open={true}
          onClose={onClose}
        />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Toggle Feature/i })).toBeInTheDocument()
    })

    const toggle = screen.getByRole('checkbox', { name: /Toggle Feature/i })
    await user.click(toggle)

    const saveBtn = screen.getByRole('button', { name: /kaydet/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Özellikler güncellendi')
    })
    expect(onClose).toHaveBeenCalled()
  })
})
