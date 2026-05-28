import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { useBrandLogo, useTheme } from '@/theme/theme-context';

const LINKS = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/usuarios', label: 'Usuários' },
  { href: '/agendamentos', label: 'Agendamentos' },
  { href: '/clube', label: 'Clube' },
];

const SECUNDARIOS = [{ href: '/configuracoes', label: 'Configurações' }];

function NavLink({ href, label, ativo, onPress }) {
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={onPress}
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

function MenuItem({ href, label, ativo, onPress, danger = false, icone }) {
  const corTexto = danger
    ? 'text-red-700 dark:text-red-400'
    : ativo
      ? 'text-brand-700 dark:text-brand-200'
      : 'text-slate-800 dark:text-stone-100';
  const corIcone = danger ? '#b91c1c' : ativo ? '#7a5636' : '#475569';

  const conteudo = (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-lg px-3 py-3 ${ativo ? 'bg-brand-50 dark:bg-stone-800' : ''}`}
    >
      {icone ? <Ionicons name={icone} size={20} color={corIcone} /> : null}
      <Text className={`text-base font-medium ${corTexto}`}>{label}</Text>
    </Pressable>
  );

  return href ? (
    <Link href={href} asChild>
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}

function MobileMenu({ aberto, fechar, pathname, links, onLogout }) {
  return (
    <Modal
      visible={aberto}
      animationType="slide"
      transparent
      onRequestClose={fechar}
    >
      <View className="flex-1 justify-end">
        <Pressable className="flex-1 bg-black/40" onPress={fechar} />
        <View className="rounded-t-2xl bg-white dark:bg-stone-900 px-4 pb-8 pt-4">
          <View className="mb-3 h-1 w-12 self-center rounded-full bg-slate-200 dark:bg-stone-700" />
          {links.map((link) => (
            <MenuItem
              key={link.href}
              href={link.href}
              label={link.label}
              icone={link.icone}
              ativo={pathname.startsWith(link.href)}
              onPress={fechar}
            />
          ))}
          <View className="my-2 h-px bg-slate-100 dark:bg-stone-800" />
          {SECUNDARIOS.map((link) => (
            <MenuItem
              key={link.href}
              href={link.href}
              label={link.label}
              icone="settings-outline"
              ativo={pathname.startsWith(link.href)}
              onPress={fechar}
            />
          ))}
          <MenuItem
            label="Sair"
            icone="log-out-outline"
            danger
            onPress={() => {
              fechar();
              onLogout();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { tema } = useTheme();
  const monograma = useBrandLogo('monograma');
  const [menuAberto, setMenuAberto] = useState(false);

  function onLogout() {
    logout();
    router.replace('/login');
  }

  const corIcone = tema === 'dark' ? '#a8a29e' : '#475569';

  return (
    <SafeAreaView
      edges={['top']}
      className="border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900"
    >
      <View className="mx-auto w-full max-w-3xl flex-row items-center justify-between px-4 py-3">
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

        {/* Nav horizontal a partir de sm: */}
        <View className="hidden flex-row items-center gap-1 sm:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              ativo={pathname.startsWith(link.href)}
            />
          ))}
          <Link href="/configuracoes" asChild>
            <Pressable className="rounded-lg px-3 py-2" accessibilityLabel="Configurações">
              <Ionicons name="settings-outline" size={20} color={corIcone} />
            </Pressable>
          </Link>
          <Pressable
            onPress={onLogout}
            className="rounded-lg px-3 py-2"
            accessibilityLabel="Sair"
          >
            <Ionicons name="log-out-outline" size={20} color={corIcone} />
          </Pressable>
        </View>

        {/* Hambúrguer no mobile */}
        <Pressable
          onPress={() => setMenuAberto(true)}
          className="rounded-lg p-2 sm:hidden"
          accessibilityLabel="Abrir menu"
        >
          <Ionicons name="menu" size={28} color={corIcone} />
        </Pressable>
      </View>

      <MobileMenu
        aberto={menuAberto}
        fechar={() => setMenuAberto(false)}
        pathname={pathname}
        links={LINKS}
        onLogout={onLogout}
      />
    </SafeAreaView>
  );
}
