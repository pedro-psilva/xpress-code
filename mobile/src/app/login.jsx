import { Link, Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { login as loginApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button, Card, ErrorBanner, Field, Input } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
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
    <View className="flex-1 items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm p-8">
        <Text className="mb-1 text-center text-xl font-bold text-indigo-600">
          ✂ Xpress Code
        </Text>
        <Text className="mb-6 text-center text-sm text-slate-500">Acesse sua conta</Text>
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
        <View className="mt-4 flex-row justify-center">
          <Text className="text-sm text-slate-500">Não tem conta? </Text>
          <Link href="/register" asChild>
            <Text className="text-sm font-medium text-indigo-600">Cadastre-se</Text>
          </Link>
        </View>
      </Card>
    </View>
  );
}
