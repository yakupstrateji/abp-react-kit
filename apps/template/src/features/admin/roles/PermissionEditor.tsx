import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { VoloAbpPermissionManagementPermissionGroupDto } from '@/api/generated/types.gen'
import { useL } from '@yakupsogut/abp-react-core'

export interface PermissionEditorProps {
  groups: VoloAbpPermissionManagementPermissionGroupDto[]
  onSave: (changes: Array<{ name: string; isGranted: boolean }>) => void | Promise<void>
  loading?: boolean
}

function buildGrantsMap(
  groups: VoloAbpPermissionManagementPermissionGroupDto[],
): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const group of groups) {
    for (const perm of group.permissions ?? []) {
      if (perm.name) {
        map.set(perm.name, !!perm.isGranted)
      }
    }
  }
  return map
}

export function PermissionEditor({ groups, onSave, loading }: PermissionEditorProps) {
  const L = useL()
  const [original, setOriginal] = useState<Map<string, boolean>>(() => buildGrantsMap(groups))
  const [current, setCurrent] = useState<Map<string, boolean>>(() => buildGrantsMap(groups))
  const [saving, setSaving] = useState(false)

  // Re-initialize when groups prop changes
  useEffect(() => {
    const map = buildGrantsMap(groups)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOriginal(map)
    setCurrent(new Map(map))
  }, [groups])

  const handleToggle = useCallback((name: string, checked: boolean) => {
    setCurrent((prev) => {
      const next = new Map(prev)
      next.set(name, checked)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    const delta: Array<{ name: string; isGranted: boolean }> = []
    for (const [name, isGranted] of current.entries()) {
      if (original.get(name) !== isGranted) {
        delta.push({ name, isGranted })
      }
    }

    setSaving(true)
    try {
      await onSave(delta)
    } finally {
      setSaving(false)
    }
  }, [current, original, onSave])

  const isBusy = saving || loading

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
            {group.displayName ?? group.name}
          </h3>
          <div className="flex flex-col gap-2 pl-2">
            {(group.permissions ?? []).map((perm) => {
              if (!perm.name) return null
              const isGranted = current.get(perm.name) ?? false
              const checkboxId = `perm-${perm.name}`
              return (
                <div key={perm.name} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    aria-label={perm.displayName ?? perm.name}
                    checked={isGranted}
                    disabled={!perm.isEditable || isBusy}
                    onCheckedChange={(checked) => handleToggle(perm.name!, !!checked)}
                  />
                  <Label
                    htmlFor={checkboxId}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {perm.displayName ?? perm.name}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          loading={isBusy}
          onClick={handleSave}
        >
          {L('AbpUi::Save', 'Kaydet')}
        </Button>
      </div>
    </div>
  )
}
