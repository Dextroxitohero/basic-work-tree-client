import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface Option {
  value: string
  label: string
}

/** Select simple sobre una lista corta. `value` vacío muestra el placeholder. */
export function OptionSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
  describedBy,
  disabled,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}) {
  return (
    <Select items={options} value={value || null} onValueChange={(v) => onChange(v ?? '')} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid} aria-describedby={describedBy} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
