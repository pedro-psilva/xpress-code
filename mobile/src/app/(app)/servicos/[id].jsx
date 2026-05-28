import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { buscarServico, desativarServico } from '@/api/servicos';
import { useAuth } from '@/auth/auth-context';
import {
  Button,
  Card,
  ErrorBanner,
  LinkButton,
  Loading,
  PageHeader,
  Screen,
} from '@/components/ui';
import { confirmar } from '@/lib/confirm';
import { formatarPreco } from '@/lib/format';

function Info({ label, value }) {
  return (
    <View className="flex-1" style={{ minWidth: 120 }}>
      <Text className="text-xs uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-1 text-lg font-medium text-slate-800">{value}</Text>
    </View>
  );
}

export default function ServicoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [servico, setServico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarServico(id)
      .then(setServico)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDesativar() {
    if (!(await confirmar('Desativar este serviço?'))) return;
    try {
      await desativarServico(id);
      router.replace('/servicos');
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!servico) {
    return (
      <Screen>
        <ErrorBanner message={erro || 'Serviço não encontrado.'} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title={servico.nome}
        action={
          isAdmin ? (
            <View className="flex-row gap-2">
              <LinkButton
                href={`/servicos/${id}/editar`}
                title="Editar"
                variant="secondary"
              />
              <Button title="Desativar" variant="danger" onPress={handleDesativar} />
            </View>
          ) : null
        }
      />
      <ErrorBanner message={erro} />
      <Card className="flex-row flex-wrap gap-4 p-6">
        <Info label="Preço" value={formatarPreco(servico.preco)} />
        <Info label="Duração" value={`${servico.duracao_minutos} min`} />
        <Info label="Status" value={servico.ativo ? 'Ativo' : 'Inativo'} />
      </Card>
      <Link href="/servicos" asChild>
        <Text className="mt-4 text-sm text-indigo-600">← Voltar para a lista</Text>
      </Link>
    </Screen>
  );
}
