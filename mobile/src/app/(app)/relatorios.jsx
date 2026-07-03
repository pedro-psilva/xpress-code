import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { resumoRelatorio } from '@/api/relatorios';
import { useAuth } from '@/auth/auth-context';
import {
  Button,
  Card,
  DateInput,
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  PageHeader,
  Screen,
  StatCard,
} from '@/components/ui';
import { formatarPreco } from '@/lib/format';

// Data local (YYYY-MM-DD) de `n` dias atrás — usada para o período padrão.
function isoDiasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatarPercentual(fracao) {
  return `${(Number(fracao) * 100).toFixed(1)}%`;
}

// Formata uma data "YYYY-MM-DD" sem passar por `new Date` (que interpreta a
// string como UTC e desloca o dia em fusos negativos, como o do Brasil).
function formatarDataIso(ymd) {
  const [ano, mes, dia] = String(ymd).split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function RelatoriosScreen() {
  const { isAdmin } = useAuth();
  const [inicio, setInicio] = useState(() => isoDiasAtras(30));
  const [fim, setFim] = useState(() => hojeIso());
  const [resumo, setResumo] = useState(null);
  // Começa carregando para admin: o período padrão é buscado no efeito abaixo.
  const [loading, setLoading] = useState(isAdmin);
  const [erro, setErro] = useState('');

  // Busca o resumo do período atual. Toda escrita de estado acontece nos
  // callbacks da promise (nunca de forma síncrona), para poder ser chamada
  // com segurança de dentro do efeito de montagem.
  const buscar = useCallback(
    () =>
      resumoRelatorio({ inicio, fim })
        .then((r) => {
          setResumo(r);
          setErro('');
        })
        .catch((e) => {
          setErro(getErrorMessage(e));
          setResumo(null);
        })
        .finally(() => setLoading(false)),
    [inicio, fim],
  );

  // Ação do botão (event handler → pode ligar o loading de forma síncrona).
  function gerar() {
    if (!inicio || !fim) {
      setErro('Informe as datas inicial e final.');
      return;
    }
    setLoading(true);
    buscar();
  }

  // Carrega o período padrão (últimos 30 dias) na abertura.
  useEffect(() => {
    if (isAdmin) buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Screen>
        <PageHeader title="Relatórios" />
        <EmptyState message="Relatórios são exclusivos de administradores." />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="Relatórios"
        subtitle="Faturamento e taxa de não comparecimento por período."
      />
      <ErrorBanner message={erro} />

      <Card className="mb-6 p-5">
        <View className="flex-col gap-4 sm:flex-row sm:items-end">
          <View className="flex-1">
            <Field label="De">
              <DateInput value={inicio} onChange={setInicio} />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Até">
              <DateInput value={fim} onChange={setFim} />
            </Field>
          </View>
          <View className="sm:pb-0.5">
            <Button title="Gerar" onPress={gerar} loading={loading} />
          </View>
        </View>
      </Card>

      {loading ? (
        <Loading label="Gerando relatório…" />
      ) : resumo ? (
        <View>
          <Text className="mb-3 text-sm text-slate-500 dark:text-stone-400">
            Período de {formatarDataIso(resumo.periodo.inicio)} a{' '}
            {formatarDataIso(resumo.periodo.fim)}
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <StatCard
              label="Faturamento"
              value={formatarPreco(resumo.faturamento)}
              hint="Soma dos atendimentos concluídos"
            />
            <StatCard
              label="Atendimentos concluídos"
              value={resumo.atendimentos_concluidos}
            />
            <StatCard
              label="Taxa de no-show"
              value={formatarPercentual(resumo.taxa_no_show)}
              hint="Faltas sobre concluídos + faltas"
            />
            <StatCard label="Não compareceram" value={resumo.no_shows} />
            <StatCard label="Cancelamentos" value={resumo.cancelamentos} />
          </View>
        </View>
      ) : (
        <EmptyState message="Escolha um período e toque em Gerar." />
      )}
    </Screen>
  );
}
