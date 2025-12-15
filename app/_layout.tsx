
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const inLogin = segments[0] === 'login';

    if (!isLoading) {
      if (!user && !inLogin) {
        router.replace('/login');
      } else if (user && inLogin) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, rootNavigationState, segments]);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Load any custom fonts here if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // if (!loaded) {
  //   return null;
  // }

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
