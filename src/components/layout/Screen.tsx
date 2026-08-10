import type { ReactNode } from 'react'
import { View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

/**
 * Page shell. The tab bar already reserves the bottom inset, so screens inside `(tabs)` should keep
 * the default `['top']` edges and let the bar handle the rest.
 */
export function Screen({
  children,
  className = '',
  edges = ['top'],
}: {
  children: ReactNode
  className?: string
  edges?: Edge[]
}) {
  return (
    <SafeAreaView className="flex-1 bg-foose-bg" edges={edges}>
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  )
}
