// Fluxo do cliente: chamada para agendar, próximos horários marcados e o
// catálogo de serviços disponíveis.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { listarAgendamentos } from '@/api/agendamentos';
import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Card,
  EmptyState,
  ErrorBanner,
  LinkButton,
  Loading,
  PageHeader,
} from '@/components/ui';
import { formatarDataHora, formatarPreco, porInicio } from '@/lib/format';

export default function ClienteDashboard() {
  const { userId } = useAuth();
  const [proximos, setProximos] = useState([]);
  const [nomes, setNomes] = useState({});
  const [servicoNomes, setServicoNomes] = useState({});
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([
      listarAgendamentos({ cliente_id: userId }),
      listarUsuarios(),
      listarServicos(),
    ])
      .then(([ags, us, svs]) => {
        const agora = new Date();
        setProximos(
          ags
            .filter((a) => a.status !== 'cancelado' && new Date(a.data_hora_inicio) >= agora)
            .sort(porInicio),
        );
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])));
        setServicoNomes(Object.fromEntries(svs.map((s) => [s.id, s.nome])));
        setServicos(svs.filter((s) => s.ativo));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading />;

  return (
    <View>
      <PageHeader
        title="Agende seu horário"
        subtitle="Escolha um serviço e marque com o seu profissional."
        action={<LinkButton href="/agendamentos/novo" title="+ Agendar" />}
      />
      <ErrorBanner message={erro} />

      <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
        Meus próximos horários
      </Text>
      {proximos.length === 0 ? (
        <EmptyState message="Você não tem horários marcados. Que tal agendar um?" />
      ) : (
        <View className="mb-8 flex-row flex-wrap gap-3">
          {proximos.map((a) => (
            <Card key={a.id} className="flex-1 p-4" style={{ minWidth: 220 }}>
              <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
                {servicoNomes[a.servico_id] || 'Serviço'}
              </Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
                {formatarDataHora(a.data_hora_inicio)}
              </Text>
              <Text className="mt-1 text-xs text-slate-400 dark:text-stone-500">
                com {nomes[a.profissional_id] || 'profissional'}
              </Text>
            </Card>
          ))}
        </View>
      )}

      <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
        Serviços disponíveis
      </Text>
      {servicos.length === 0 ? (
        <EmptyState message="Nenhum serviço disponível no momento." />
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {servicos.map((s) => (
            <Card key={s.id} className="flex-1 p-4" style={{ minWidth: 180 }}>
              <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">{s.nome}</Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">{formatarPreco(s.preco)}</Text>
              <Text className="mt-1 text-xs text-slate-400 dark:text-stone-500">{s.duracao_minutos} min</Text>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}
