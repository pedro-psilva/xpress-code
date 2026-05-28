import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Screen,
} from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import { formatarPreco } from '@/lib/format';

const PLANOS = [
  {
    id: 'essencial',
    nome: 'Essencial',
    preco: 79.0,
    destaques: ['1 corte / mês', '1 barba / mês', '10% off em produtos'],
    cta: 'Quero o Essencial',
  },
  {
    id: 'flex',
    nome: 'Flex',
    preco: 129.0,
    recomendado: true,
    destaques: ['2 cortes / mês', '2 barbas / mês', '15% off em produtos'],
    cta: 'Quero o Flex',
  },
  {
    id: 'clube-one',
    nome: 'Clube One',
    preco: 199.0,
    destaques: ['Cortes ilimitados', 'Barba ilimitada', '20% off em produtos'],
    cta: 'Quero o Clube One',
  },
];

function PlanoCard({ plano }) {
  return (
    <Card
      className={`flex-1 p-6 ${plano.recomendado ? 'border-brand-400 dark:border-brand-400' : ''}`}
      style={{ minWidth: 240 }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-slate-800 dark:text-stone-100">{plano.nome}</Text>
        {plano.recomendado ? <Badge label="Mais escolhido" tone="brand" /> : null}
      </View>
      <View className="mb-4 flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold text-slate-800 dark:text-stone-100">
          {formatarPreco(plano.preco)}
        </Text>
        <Text className="text-sm text-slate-500 dark:text-stone-400">/mês</Text>
      </View>
      {plano.destaques.map((d) => (
        <View key={d} className="mb-2 flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={16} color="#15803d" />
          <Text className="text-sm text-slate-700 dark:text-stone-300">{d}</Text>
        </View>
      ))}
      <View className="mt-4">
        <Button title={plano.cta} disabled onPress={() => {}} />
      </View>
    </Card>
  );
}

export default function ClubeScreen() {
  const { isAdmin } = useAuth();
  const { tema } = useTheme();
  const corIcone = tema === 'dark' ? '#fcd34d' : '#b97e21';

  return (
    <Screen>
      <PageHeader
        title="Clube Xpress"
        subtitle="Planos mensais com cobrança automática."
      />

      <Card className="mb-6 flex-row items-start gap-3 border-brand-200 dark:border-stone-700 bg-brand-50 dark:bg-stone-800 p-4">
        <Ionicons name="information-circle" size={22} color={corIcone} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            Em breve: cobrança automática via InfinitePay
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
            Esta tela está em modo demonstração. A assinatura recorrente será habilitada
            quando as credenciais da InfinitePay forem configuradas no backend
            {isAdmin ? ' (variáveis INFINITEPAY_* no .env).' : '.'}
          </Text>
        </View>
      </Card>

      <View className="flex-row flex-wrap gap-4">
        {PLANOS.map((plano) => (
          <PlanoCard key={plano.id} plano={plano} />
        ))}
      </View>
    </Screen>
  );
}
