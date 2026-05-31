import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { statusIntegracao } from '@/api/whatsapp';
import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  Loading,
  PageHeader,
  Screen,
} from '@/components/ui';
import { useTheme } from '@/theme/theme-context';

function InfoBanner({ tema, children }) {
  const cor = tema === 'dark' ? '#fcd34d' : '#b97e21';
  return (
    <Card className="mb-6 flex-row items-start gap-3 border-brand-200 dark:border-stone-700 bg-brand-50 dark:bg-stone-800 p-4">
      <Ionicons name="information-circle" size={22} color={cor} />
      <View className="flex-1">{children}</View>
    </Card>
  );
}

function tomStatus(status) {
  if (!status?.configurado) return { tom: 'slate', label: 'não configurado' };
  if (status.valido) return { tom: 'green', label: 'ativo' };
  return { tom: 'red', label: 'token inválido' };
}

const WEBHOOK_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/whatsapp/webhook`;

export default function WhatsAppScreen() {
  const { isAdmin } = useAuth();
  const { tema } = useTheme();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    statusIntegracao()
      .then(setStatus)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  async function copiarWebhook() {
    if (Platform.OS === 'web' && navigator?.clipboard) {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  if (!isAdmin) {
    return (
      <Screen>
        <PageHeader title="WhatsApp" />
        <InfoBanner tema={tema}>
          <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            Acesso restrito
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
            Apenas administradores podem ver o status da integração. Você pode
            marcar pelo app normalmente.
          </Text>
        </InfoBanner>
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

  const { tom, label } = tomStatus(status);

  return (
    <Screen>
      <PageHeader
        title="WhatsApp"
        subtitle="Integração oficial com a WhatsApp Cloud API (Meta)."
        action={status ? <Badge label={label} tone={tom} /> : null}
      />
      <ErrorBanner message={erro} />

      {!status?.configurado ? (
        <InfoBanner tema={tema}>
          <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            Integração não configurada
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
            Defina{' '}
            <Text className="font-mono text-xs">META_PHONE_NUMBER_ID</Text>,{' '}
            <Text className="font-mono text-xs">META_ACCESS_TOKEN</Text>,{' '}
            <Text className="font-mono text-xs">META_APP_SECRET</Text> e{' '}
            <Text className="font-mono text-xs">META_WEBHOOK_VERIFY_TOKEN</Text>{' '}
            no .env do backend, depois reinicie o uvicorn.
          </Text>
        </InfoBanner>
      ) : null}

      {status?.configurado && !status?.valido ? (
        <InfoBanner tema={tema}>
          <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            Token recusado pela Meta
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
            A Graph API não autorizou as credenciais. Verifique se o{' '}
            <Text className="font-mono text-xs">META_ACCESS_TOKEN</Text> não
            expirou e se o <Text className="font-mono text-xs">PHONE_NUMBER_ID</Text>{' '}
            pertence a esse app.
          </Text>
        </InfoBanner>
      ) : null}

      {status?.valido ? (
        <Card className="mb-6 p-6">
          <Text className="text-sm font-medium text-slate-500 dark:text-stone-400">
            Número conectado
          </Text>
          <Text className="mt-1 text-lg font-medium text-slate-800 dark:text-stone-100">
            {status.numero ?? '—'}
          </Text>
          {status.nome_verificado ? (
            <Text className="text-sm text-slate-500 dark:text-stone-400">
              {status.nome_verificado}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card className="mb-6 p-6">
        <Text className="text-sm font-medium text-slate-500 dark:text-stone-400">
          URL do webhook
        </Text>
        <Text
          selectable
          className="mt-2 font-mono text-xs text-slate-700 dark:text-stone-200"
          style={Platform.OS === 'web' ? { wordBreak: 'break-all' } : undefined}
        >
          {WEBHOOK_URL}
        </Text>
        <Text className="mt-2 text-xs text-slate-500 dark:text-stone-400">
          Cole no painel da Meta em &quot;WhatsApp → Configuration → Webhook&quot;.
          Em dev, exponha o backend via ngrok antes de cadastrar.
        </Text>
        <View className="mt-3">
          <Button
            title={copiado ? 'Copiado!' : 'Copiar URL'}
            variant="secondary"
            onPress={copiarWebhook}
          />
        </View>
      </Card>

      <Card className="mb-6 p-6">
        <Text className="text-sm font-medium text-slate-500 dark:text-stone-400">
          Como funciona
        </Text>
        <Text className="mt-2 text-sm text-slate-700 dark:text-stone-200">
          Os clientes mandam mensagem para o número da barbearia e o bot guia o
          agendamento passo a passo (serviço → profissional → data → hora).
          Clientes novos são cadastrados automaticamente pelo telefone.
        </Text>
      </Card>
    </Screen>
  );
}
