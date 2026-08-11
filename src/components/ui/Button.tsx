import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md'

const containerVariants: Record<Variant, string> = {
  primary: 'bg-accent border-accent',
  secondary: 'bg-foose-surface border-foose-border',
  ghost: 'bg-transparent border-transparent',
  danger: 'bg-foose-danger-bg border-foose-danger-bg',
  success: 'bg-foose-success-bg border-foose-success',
}

const labelVariants: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-foose-text',
  ghost: 'text-accent',
  danger: 'text-foose-danger',
  success: 'text-foose-success',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 py-1.5',
  md: 'min-h-12 px-5 py-3',
}

const labelSizes: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-sm',
}

export function Button({
  className = '',
  disabled,
  full = false,
  icon,
  label,
  loading = false,
  size = 'md',
  variant = 'primary',
  ...props
}: PressableProps & {
  className?: string
  full?: boolean
  /** Optional leading glyph, rendered before the label. */
  icon?: ReactNode
  label: string
  loading?: boolean
  size?: Size
  variant?: Variant
}) {
  const inactive = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: Boolean(inactive) }}
      className={`flex-row items-center justify-center gap-2 rounded-xl border active:opacity-80 ${sizes[size]} ${
        inactive ? 'border-foose-border bg-foose-surface-mid' : containerVariants[variant]
      } ${full ? 'w-full' : ''} ${className}`}
      disabled={Boolean(inactive)}
      {...props}
    >
      {loading && <ActivityIndicator color={variant === 'primary' && !inactive ? '#ffffff' : '#757688'} size="small" />}
      {!loading && icon}
      <Text
        className={`font-bold ${labelSizes[size]} ${inactive ? 'text-foose-faint' : labelVariants[variant]}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
}
