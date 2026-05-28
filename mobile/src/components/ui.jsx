// Primitivos de UI reutilizáveis (React Native + NativeWind). Centralizam o
// visual do app para que as telas fiquem enxutas e consistentes nas três
// plataformas (web, iOS, Android).
import { Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const VARIANTES = {
  primary: { box: 'bg-brand-400', label: 'text-stone-900', spinner: '#1c1917' },
  secondary: {
    box: 'bg-white border border-slate-300',
    label: 'text-slate-700',
    spinner: '#334155',
  },
  danger: {
    box: 'bg-red-50 border border-red-200',
    label: 'text-red-700',
    spinner: '#b91c1c',
  },
};

const BADGE_TONS = {
  green: { box: 'bg-green-50', label: 'text-green-700' },
  blue: { box: 'bg-blue-50', label: 'text-blue-700' },
  purple: { box: 'bg-purple-50', label: 'text-purple-700' },
  brand: { box: 'bg-brand-50', label: 'text-brand-700' },
  slate: { box: 'bg-slate-100', label: 'text-slate-600' },
};

/** Container de tela: rola o conteúdo e o centraliza com largura máxima no web. */
export function Screen({ children }) {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-3xl">{children}</View>
    </ScrollView>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <View className="mb-6 flex-row items-end justify-between gap-4">
      <View className="flex-1">
        <Text className="text-2xl font-semibold text-slate-800">{title}</Text>
        {subtitle ? <Text className="mt-1 text-slate-500">{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }) {
  const estilo = VARIANTES[variant] ?? VARIANTES.primary;
  const bloqueado = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      className={`flex-row items-center justify-center gap-2 rounded-lg px-4 py-2.5 ${estilo.box} ${bloqueado ? 'opacity-50' : ''}`}
    >
      {loading ? <ActivityIndicator size="small" color={estilo.spinner} /> : null}
      <Text className={`text-sm font-medium ${estilo.label}`}>{title}</Text>
    </Pressable>
  );
}

/** Botão que navega para uma rota (gera link real com URL no web). */
export function LinkButton({ href, title, variant = 'primary' }) {
  const estilo = VARIANTES[variant] ?? VARIANTES.primary;
  return (
    <Link href={href} asChild>
      <Pressable className={`flex-row items-center justify-center gap-2 rounded-lg px-4 py-2.5 ${estilo.box}`}>
        <Text className={`text-sm font-medium ${estilo.label}`}>{title}</Text>
      </Pressable>
    </Link>
  );
}

export function Card({ children, className = '', style }) {
  return (
    <View
      style={style}
      className={`rounded-xl border border-slate-200 bg-white ${className}`}
    >
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <Card className="flex-1 p-5" style={{ minWidth: 150 }}>
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="mt-2 text-3xl font-bold text-slate-800">{value}</Text>
      {hint ? <Text className="mt-1 text-xs text-slate-400">{hint}</Text> : null}
    </Card>
  );
}

export function Badge({ label, tone = 'slate' }) {
  const estilo = BADGE_TONS[tone] ?? BADGE_TONS.slate;
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${estilo.box}`}>
      <Text className={`text-xs font-medium ${estilo.label}`}>{label}</Text>
    </View>
  );
}

export function Loading({ label = 'Carregando…' }) {
  return (
    <View className="flex-row items-center justify-center gap-3 py-10">
      <ActivityIndicator size="small" color="#d4922a" />
      <Text className="text-slate-500">{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <Text className="text-sm text-red-700">{message}</Text>
    </View>
  );
}

export function EmptyState({ message }) {
  return (
    <View className="rounded-xl border border-dashed border-slate-300 py-12">
      <Text className="text-center text-slate-500">{message}</Text>
    </View>
  );
}

export function Field({ label, hint, children }) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      {children}
      {hint ? <Text className="mt-1 text-xs text-slate-400">{hint}</Text> : null}
    </View>
  );
}

export function Input(props) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-brand-400"
      {...props}
    />
  );
}

/** Seletor (dropdown) multiplataforma. Use com <Select.Item label value />. */
export function Select({ selectedValue, onValueChange, children }) {
  return (
    <View className="rounded-lg border border-slate-300 bg-white">
      <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
        {children}
      </Picker>
    </View>
  );
}
Select.Item = Picker.Item;

/**
 * Tabela simples baseada em colunas. `columns` é uma lista de
 * { key, header, flex?, render(row) }. Substitui a <table> do HTML por linhas
 * em <View>, funcionando igual nas três plataformas.
 */
export function Table({ columns, rows, keyExtractor, onRowPress }) {
  return (
    <Card>
      <View className="flex-row border-b border-slate-200 py-3">
        {columns.map((coluna) => (
          <Text
            key={coluna.key}
            style={{ flex: coluna.flex ?? 1 }}
            className="px-3 text-xs font-medium uppercase text-slate-500"
          >
            {coluna.header}
          </Text>
        ))}
      </View>
      {rows.map((row, indice) => {
        const ultima = indice === rows.length - 1;
        const conteudo = (
          <View className={`flex-row items-center py-3 ${ultima ? '' : 'border-b border-slate-100'}`}>
            {columns.map((coluna) => (
              <View key={coluna.key} style={{ flex: coluna.flex ?? 1 }} className="px-3">
                {coluna.render(row)}
              </View>
            ))}
          </View>
        );
        return onRowPress ? (
          <Pressable key={keyExtractor(row)} onPress={() => onRowPress(row)}>
            {conteudo}
          </Pressable>
        ) : (
          <View key={keyExtractor(row)}>{conteudo}</View>
        );
      })}
    </Card>
  );
}

/** Texto comum dentro de células de tabela. */
export function Cell({ children, muted = false, strong = false }) {
  return (
    <Text className={`text-sm ${muted ? 'text-slate-500' : 'text-slate-700'} ${strong ? 'font-medium text-slate-800' : ''}`}>
      {children}
    </Text>
  );
}
