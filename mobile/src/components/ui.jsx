import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Children, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/theme/theme-context';

const VARIANTES = {
  primary: {
    box: 'bg-brand-400 active:bg-brand-500',
    label: 'text-stone-900',
    spinner: '#1c1917',
  },
  secondary: {
    box: 'bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 active:bg-slate-50 dark:active:bg-stone-800',
    label: 'text-slate-700 dark:text-stone-200',
    spinner: '#334155',
  },
  danger: {
    box: 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 active:bg-red-100',
    label: 'text-red-700 dark:text-red-300',
    spinner: '#b91c1c',
  },
};

const BADGE_TONS = {
  green: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  red: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
  brand: { bg: 'bg-brand-50 dark:bg-stone-800', text: 'text-brand-700 dark:text-brand-200' },
  slate: { bg: 'bg-slate-100 dark:bg-stone-800', text: 'text-slate-600 dark:text-stone-300' },
};

export function Screen({ children }) {
  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-stone-950"
      contentContainerStyle={{ padding: 16, alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-3xl">{children}</View>
    </ScrollView>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <View className="mb-6 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <View className="flex-1">
        <Text className="text-2xl font-semibold text-slate-800 dark:text-stone-100">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-slate-500 dark:text-stone-400">{subtitle}</Text>
        ) : null}
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
      className={`flex-row items-center justify-center gap-2 rounded-lg px-5 py-3 sm:px-4 sm:py-2.5 ${estilo.box} ${bloqueado ? 'opacity-50' : ''}`}
    >
      {loading ? <ActivityIndicator size="small" color={estilo.spinner} /> : null}
      <Text className={`text-base font-medium sm:text-sm ${estilo.label}`}>{title}</Text>
    </Pressable>
  );
}

const ICON_BUTTON_VARIANTES = {
  default: {
    box: 'bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 active:bg-slate-50 dark:active:bg-stone-800',
    cor: '#475569',
    corDark: '#a8a29e',
  },
  danger: {
    box: 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 active:bg-red-100',
    cor: '#b91c1c',
    corDark: '#fca5a5',
  },
  success: {
    box: 'bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-900 active:bg-green-100',
    cor: '#15803d',
    corDark: '#86efac',
  },
};

export function IconButton({ icon, onPress, variant = 'default', label, disabled = false }) {
  const { tema } = useTheme();
  const estilo = ICON_BUTTON_VARIANTES[variant] ?? ICON_BUTTON_VARIANTES.default;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`h-10 w-10 items-center justify-center rounded-lg ${estilo.box} ${disabled ? 'opacity-50' : ''}`}
    >
      <Ionicons name={icon} size={18} color={tema === 'dark' ? estilo.corDark : estilo.cor} />
    </Pressable>
  );
}

export function LinkButton({ href, title, variant = 'primary' }) {
  const estilo = VARIANTES[variant] ?? VARIANTES.primary;
  return (
    <Link href={href} asChild>
      <Pressable
        className={`flex-row items-center justify-center gap-2 rounded-lg px-5 py-3 sm:px-4 sm:py-2.5 ${estilo.box}`}
      >
        <Text className={`text-base font-medium sm:text-sm ${estilo.label}`}>{title}</Text>
      </Pressable>
    </Link>
  );
}

export function Card({ children, className = '', style }) {
  return (
    <View
      style={style}
      className={`rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 ${className}`}
    >
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <Card className="flex-1 p-5" style={{ minWidth: 150 }}>
      <Text className="text-sm font-medium text-slate-500 dark:text-stone-400">{label}</Text>
      <Text className="mt-2 text-3xl font-bold text-slate-800 dark:text-stone-100">
        {value}
      </Text>
      {hint ? (
        <Text className="mt-1 text-xs text-slate-400 dark:text-stone-500">{hint}</Text>
      ) : null}
    </Card>
  );
}

