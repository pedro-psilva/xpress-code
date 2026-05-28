import { Link, Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { login as loginApi, register as registerApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button, Card, ErrorBanner, Field, Input } from '@/components/ui';
import { useBrandLogo } from '@/theme/theme-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const logo = useBrandLogo('logo');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    setEnviando(true);
    setErro('');
    try {
      await registerApi({ ...form, telefone: form.telefone || null });
      // Entra automaticamente após o cadastro.
      const { access_token, perfil } = await loginApi(form.email, form.senha);
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
          Criar conta de cliente
        </Text>
        <ErrorBanner message={erro} />
        <View className="gap-4">
          <Field label="Nome">
            <Input value={form.nome} onChangeText={(v) => update('nome', v)} />
          </Field>
          <Field label="E-mail">
            <Input
              value={form.email}
              onChangeText={(v) => update('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>
          <Field label="Senha" hint="Mínimo 6 caracteres">
            <Input
              value={form.senha}
              onChangeText={(v) => update('senha', v)}
              secureTextEntry
            />
          </Field>
          <Field label="Telefone (opcional)">
            <Input
              value={form.telefone}
              onChangeText={(v) => update('telefone', v)}
              keyboardType="phone-pad"
            />
          </Field>
          <Button
            title={enviando ? 'Cadastrando…' : 'Cadastrar'}
            onPress={handleSubmit}
            loading={enviando}
          />
        </View>
        <View className="mt-4 flex-row justify-center">
          <Text className="text-sm text-slate-500 dark:text-stone-400">Já tem conta? </Text>
          <Link href="/login" asChild>
            <Text className="text-sm font-medium text-brand-700">Entrar</Text>
          </Link>
        </View>
      </Card>
    </View>
  );
}
