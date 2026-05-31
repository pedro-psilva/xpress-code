import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { atualizarPlano, buscarPlano, criarPlano } from '@/api/planos';
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

const VAZIO = {
  nome: '',
  frequencia: '',
  preco_corte: '',
  preco_corte_barba: '',
  desconto_extras: '0',
  descricao: '',
  ativo: true,
};

export default function PlanoForm({ id }) {
  const editando = Boolean(id);
  const router = useRouter();
  const [form, setForm] = useState(VAZIO);
  const [loading, setLoading] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!editando) return;
    buscarPlano(id)
      .then((p) =>
        setForm({
          nome: p.nome,
          frequencia: p.frequencia,
          preco_corte: String(p.preco_corte),
          preco_corte_barba: String(p.preco_corte_barba),
          desconto_extras: String(p.desconto_extras ?? 0),
          descricao: p.descricao ?? '',
          ativo: p.ativo,
        }),
      )
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editando]);

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    const precoCorte = Number(form.preco_corte);
    const precoBarba = Number(form.preco_corte_barba);
    const desconto = Number(form.desconto_extras);

    if (!form.nome.trim()) return setErro('Informe o nome do plano.');
    if (!form.frequencia.trim()) return setErro('Informe a frequência do plano.');
    if (Number.isNaN(precoCorte) || precoCorte <= 0)
      return setErro('Informe um preço (só corte) válido.');
    if (Number.isNaN(precoBarba) || precoBarba <= 0)
      return setErro('Informe um preço (corte + barba) válido.');
    if (precoBarba < precoCorte)
      return setErro('O preço com barba não pode ser menor que o só corte.');
    if (!Number.isInteger(desconto) || desconto < 0 || desconto > 100)
      return setErro('Desconto extras deve ser um inteiro entre 0 e 100.');

    setSalvando(true);
    setErro('');
    const payload = {
      nome: form.nome.trim(),
      frequencia: form.frequencia.trim(),
      preco_corte: precoCorte,
      preco_corte_barba: precoBarba,
      desconto_extras: desconto,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    };
    try {
      if (editando) await atualizarPlano(id, payload);
      else await criarPlano(payload);
      router.replace('/planos');
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
      <PageHeader title={editando ? 'Editar plano' : 'Novo plano'} />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <View className="gap-4">
          <Field label="Nome">
            <Input value={form.nome} onChangeText={(v) => update('nome', v)} />
          </Field>
          <Field label="Frequência" hint="Ex.: 2x no mês (seg–qui)">
            <Input
              value={form.frequencia}
              onChangeText={(v) => update('frequencia', v)}
            />
          </Field>
          <View className="flex-col gap-4 sm:flex-row">
            <View className="flex-1">
              <Field label="Preço só corte (R$)">
                <Input
                  value={form.preco_corte}
                  onChangeText={(v) => update('preco_corte', v)}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Preço corte + barba (R$)">
                <Input
                  value={form.preco_corte_barba}
                  onChangeText={(v) => update('preco_corte_barba', v)}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
          </View>
          <Field label="Desconto em serviços extras (%)" hint="0–100">
            <Input
              value={form.desconto_extras}
              onChangeText={(v) => update('desconto_extras', v)}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="Descrição (opcional)">
            <Input
              value={form.descricao}
              onChangeText={(v) => update('descricao', v)}
              multiline
              numberOfLines={3}
            />
          </Field>
          <View className="flex-row items-center gap-3">
            <Switch value={form.ativo} onValueChange={(v) => update('ativo', v)} />
            <Text className="text-sm text-slate-700 dark:text-stone-200">Plano ativo</Text>
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
              onPress={() => router.replace('/planos')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
