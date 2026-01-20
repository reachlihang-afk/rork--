import { Tabs, useRouter } from "expo-router";
import { Home, Clock, User, ArrowLeft, Grid3x3 } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

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
