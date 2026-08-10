import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'
import { ToastProvider } from '../components/feedback/ToastProvider'
import { PALETTE } from '../constants/palette'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { MessagingProvider } from '../context/MessagingContext'
import { ThemeProvider } from '../context/ThemeContext'

function RootStack() {
  const { colorScheme } = useColorScheme()
  const colors = colorScheme === 'dark' ? PALETTE.dark : PALETTE.light

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.bg },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Cart reads the signed-in user to block self-purchase, and messaging needs the token, so
            both sit inside AuthProvider. */}
        <AuthProvider>
          <CartProvider>
            <MessagingProvider>
              <ToastProvider>
                <RootStack />
              </ToastProvider>
            </MessagingProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
