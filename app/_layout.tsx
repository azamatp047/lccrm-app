
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { activateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
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
    async function updateNavigationBar() {
      if (Platform.OS === 'android') {
        const colors = Colors[theme];
        try {
          await NavigationBar.setBackgroundColorAsync(colors.background);
          await NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
        } catch (e) {
          console.warn('Navigation Bar error:', e);
        }
      }
    }
    updateNavigationBar();
  }, [theme]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
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

  useEffect(() => {
    try {
      if (Platform.OS !== 'web') {
        activateKeepAwake();
      }
    } catch (e) {
      console.warn('Keep awake error:', e);
    }
  }, []);

  // if (!loaded) {
  //   return null;
  // }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
