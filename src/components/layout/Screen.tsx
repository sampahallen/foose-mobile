import type { ReactNode } from 'react'
import { View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

/**
 * Page shell. The tab bar already reserves the bottom inset, so screens inside `(tabs)` should keep
 * the default `['top']` edges and let the bar handle the rest.
 *
 * `topInsetClassName` paints the safe-area strip itself (status bar area), not just the content
 * below it — it defaults to `bg-accent` because nearly every screen pairs `Screen` with the accent
 * `TopBar`, and the inset strip needs to match so there's no color seam above the header. Screens
 * with their own non-accent header (e.g. `search.tsx`) should override it to match that header.
 */
export function Screen({
  children,
  className = '',
  edges = ['top'],
  topInsetClassName = 'bg-accent',
}: {
  children: ReactNode
  className?: string
  edges?: Edge[]
  topInsetClassName?: string
}) {
  return (
    <SafeAreaView className={`flex-1 ${topInsetClassName}`} edges={edges}>
      <View className={`flex-1 bg-foose-bg ${className}`}>{children}</View>
    </SafeAreaView>
  )
}
