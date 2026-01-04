// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { VerificationProvider } from "@/contexts/VerificationContext";
import { AuthContext } from "@/contexts/AuthContext";
import { CoinProvider } from "@/contexts/CoinContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SquareProvider } from "@/contexts/SquareContext";
import { FriendsContext } from "@/contexts/FriendsContext";

// Import CSS for web platform
if (Platform.OS === 'web') {
  require('./web-input-fix.css');
}


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="upload-reference" 
        options={{ 
          title: "参考照片",
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="verify-photo" 
        options={{ 
          title: "验证照片",
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="result/[id]" 
        options={{ 
          title: "验证结果",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="image-source" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="image-source-result/[id]" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="recharge" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="friends" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="add-friend" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="user-profile/[id]" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <Stack.Screen 
        name="friend-history/[id]" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />

    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthContext>
          <FriendsContext>
            <CoinProvider>
              <VerificationProvider>
                <SquareProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </SquareProvider>
              </VerificationProvider>
            </CoinProvider>
          </FriendsContext>
        </AuthContext>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
