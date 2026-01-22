import { Tabs, useRouter } from "expo-router";
import { Home, Clock, User, ArrowLeft, Grid3x3, Bell } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCoin } from "@/contexts/CoinContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

// 首页header右侧组件（通知+钻石）
function HeaderRightSection() {
  const { coinBalance } = useCoin();
  const { isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handleCoinPress = () => {
    if (isLoggedIn) {
      router.push('/recharge' as any);
    } else {
      router.push('/(tabs)/profile' as any);
    }
  };

  const handleNotificationPress = () => {
    if (isLoggedIn) {
      router.push('/notifications' as any);
    } else {
      router.push('/(tabs)/profile' as any);
    }
  };

  return (
    <View style={headerStyles.headerRightContainer}>
      {/* 通知图标 */}
      {isLoggedIn && (
        <TouchableOpacity
          style={headerStyles.notificationButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#475569" />
          {unreadCount > 0 && (
            <View style={headerStyles.notificationBadge}>
              <Text style={headerStyles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      {/* 钻石余额 */}
      <TouchableOpacity
        style={headerStyles.coinBadge}
        onPress={handleCoinPress}
        activeOpacity={0.7}
      >
        <Text style={headerStyles.coinText}>💎 {coinBalance}</Text>
      </TouchableOpacity>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});

export default function TabLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: 80,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.title'),
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
          headerRight: () => <HeaderRightSection />,
        }}
      />
      <Tabs.Screen
        name="square"
        options={{
          title: t('square.title'),
          tabBarIcon: ({ color }) => <Grid3x3 size={22} color={color} strokeWidth={2} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('history.title'),
          tabBarIcon: ({ color }) => <Clock size={22} color={color} strokeWidth={2} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
