// Layout do grupo autenticado. Funciona como "rota protegida": se não houver
// sessão, redireciona ao login. O cabeçalho fica fixo no topo e as telas são
// trocadas pela Stack abaixo dele.
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AppHeader } from '@/components/app-header';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
