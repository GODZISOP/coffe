import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { useColorScheme } from '../src/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../src/context/AuthProvider';
import { CartProvider } from '../src/context/CartProvider';
import AppLoader from '../src/components/AppLoader';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    // Hide the splash screen once we are ready
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login' || segments[0] === 'get-started';

    if (!session && !inAuthGroup) {
      // Redirect to the get started page.
      router.replace('/get-started');
    } else if (session && inAuthGroup) {
      // Redirect away from the auth pages.
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="get-started" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="drink" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="tracking" options={{ headerShown: false }} />
        <Stack.Screen name="ai-assistant" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
