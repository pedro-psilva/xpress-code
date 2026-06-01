import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { criarAssinatura } from '@/api/assinaturas';
import { getErrorMessage } from '@/api/client';
import { listarPlanos } from '@/api/planos';
import { listarUsuarios } from '@/api/usuarios';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Loading,
  PageHeader,
  Screen,
  Select,
} from '@/components/ui';
import { toast } from '@/lib/toast';

export default function NovaAssinaturaScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    plano_id: '',
    inclui_barba: false,
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([listarUsuarios(), listarPlanos()])
      .then(([us, ps]) => {
        setClientes(us.filter((u) => u.perfil === 'cliente'));
        setPlanos(ps.filter((p) => p.ativo));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    if (!form.cliente_id) return setErro('Selecione um cliente.');
    if (!form.plano_id) return setErro('Selecione um plano.');
    setSalvando(true);
    setErro('');
    try {
      await criarAssinatura({
        cliente_id: form.cliente_id,
        plano_id: form.plano_id,
        inclui_barba: form.inclui_barba,
      });
      toast.success('Assinatura criada.');
      router.replace('/clube');
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
      <PageHeader title="Nova assinatura" />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <View className="gap-4">
          <Field label="Cliente" hint="Clientes são cadastrados pelo bot do WhatsApp.">
            <Select
              selectedValue={form.cliente_id}
              onValueChange={(v) => update('cliente_id', v)}
            >
              <Select.Item label="— selecione —" value="" />
              {clientes.map((c) => (
                <Select.Item key={c.id} label={`${c.nome} (${c.telefone ?? 'sem tel'})`} value={c.id} />
              ))}
            </Select>
          </Field>
          <Field label="Plano">
            <Select
              selectedValue={form.plano_id}
              onValueChange={(v) => update('plano_id', v)}
            >
              <Select.Item label="— selecione —" value="" />
              {planos.map((p) => (
                <Select.Item key={p.id} label={p.nome} value={p.id} />
              ))}
            </Select>
          </Field>
          <View className="flex-row items-center gap-3">
            <Switch
              value={form.inclui_barba}
              onValueChange={(v) => update('inclui_barba', v)}
            />
            <Text className="text-sm text-slate-700 dark:text-stone-200">
              Inclui barba (preço maior)
            </Text>
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
              onPress={() => router.replace('/clube')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
