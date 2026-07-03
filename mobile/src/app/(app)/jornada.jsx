import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { definirJornada, obterJornada } from '@/api/jornadas';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  Loading,
  PageHeader,
  Screen,
  Select,
  TimeInput,
} from '@/components/ui';
import { toast } from '@/lib/toast';

const DIAS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function blocoPadrao() {
  return { dia_semana: 0, hora_inicio: '09:00', hora_fim: '18:00' };
}

export default function JornadaScreen() {
  const { isAdmin } = useAuth();
  const [profissionais, setProfissionais] = useState([]);
  const [profissionalId, setProfissionalId] = useState('');
  const [blocos, setBlocos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carregandoJornada, setCarregandoJornada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarUsuarios()
      .then((us) => setProfissionais(us.filter((u) => u.perfil === 'profissional')))
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  function selecionarProfissional(id) {
    setProfissionalId(id);
    setErro('');
    setBlocos([]);
    if (!id) return;
    setCarregandoJornada(true);
    obterJornada(id)
      .then((j) => setBlocos(j.blocos ?? []))
      .catch((e) => {
        if (e?.response?.status === 404) setBlocos([]);
        else setErro(getErrorMessage(e));
      })
      .finally(() => setCarregandoJornada(false));
  }

  function atualizarBloco(indice, campo, valor) {
    setBlocos((atual) =>
      atual.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)),
    );
  }

  function adicionarBloco() {
    setBlocos((atual) => [...atual, blocoPadrao()]);
  }

  function removerBloco(indice) {
    setBlocos((atual) => atual.filter((_, i) => i !== indice));
  }

  async function salvar() {
    for (const b of blocos) {
      if (!HHMM.test(b.hora_inicio) || !HHMM.test(b.hora_fim)) {
        return setErro('Horários devem estar no formato HH:MM.');
      }
      if (b.hora_fim <= b.hora_inicio) {
        return setErro('Em cada bloco, a hora final deve ser maior que a inicial.');
      }
    }
    setSalvando(true);
    setErro('');
    try {
      await definirJornada(profissionalId, blocos);
      toast.success('Jornada salva.');
    } catch (e) {
      setErro(getErrorMessage(e));
    } finally {
      setSalvando(false);
    }
  }

  if (!isAdmin) {
    return (
      <Screen>
        <PageHeader title="Jornada de trabalho" />
        <EmptyState message="A jornada é configurada por administradores." />
      </Screen>
    );
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
      <PageHeader
        title="Jornada de trabalho"
        subtitle="Defina os blocos de atendimento de cada profissional por dia da semana."
      />
      <ErrorBanner message={erro} />

      <Card className="mb-6 p-5">
        <Field label="Profissional">
          <Select
            selectedValue={profissionalId}
            onValueChange={selecionarProfissional}
          >
            <Select.Item label="Selecione…" value="" />
            {profissionais.map((p) => (
              <Select.Item key={p.id} label={p.nome} value={p.id} />
            ))}
          </Select>
        </Field>
      </Card>

      {!profissionalId ? (
        <EmptyState message="Escolha um profissional para editar a jornada." />
      ) : carregandoJornada ? (
        <Loading label="Carregando jornada…" />
      ) : (
        <View>
          {blocos.length === 0 ? (
            <EmptyState message="Nenhum bloco. Adicione horários de atendimento." />
          ) : (
            <View className="gap-3">
              {blocos.map((bloco, indice) => (
                <Card key={indice} className="p-4">
                  <View className="flex-col gap-3 sm:flex-row sm:items-end">
                    <View className="flex-1">
                      <Field label="Dia">
                        <Select
                          selectedValue={bloco.dia_semana}
                          onValueChange={(v) => atualizarBloco(indice, 'dia_semana', v)}
                        >
                          {DIAS.map((nome, i) => (
                            <Select.Item key={i} label={nome} value={i} />
                          ))}
                        </Select>
                      </Field>
                    </View>
                    <View className="flex-1">
                      <Field label="Início">
                        <TimeInput
                          value={bloco.hora_inicio}
                          onChange={(v) => atualizarBloco(indice, 'hora_inicio', v)}
                        />
                      </Field>
                    </View>
                    <View className="flex-1">
                      <Field label="Fim">
                        <TimeInput
                          value={bloco.hora_fim}
                          onChange={(v) => atualizarBloco(indice, 'hora_fim', v)}
                        />
                      </Field>
                    </View>
                    <View className="sm:pb-0.5">
                      <IconButton
                        icon="trash-outline"
                        variant="danger"
                        label="Remover bloco"
                        onPress={() => removerBloco(indice)}
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button title="+ Adicionar bloco" variant="secondary" onPress={adicionarBloco} />
            <Button
              title={salvando ? 'Salvando…' : 'Salvar jornada'}
              onPress={salvar}
              loading={salvando}
            />
          </View>
          <Text className="mt-3 text-xs text-slate-400 dark:text-stone-500">
            Salvar sem nenhum bloco libera a agenda do profissional (sem restrição
            de jornada).
          </Text>
        </View>
      )}
    </Screen>
  );
}
