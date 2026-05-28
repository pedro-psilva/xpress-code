// Cabeçalho de navegação das telas autenticadas. Respeita a área segura (notch)
// e destaca o link da seção atual. Em telas estreitas os links quebram linha.
import { Link, usePathname } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';

const LINKS = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/usuarios', label: 'Usuários' },
  { href: '/agendamentos', label: 'Agendamentos' },
];

// Cor "grafite-marrom" do lettering da marca (manual da marca).
const COR_LETTERING = '#2B2622';

function NavLink({ href, label, ativo }) {
  return (
    <Link href={href} asChild>
      <Pressable className={`rounded-lg px-3 py-2 ${ativo ? 'bg-brand-50' : ''}`}>
        <Text
          className={`text-sm font-medium ${ativo ? 'text-brand-700' : 'text-slate-600'}`}
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

  return (
    <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white">
      <View className="mx-auto w-full max-w-3xl flex-row flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Image
              source={require('@/assets/brand/monograma-x-escuro.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text className="text-lg font-bold" style={{ color: COR_LETTERING }}>
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
          <View className="ml-2 rounded-full bg-slate-100 px-2 py-0.5">
            <Text className="text-xs font-medium text-slate-600">{perfil}</Text>
          </View>
          <Pressable onPress={logout} className="rounded-lg px-3 py-2">
            <Text className="text-sm font-medium text-slate-600">Sair</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
