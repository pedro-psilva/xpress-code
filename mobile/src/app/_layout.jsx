import '../global.css';

import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/auth-context';

// Enquanto a sessão é lida do armazenamento, mostramos um spinner. Só então
// renderizamos o navegador, evitando redirecionar para o login antes da hora.
function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
