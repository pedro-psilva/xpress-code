import '../global.css';

import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { ThemeProvider, useTheme } from '@/theme/theme-context';

function RootNavigator() {
  const { loading: authLoading } = useAuth();
  const { pronto: temaPronto, tema } = useTheme();
  const ehDark = tema === 'dark';

  if (authLoading || !temaPronto) {
    return (
      <View
        className={`flex-1 items-center justify-center bg-slate-50 dark:bg-stone-950 ${ehDark ? 'dark' : ''}`}
      >
        <ActivityIndicator size="large" color="#d4922a" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${ehDark ? 'dark' : ''}`}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
