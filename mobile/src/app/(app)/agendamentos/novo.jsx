import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { criarAgendamento } from '@/api/agendamentos';
import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  Loading,
  PageHeader,
  Screen,
  Select,
} from '@/components/ui';

// Formato aceito para o início (data e hora local), validado antes do envio.
const FORMATO_DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export default function NovoAgendamentoScreen() {
  const router = useRouter();
  const { perfil, userId } = useAuth();
  const ehCliente = perfil === 'cliente';

  const [usuarios, setUsuarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({
    // O cliente marca sempre para si mesmo; o admin escolhe o cliente.
    cliente_id: ehCliente ? userId : '',
    profissional_id: '',
    servico_id: '',
    data_hora_inicio: '',
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([listarUsuarios(), listarServicos()])
      .then(([us, svs]) => {
        setUsuarios(us);
        setServicos(svs.filter((s) => s.ativo));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  function update(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit() {
    if (!form.cliente_id) return setErro('Selecione o cliente.');
    if (!form.profissional_id) return setErro('Selecione o profissional.');
    if (!form.servico_id) return setErro('Selecione o serviço.');
    if (!FORMATO_DATA_HORA.test(form.data_hora_inicio)) {
      return setErro('Informe o início no formato AAAA-MM-DDTHH:mm.');
    }

    setSalvando(true);
    setErro('');
    try {
      await criarAgendamento(form);
      router.replace('/agendamentos');
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

  const clientes = usuarios.filter((u) => u.perfil === 'cliente');
  const profissionais = usuarios.filter((u) => u.perfil === 'profissional');

  return (
    <Screen>
      <PageHeader title="Novo agendamento" />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <View className="gap-4">
          {ehCliente ? null : (
            <Field label="Cliente">
              <Select
                selectedValue={form.cliente_id}
                onValueChange={(v) => update('cliente_id', v)}
              >
                <Select.Item label="Selecione…" value="" />
                {clientes.map((u) => (
                  <Select.Item key={u.id} label={u.nome} value={u.id} />
                ))}
              </Select>
            </Field>
          )}
          <Field label="Profissional">
            <Select
              selectedValue={form.profissional_id}
              onValueChange={(v) => update('profissional_id', v)}
            >
              <Select.Item label="Selecione…" value="" />
              {profissionais.map((u) => (
                <Select.Item key={u.id} label={u.nome} value={u.id} />
              ))}
            </Select>
          </Field>
          <Field label="Serviço">
            <Select
              selectedValue={form.servico_id}
              onValueChange={(v) => update('servico_id', v)}
            >
              <Select.Item label="Selecione…" value="" />
              {servicos.map((s) => (
                <Select.Item
                  key={s.id}
                  label={`${s.nome} — ${s.duracao_minutos} min`}
                  value={s.id}
                />
              ))}
            </Select>
          </Field>
          <Field
            label="Início"
            hint="Formato AAAA-MM-DDTHH:mm. O término é calculado pela duração do serviço."
          >
            <Input
              value={form.data_hora_inicio}
              onChangeText={(v) => update('data_hora_inicio', v)}
              placeholder="2026-05-27T14:30"
              autoCapitalize="none"
            />
          </Field>
          <View className="flex-row gap-2 pt-2">
            <Button
              title={salvando ? 'Salvando…' : 'Agendar'}
              onPress={handleSubmit}
              loading={salvando}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => router.replace('/agendamentos')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
