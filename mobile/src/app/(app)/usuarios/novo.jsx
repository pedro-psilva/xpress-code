import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { criarUsuario } from '@/api/usuarios';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeader,
  Screen,
  Select,
} from '@/components/ui';

export default function NovoUsuarioScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    perfil: 'cliente',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    if (!form.nome.trim()) return setErro('Informe o nome.');
    if (!form.email.trim()) return setErro('Informe o e-mail.');
    if (form.senha.length < 6) return setErro('A senha deve ter ao menos 6 caracteres.');

    setSalvando(true);
    setErro('');
    try {
      await criarUsuario({
        ...form,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone || null,
      });
      router.replace('/usuarios');
    } catch (err) {
      setErro(getErrorMessage(err));
      setSalvando(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Novo usuário" />
      <ErrorBanner message={erro} />
      <Card className="p-6">
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
            />
          </Field>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Field label="Senha" hint="Mínimo 6 caracteres">
                <Input
                  value={form.senha}
                  onChangeText={(v) => update('senha', v)}
                  secureTextEntry
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Perfil">
                <Select
                  selectedValue={form.perfil}
                  onValueChange={(v) => update('perfil', v)}
                >
                  <Select.Item label="Cliente" value="cliente" />
                  <Select.Item label="Profissional" value="profissional" />
                  <Select.Item label="Admin" value="admin" />
                </Select>
              </Field>
            </View>
          </View>
          <Field label="Telefone (opcional)">
            <Input
              value={form.telefone}
              onChangeText={(v) => update('telefone', v)}
              keyboardType="phone-pad"
            />
          </Field>
          <View className="flex-row gap-2 pt-2">
            <Button
              title={salvando ? 'Salvando…' : 'Cadastrar'}
              onPress={handleSubmit}
              loading={salvando}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => router.replace('/usuarios')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
