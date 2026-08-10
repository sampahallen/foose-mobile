import { useColorScheme } from 'nativewind'
import { PALETTE, type ThemeColors } from '../constants/palette'

/** Hex tokens for the React Native props that cannot take a Tailwind class. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme()
  return colorScheme === 'dark' ? PALETTE.dark : PALETTE.light
}
