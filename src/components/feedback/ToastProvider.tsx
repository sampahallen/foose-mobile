import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ToastTone = 'error' | 'info' | 'success'

type Toast = { id: number; message: string; tone: ToastTone }

const ToastContext = createContext<{ showToast: (message: string, tone?: ToastTone) => void } | null>(null)

const tones: Record<ToastTone, string> = {
  error: 'bg-foose-danger',
  info: 'bg-foose-text',
  success: 'bg-foose-success',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    idRef.current += 1
    const id = idRef.current
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <View className="absolute inset-x-0 z-50 gap-2 px-4" pointerEvents="none" style={{ bottom: insets.bottom + 88 }}>
          {toasts.map((toast) => (
            <View className={`rounded-xl px-4 py-3 shadow-lg ${tones[toast.tone]}`} key={toast.id}>
              <Text className="text-sm font-semibold text-white">{toast.message}</Text>
            </View>
          ))}
        </View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
