import { forwardRef } from 'react'
import { Text, TextInput, View, type TextInputProps } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

export const Input = forwardRef<TextInput, TextInputProps & { error?: string; hint?: string; label?: string }>(
  function Input({ className = '', error, hint, label, ...props }, ref) {
    const colors = useThemeColors()

    return (
      <View className="gap-1.5">
        {!!label && <Text className="text-xs font-bold uppercase tracking-wide text-foose-muted">{label}</Text>}
        <TextInput
          className={`min-h-12 rounded-xl border bg-foose-surface px-3.5 py-3 text-sm text-foose-text ${
            error ? 'border-foose-danger' : 'border-foose-border'
          } ${className}`}
          placeholderTextColor={colors.faint}
          ref={ref}
          {...props}
        />
        {!!error && <Text className="text-xs font-semibold text-foose-danger">{error}</Text>}
        {!error && !!hint && <Text className="text-xs text-foose-faint">{hint}</Text>}
      </View>
    )
  },
)
