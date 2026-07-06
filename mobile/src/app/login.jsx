import { Link, Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { login as loginApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button, Card, ErrorBanner, Field, Input } from '@/components/ui';
import { useBrandLogo } from '@/theme/theme-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const logo = useBrandLogo('logo');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function handleSubmit() {
    setEnviando(true);
    setErro('');
    try {
      const { access_token, perfil } = await loginApi(email, senha);
      await login(access_token, perfil);
      router.replace('/');
    } catch (err) {
      setErro(getErrorMessage(err));
      setEnviando(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-stone-950 px-4">
      <Card className="w-full max-w-sm p-8">
        <Image
          source={logo}
          style={{ width: 240, height: 112, alignSelf: 'center', marginBottom: 8 }}
          resizeMode="contain"
        />
        <Text className="mb-6 text-center text-sm text-slate-500 dark:text-stone-400">
          Acesso da equipe da barbearia
        </Text>
        <ErrorBanner message={erro} />
        <View className="gap-4">
          <Field label="E-mail">
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>
          <Field label="Senha">
            <Input value={senha} onChangeText={setSenha} secureTextEntry />
          </Field>
          <Button
            title={enviando ? 'Entrando…' : 'Entrar'}
            onPress={handleSubmit}
            loading={enviando}
          />
        </View>
      </Card>
      <Link
        href="/politicas-de-privacidade"
        className="mt-6 text-sm text-slate-500 dark:text-stone-400"
      >
        Política de Privacidade
      </Link>
    </View>
  );
}
