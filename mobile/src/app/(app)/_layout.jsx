import { Redirect, Stack, useRouter } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AppHeader } from '@/components/app-header';
import { Button, Card } from '@/components/ui';
import { ConfirmProvider } from '@/lib/confirm-provider';
import { ToastProvider } from '@/lib/toast-provider';
import { useBrandLogo } from '@/theme/theme-context';

export default function AppLayout() {
  const { isAuthenticated, perfil, logout } = useAuth();
  const router = useRouter();
  const logo = useBrandLogo('logo');

  function sair() {
    logout();
    router.replace('/login');
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (perfil === 'cliente') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-stone-950 px-4">
        <Card className="w-full max-w-sm items-center p-8">
          <Image
            source={logo}
            style={{ width: 200, height: 90, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text className="text-lg font-semibold text-slate-800 dark:text-stone-100">
            Acesso restrito
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500 dark:text-stone-400">
            Este aplicativo é exclusivo da equipe da barbearia. Para agendar um
            horário, fale com a Xpress Code pelo WhatsApp.
          </Text>
          <View className="mt-6 w-full">
            <Button title="Sair" variant="secondary" onPress={sair} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <View className="flex-1 bg-slate-50 dark:bg-stone-950">
          <AppHeader />
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </ConfirmProvider>
    </ToastProvider>
  );
}
