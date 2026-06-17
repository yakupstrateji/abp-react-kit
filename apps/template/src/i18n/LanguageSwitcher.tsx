import { useLanguages } from '@strateji/abp-react-core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSwitcher() {
  const { languages, current, change } = useLanguages()

  if (languages.length <= 1) return null

  return (
    <Select value={current} onValueChange={change}>
      <SelectTrigger className="w-[120px]" aria-label="Dil seçin">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.cultureName} value={lang.cultureName}>
            {lang.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

