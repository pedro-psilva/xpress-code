// Formulário de serviço, usado tanto para criar quanto para editar. Quando
// recebe `id`, carrega o serviço e atualiza; caso contrário, cria um novo.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { atualizarServico, buscarServico, criarServico } from '@/api/servicos';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  Loading,
  PageHeader,
  Screen,
} from '@/components/ui';

const VAZIO = { nome: '', preco: '', duracao_minutos: '', ativo: true };

export default function ServicoForm({ id }) {
  const editando = Boolean(id);
  const router = useRouter();
  const [form, setForm] = useState(VAZIO);
  const [loading, setLoading] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!editando) return;
    buscarServico(id)
      .then((s) =>
        setForm({
          nome: s.nome,
          preco: String(s.preco),
          duracao_minutos: String(s.duracao_minutos),
          ativo: s.ativo,
        }),
      )
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editando]);

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    const preco = Number(form.preco);
    const duracao = Number(form.duracao_minutos);

    if (!form.nome.trim()) return setErro('Informe o nome do serviço.');
    if (Number.isNaN(preco) || preco < 0) return setErro('Informe um preço válido.');
    if (!Number.isInteger(duracao) || duracao < 1) {
      return setErro('Informe uma duração válida (em minutos).');
    }

    setSalvando(true);
    setErro('');
    const payload = { nome: form.nome.trim(), preco, duracao_minutos: duracao, ativo: form.ativo };
    try {
      if (editando) await atualizarServico(id, payload);
      else await criarServico(payload);
      router.replace('/servicos');
    } catch (err) {
      setErro(getErrorMessage(err));
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title={editando ? 'Editar serviço' : 'Novo serviço'} />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <View className="gap-4">
          <Field label="Nome">
            <Input value={form.nome} onChangeText={(v) => update('nome', v)} />
          </Field>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Field label="Preço (R$)">
                <Input
                  value={form.preco}
                  onChangeText={(v) => update('preco', v)}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Duração (min)">
                <Input
                  value={form.duracao_minutos}
                  onChangeText={(v) => update('duracao_minutos', v)}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Switch value={form.ativo} onValueChange={(v) => update('ativo', v)} />
            <Text className="text-sm text-slate-700">Serviço ativo</Text>
          </View>
          <View className="flex-row gap-2 pt-2">
            <Button
              title={salvando ? 'Salvando…' : 'Salvar'}
              onPress={handleSubmit}
              loading={salvando}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => router.replace('/servicos')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
