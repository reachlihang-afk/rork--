import { Tabs, useRouter } from "expo-router";
import { Home, Clock, User, ArrowLeft, Grid3x3 } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useCoin } from "@/contexts/CoinContext";
import { useAuth } from "@/contexts/AuthContext";

// 首页header右侧的钻石组件
function HeaderCoinBadge() {
  const { coinBalance } = useCoin();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handlePress = () => {
    if (isLoggedIn) {
      router.push('/recharge' as any);
    } else {
      router.push('/(tabs)/profile' as any);
    }
  };

  return (
    <TouchableOpacity
      style={headerStyles.coinBadge}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={headerStyles.coinText}>💎 {coinBalance}</Text>
    </TouchableOpacity>
  );
}

const headerStyles = StyleSheet.create({
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 16,
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
          headerRight: () => <HeaderCoinBadge />,
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
