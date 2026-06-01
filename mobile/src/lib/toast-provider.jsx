import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-context';

import { registrarToast } from './toast';

const DURACAO_MS = 3000;

const TONS = {
  success: {
    icone: 'checkmark-circle',
    corIcone: '#16a34a',
    bgClaro: 'bg-green-50 border-green-200',
    bgEscuro: 'bg-green-950/70 border-green-900',
    textoClaro: 'text-green-800',
    textoEscuro: 'text-green-100',
  },
  error: {
    icone: 'alert-circle',
    corIcone: '#dc2626',
    bgClaro: 'bg-red-50 border-red-200',
    bgEscuro: 'bg-red-950/70 border-red-900',
    textoClaro: 'text-red-800',
    textoEscuro: 'text-red-100',
  },
  info: {
    icone: 'information-circle',
    corIcone: '#d4922a',
    bgClaro: 'bg-brand-50 border-brand-200',
    bgEscuro: 'bg-stone-800 border-stone-700',
    textoClaro: 'text-slate-800',
    textoEscuro: 'text-stone-100',
  },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const { tema } = useTheme();
  const escuro = tema === 'dark';

  useEffect(() => {
    registrarToast((dados) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(dados);
      timerRef.current = setTimeout(() => setToast(null), DURACAO_MS);
    });
    return () => {
      registrarToast(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {toast ? (
        <SafeAreaView
          edges={['top']}
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => setToast(null)}
            className={`mx-4 mt-3 flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
              escuro ? TONS[toast.tipo].bgEscuro : TONS[toast.tipo].bgClaro
            }`}
            style={{ maxWidth: 480 }}
          >
            <Ionicons
              name={TONS[toast.tipo].icone}
              size={22}
              color={TONS[toast.tipo].corIcone}
            />
            <View className="flex-1">
              <Text
                className={`text-sm font-medium ${
                  escuro ? TONS[toast.tipo].textoEscuro : TONS[toast.tipo].textoClaro
                }`}
              >
                {toast.mensagem}
              </Text>
            </View>
          </Pressable>
        </SafeAreaView>
      ) : null}
    </>
  );
}
