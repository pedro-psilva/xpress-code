import { Link, usePathname } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { useBrandLogo, useTheme } from '@/theme/theme-context';

const LINKS = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/usuarios', label: 'Usuários' },
  { href: '/agendamentos', label: 'Agendamentos' },
];

function NavLink({ href, label, ativo }) {
  return (
    <Link href={href} asChild>
      <Pressable
        className={`rounded-lg px-3 py-2 ${ativo ? 'bg-brand-50 dark:bg-stone-800' : ''}`}
      >
        <Text
          className={`text-sm font-medium ${ativo ? 'text-brand-700 dark:text-brand-200' : 'text-slate-600 dark:text-stone-400'}`}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { perfil, logout } = useAuth();
  const { tema } = useTheme();
  const monograma = useBrandLogo('monograma');

  return (
    <SafeAreaView
      edges={['top']}
      className="border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900"
    >
      <View className="mx-auto w-full max-w-3xl flex-row flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Image source={monograma} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <Text
              className="text-lg font-bold"
              style={{ color: tema === 'dark' ? '#FFF6E5' : '#2B2622' }}
            >
              Xpress Code
            </Text>
          </Pressable>
        </Link>
        <View className="flex-row flex-wrap items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              ativo={pathname.startsWith(link.href)}
            />
          ))}
          <View className="ml-2 rounded-full bg-slate-100 dark:bg-stone-800 px-2 py-0.5">
            <Text className="text-xs font-medium text-slate-600 dark:text-stone-300">
              {perfil}
            </Text>
          </View>
          <Link href="/configuracoes" asChild>
            <Pressable className="rounded-lg px-3 py-2" accessibilityLabel="Configurações">
              <Text className="text-base text-slate-600 dark:text-stone-400">⚙</Text>
            </Pressable>
          </Link>
          <Pressable onPress={logout} className="rounded-lg px-3 py-2">
            <Text className="text-sm font-medium text-slate-600 dark:text-stone-400">Sair</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
