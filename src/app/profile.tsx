import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { AuthRequired } from '../components/auth/AuthRequired'
import { InlineNotice } from '../components/feedback/InlineNotice'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../hooks/useAuth'
import { useThemeColors } from '../hooks/useThemeColors'
import { formatMoney } from '../utils/format'

function ProfileRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const colors = useThemeColors()

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 border-b border-foose-border px-4 py-4 active:bg-foose-surface-low"
      onPress={onPress}
    >
      <Ionicons color={colors.accent} name={icon} size={20} />
      <Text className="min-w-0 flex-1 text-sm font-semibold text-foose-text">{label}</Text>
      <Ionicons color={colors.faint} name="chevron-forward" size={16} />
    </Pressable>
  )
}

function ProfileContent() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <ScrollView contentContainerClassName="pb-10">
      <View className="gap-3 p-4">
        <View className="flex-row items-center gap-3">
          <Avatar name={user.name} size={64} uri={user.profilePhoto} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-lg font-bold text-foose-text" numberOfLines={1}>
              {user.name}
            </Text>
            <Text className="text-sm text-foose-muted" numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {user.isKycVerified && <Badge label="KYC verified" tone="success" />}
          {user.hasShop && <Badge label="DigiShop owner" />}
          {!user.isEmailVerified && <Badge label="Email unverified" tone="warning" />}
        </View>

        {!user.isEmailVerified && (
          <InlineNotice title="Verify your email" tone="warning">
            Messaging, checkout, and opening a DigiShop stay locked until your email is verified.
          </InlineNotice>
        )}

        {!!user.wallet && user.hasShop && (
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1 rounded-xl border border-foose-border bg-foose-surface p-3.5">
              <Text className="text-xs text-foose-muted">Wallet balance</Text>
              <Text className="text-base font-black text-foose-text">{formatMoney(user.wallet.balance)}</Text>
            </View>
            <View className="flex-1 gap-1 rounded-xl border border-foose-border bg-foose-surface p-3.5">
              <Text className="text-xs text-foose-muted">In escrow</Text>
              <Text className="text-base font-black text-foose-text">{formatMoney(user.wallet.escrow)}</Text>
            </View>
          </View>
        )}
      </View>

      <View className="border-t border-foose-border bg-foose-surface">
        <ProfileRow icon="receipt-outline" label="Your orders" onPress={() => router.push('/orders')} />
        <ProfileRow icon="bag-outline" label="Cart" onPress={() => router.push('/cart')} />
        <ProfileRow icon="heart-outline" label="Saved" onPress={() => router.push('/saved')} />
        <ProfileRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View className="p-4">
        <Text className="text-xs text-foose-faint">
          Selling tools — DigiShop setup, listings, KYC, and payouts — live on the Foose web app.
        </Text>
      </View>
    </ScrollView>
  )
}

export default function ProfileScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Profile" />
      <AuthRequired body="Sign in to see your profile, orders, and settings." title="Your profile">
        <ProfileContent />
      </AuthRequired>
    </Screen>
  )
}
