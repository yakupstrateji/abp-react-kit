import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type {
  VoloAbpFeatureManagementFeatureDto,
  VoloAbpFeatureManagementFeatureGroupDto,
} from '@/api/generated/types.gen'
import { getFeatures, updateFeatures } from './featureService'
import { useL } from '@yakupsogut/abp-react-core'

// ---------------------------------------------------------------------------
// Types helpers — the generated IStringValueType uses { properties: unknown }
// ABP runtime sends selection items as properties.itemSource.items
// ---------------------------------------------------------------------------

interface SelectionItem {
  value: string
  displayText: { name: string } | string
}

function getSelectionItems(feature: VoloAbpFeatureManagementFeatureDto): SelectionItem[] {
  try {
    const props = feature.valueType?.properties as Record<string, unknown> | undefined
    const itemSource = props?.itemSource as { items?: SelectionItem[] } | undefined
    return itemSource?.items ?? []
  } catch {
    return []
  }
}

function getItemDisplayText(item: SelectionItem): string {
  if (typeof item.displayText === 'string') return item.displayText
  return item.displayText?.name ?? item.value
}

// ---------------------------------------------------------------------------
// Build initial values map from groups
// ---------------------------------------------------------------------------

function buildValuesMap(
  groups: VoloAbpFeatureManagementFeatureGroupDto[],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const group of groups) {
    for (const feature of group.features ?? []) {
      if (feature.name != null) {
        map.set(feature.name, feature.value ?? '')
      }
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Single feature control
// ---------------------------------------------------------------------------

interface FeatureControlProps {
  feature: VoloAbpFeatureManagementFeatureDto
  value: string
  disabled: boolean
  onChange: (name: string, value: string) => void
}

function FeatureControl({ feature, value, disabled, onChange }: FeatureControlProps) {
  const valueTypeName = feature.valueType?.name ?? ''
  const featureId = `feature-${feature.name ?? ''}`

  if (valueTypeName === 'ToggleStringValueType') {
    const checked = value === 'true'
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={featureId}
          aria-label={feature.displayName ?? feature.name ?? ''}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(c) => onChange(feature.name!, c ? 'true' : 'false')}
        />
        <div className="flex items-center gap-1">
          <Label htmlFor={featureId} className="cursor-pointer text-sm font-normal">
            {feature.displayName ?? feature.name}
          </Label>
          {feature.description && (
            <span className="text-xs text-muted-foreground">— {feature.description}</span>
          )}
        </div>
      </div>
    )
  }

  if (valueTypeName === 'SelectionStringValueType') {
    const items = getSelectionItems(feature)
    return (
      <div className="flex flex-col gap-1">
        <Label htmlFor={featureId}>{feature.displayName ?? feature.name}</Label>
        {feature.description && (
          <p className="text-xs text-muted-foreground">{feature.description}</p>
        )}
        <Select
          value={value}
          disabled={disabled}
          onValueChange={(v) => onChange(feature.name!, v)}
        >
          <SelectTrigger id={featureId} aria-label={feature.displayName ?? feature.name ?? ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {getItemDisplayText(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // FreeTextStringValueType or any other type → text input
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={featureId}>{feature.displayName ?? feature.name}</Label>
      {feature.description && (
        <p className="text-xs text-muted-foreground">{feature.description}</p>
      )}
      <Input
        id={featureId}
        type="text"
        aria-label={feature.displayName ?? feature.name ?? ''}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(feature.name!, e.target.value)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main editor (groups + save button)
// ---------------------------------------------------------------------------

interface FeatureEditorInnerProps {
  groups: VoloAbpFeatureManagementFeatureGroupDto[]
  tenantId: string
  onClose: () => void
}

function FeatureEditorInner({ groups, tenantId, onClose }: FeatureEditorInnerProps) {
  const L = useL()
  const [original, setOriginal] = useState<Map<string, string>>(() => buildValuesMap(groups))
  const [current, setCurrent] = useState<Map<string, string>>(() => buildValuesMap(groups))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const map = buildValuesMap(groups)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOriginal(map)
    setCurrent(new Map(map))
  }, [groups])

  const handleChange = useCallback((name: string, value: string) => {
    setCurrent((prev) => {
      const next = new Map(prev)
      next.set(name, value)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    const delta: Array<{ name: string; value: string }> = []
    for (const [name, value] of current.entries()) {
      if (original.get(name) !== value) {
        delta.push({ name, value })
      }
    }

    setSaving(true)
    try {
      await updateFeatures(tenantId, delta)
      toast.success(L('SchollApp::FeaturesUpdated', 'Özellikler güncellendi'))
      // Refresh original to current after successful save
      setOriginal(new Map(current))
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : L('SchollApp::FeaturesSaveFailed', 'Özellikler kaydedilemedi')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [L, current, original, tenantId, onClose])

  return (
    <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
            {group.displayName ?? group.name}
          </h3>
          <div className="flex flex-col gap-3 pl-2">
            {(group.features ?? []).map((feature) => {
              if (!feature.name) return null
              const value = current.get(feature.name) ?? ''
              return (
                <FeatureControl
                  key={feature.name}
                  feature={feature}
                  value={value}
                  disabled={saving}
                  onChange={handleChange}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2 border-t">
        <Button type="button" variant="primary" loading={saving} onClick={handleSave}>
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exported component — wraps the editor in a Modal, fetches data
// ---------------------------------------------------------------------------

export interface FeatureEditorProps {
  tenantId: string
  tenantName: string
  open: boolean
  onClose: () => void
}

export function FeatureEditor({ tenantId, tenantName, open, onClose }: FeatureEditorProps) {
  const L = useL()
  const query = useQuery({
    queryKey: ['tenant-features', tenantId],
    queryFn: () => getFeatures(tenantId),
    enabled: open && !!tenantId,
  })

  return (
    <Modal open={open} onClose={onClose} title={`${L('SchollApp::Features', 'Özellikler')} — ${tenantName}`}>
      {query.isLoading ? (
        <Spinner label={L('SchollApp::Loading', 'Yükleniyor…')} />
      ) : query.isError ? (
        <p className="text-sm text-red-600">{L('SchollApp::FeaturesLoadFailed', 'Özellikler yüklenemedi.')}</p>
      ) : (
        <FeatureEditorInner
          groups={query.data?.groups ?? []}
          tenantId={tenantId}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}