export function Badge({ label, tone = 'slate' }) {
  const t = BADGE_TONS[tone] ?? BADGE_TONS.slate;
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${t.bg}`}>
      <Text className={`text-xs font-medium ${t.text}`}>{label}</Text>
    </View>
  );
}

export function Loading({ label = 'Carregando…' }) {
  return (
    <View className="flex-row items-center justify-center gap-3 py-10">
      <ActivityIndicator size="small" color="#d4922a" />
      <Text className="text-slate-500 dark:text-stone-400">{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-4 py-3">
      <Text className="text-sm text-red-700 dark:text-red-300">{message}</Text>
    </View>
  );
}

export function EmptyState({ message }) {
  return (
    <View className="rounded-xl border border-dashed border-slate-300 dark:border-stone-700 py-12">
      <Text className="text-center text-slate-500 dark:text-stone-400">{message}</Text>
    </View>
  );
}

export function Field({ label, hint, children }) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-stone-300">
        {label}
      </Text>
      {children}
      {hint ? (
        <Text className="mt-1 text-xs text-slate-400 dark:text-stone-500">{hint}</Text>
      ) : null}
    </View>
  );
}

export function Input(props) {
  const { tema } = useTheme();
  return (
    <TextInput
      placeholderTextColor={tema === 'dark' ? '#78716c' : '#94a3b8'}
      className="w-full rounded-lg border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 sm:px-3 sm:py-2.5 text-base sm:text-sm text-slate-800 dark:text-stone-100 focus:border-brand-400"
      {...props}
    />
  );
}

export function Select({ selectedValue, onValueChange, children, placeholder = 'Selecione…' }) {
  const { tema } = useTheme();
  const [aberto, setAberto] = useState(false);

  const itens = Children.toArray(children)
    .filter((c) => c?.props && 'value' in c.props)
    .map((c) => ({ label: c.props.label, value: c.props.value }));
  const selecionado = itens.find((i) => i.value === selectedValue);
  const corChevron = tema === 'dark' ? '#a8a29e' : '#475569';

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        className="flex-row items-center justify-between rounded-lg border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3"
      >
        <Text
          className={`flex-1 text-base ${
            selecionado
              ? 'text-slate-800 dark:text-stone-100'
              : 'text-slate-400 dark:text-stone-500'
          }`}
        >
          {selecionado ? selecionado.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={corChevron} />
      </Pressable>
      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-4"
          onPress={() => setAberto(false)}
        >
          <Pressable onPress={() => {}} className="w-full max-w-sm">
            <Card className="overflow-hidden">
              <ScrollView style={{ maxHeight: 340 }}>
                {itens.map((it) => {
                  const ativo = it.value === selectedValue;
                  return (
                    <Pressable
                      key={String(it.value)}
                      onPress={() => {
                        onValueChange(it.value);
                        setAberto(false);
                      }}
                      className={`px-4 py-3 ${ativo ? 'bg-brand-50 dark:bg-stone-800' : ''}`}
                    >
                      <Text
                        className={`text-base ${
                          ativo
                            ? 'font-medium text-brand-700 dark:text-brand-200'
                            : 'text-slate-700 dark:text-stone-200'
                        }`}
                      >
                        {it.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

Select.Item = function SelectItem() {
  return null;
};

export function DateTimeInput({ value, onChange }) {
  const { tema } = useTheme();
  const [data, hora] = (value || '').split('T');

  if (Platform.OS === 'web') {
    const corScheme = tema === 'dark' ? 'dark' : 'light';
    const estiloInput = {
      colorScheme: corScheme,
      width: '100%',
      borderRadius: 8,
      borderWidth: 1,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 16,
      paddingRight: 16,
      fontSize: 16,
      borderColor: tema === 'dark' ? '#44403c' : '#cbd5e1',
      backgroundColor: tema === 'dark' ? '#1c1917' : '#ffffff',
      color: tema === 'dark' ? '#f5f5f4' : '#1e293b',
      fontFamily: 'inherit',
    };

    return (
      <View className="flex-col gap-3 sm:flex-row">
        <View className="flex-1">
          <Text className="mb-1 text-xs uppercase tracking-wide text-slate-500 dark:text-stone-400">
            Data
          </Text>
          <input
            type="date"
            value={data || ''}
            onChange={(e) => {
              const nova = e.target.value;
              if (!nova) return onChange('');
              onChange(`${nova}T${hora || '09:00'}`);
            }}
            style={estiloInput}
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-xs uppercase tracking-wide text-slate-500 dark:text-stone-400">
            Hora
          </Text>
          <input
            type="time"
            value={hora || ''}
            onChange={(e) => {
              const nova = e.target.value;
              if (!data) return onChange('');
              onChange(`${data}T${nova}`);
            }}
            style={estiloInput}
          />
        </View>
      </View>
    );
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="2026-05-27T14:30"
      placeholderTextColor={tema === 'dark' ? '#78716c' : '#94a3b8'}
      autoCapitalize="none"
      className="w-full rounded-lg border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-base text-slate-800 dark:text-stone-100"
    />
  );
}

export function Table({ columns, rows, keyExtractor, onRowPress }) {
  return (
    <>
      <View className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const cartao = (
            <Card className="p-4">
              {columns.map((coluna) => {
                const cabecalho = coluna.header || coluna.mobileLabel;
                return (
                  <View
                    key={coluna.key}
                    className="flex-row items-start justify-between gap-3 py-1.5"
                  >
                    {cabecalho ? (
                      <Text className="flex-1 text-xs font-medium uppercase text-slate-500 dark:text-stone-400">
                        {cabecalho}
                      </Text>
                    ) : null}
                    <View className={cabecalho ? 'max-w-[60%] items-end' : 'flex-1'}>
                      {coluna.render(row)}
                    </View>
                  </View>
                );
              })}
            </Card>
          );
          return onRowPress ? (
            <Pressable key={keyExtractor(row)} onPress={() => onRowPress(row)}>
              {cartao}
            </Pressable>
          ) : (
            <View key={keyExtractor(row)}>{cartao}</View>
          );
        })}
      </View>

      <View className="hidden sm:flex">
        <Card>
          <View className="flex-row border-b border-slate-200 dark:border-stone-800 py-3">
            {columns.map((coluna) => (
              <Text
                key={coluna.key}
                style={{ flex: coluna.flex ?? 1 }}
                className="px-3 text-xs font-medium uppercase text-slate-500 dark:text-stone-400"
              >
                {coluna.header}
              </Text>
            ))}
          </View>
          {rows.map((row, indice) => {
            const ultima = indice === rows.length - 1;
            const conteudo = (
              <View
                className={`flex-row items-center py-3 ${ultima ? '' : 'border-b border-slate-100 dark:border-stone-800'}`}
              >
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
      </View>
    </>
  );
}

export function Cell({ children, muted = false, strong = false }) {
  return (
    <Text
      className={`text-sm ${muted ? 'text-slate-500 dark:text-stone-400' : 'text-slate-700 dark:text-stone-300'} ${strong ? 'font-medium text-slate-800 dark:text-stone-100' : ''}`}
    >
      {children}
    </Text>
  );
}
