/**
 * Raw hex mirror of the CSS variables in `src/global.css`, for the React Native props that take a
 * color value rather than a class: `placeholderTextColor`, icon `color`, `ActivityIndicator`,
 * navigation options, status bar. Keep both files in step when a token changes.
 */
export type ThemeColors = {
  accent: string
  accentStrong: string
  accentLight: string
  bg: string
  surface: string
  surfaceLow: string
  surfaceMid: string
  surfaceHigh: string
  text: string
  muted: string
  faint: string
  border: string
  danger: string
  success: string
}

export const PALETTE: Record<'light' | 'dark', ThemeColors> = {
  light: {
    accent: '#2642fb',
    accentStrong: '#0026d6',
    accentLight: '#e8ebff',
    bg: '#fbf8ff',
    surface: '#ffffff',
    surfaceLow: '#f4f2ff',
    surfaceMid: '#eeecfb',
    surfaceHigh: '#e2e1ef',
    text: '#1a1b25',
    muted: '#5e5f5c',
    faint: '#757688',
    border: '#c5c5da',
    danger: '#ba1a1a',
    success: '#16833d',
  },
  dark: {
    accent: '#6b7dff',
    accentStrong: '#8a99ff',
    accentLight: '#232a5c',
    bg: '#121218',
    surface: '#1b1b24',
    surfaceLow: '#232430',
    surfaceMid: '#2b2c3a',
    surfaceHigh: '#383a4c',
    text: '#f1f1f6',
    muted: '#b4b5c4',
    faint: '#85869a',
    border: '#3a3c50',
    danger: '#ff8a80',
    success: '#6fe3a0',
  },
}
