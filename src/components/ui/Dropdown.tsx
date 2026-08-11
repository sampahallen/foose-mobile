import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

export type DropdownOption<Value extends string = string> = {
  disabled?: boolean
  label: string
  value: Value
}

export function Dropdown<Value extends string = string>({
  className = '',
  disabled = false,
  error,
  hint,
  label,
  onChange,
  options,
  placeholder = 'Select an option',
  value,
}: {
  className?: string
  disabled?: boolean
  error?: string
  hint?: string
  label?: string
  onChange: (value: Value) => void
  options: DropdownOption<Value>[]
  placeholder?: string
  value: Value | ''
}) {
  const colors = useThemeColors()
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <View className={`gap-1.5 ${className}`}>
      {!!label && <Text className="text-xs font-bold uppercase tracking-wide text-foose-muted">{label}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        className={`min-h-12 flex-row items-center justify-between rounded-xl border bg-foose-surface px-3.5 py-3 ${
          error ? 'border-foose-danger' : 'border-foose-border'
        } ${disabled ? 'opacity-50' : ''}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        <Text className={`flex-1 text-sm ${selected ? 'text-foose-text' : 'text-foose-faint'}`} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <Ionicons color={colors.faint} name="chevron-down" size={18} />
      </Pressable>
      {!!error && <Text className="text-xs font-semibold text-foose-danger">{error}</Text>}
      {!error && !!hint && <Text className="text-xs text-foose-faint">{hint}</Text>}

      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="max-h-[70%] rounded-t-2xl bg-foose-surface p-2 pb-6" onPress={() => {}}>
            {!!label && <Text className="px-3.5 py-3 text-sm font-black text-foose-text">{label}</Text>}
            <ScrollView bounces={false}>
              {options.map((option) => {
                const active = option.value === value
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: option.disabled, selected: active }}
                    className={`flex-row items-center justify-between gap-3 rounded-xl px-3.5 py-3 ${active ? 'bg-accent-light' : ''} ${option.disabled ? 'opacity-40' : ''}`}
                    disabled={option.disabled}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Text className={`flex-1 text-sm font-semibold ${active ? 'text-accent' : 'text-foose-text'}`}>{option.label}</Text>
                    {active && <Ionicons color={colors.accent} name="checkmark" size={18} />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
