import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import {
  loadTemaPreferencia,
  saveTemaPreferencia,
  TEMA_AUTO,
} from '@/lib/preferences';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferenciaState] = useState(TEMA_AUTO);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    loadTemaPreferencia()
      .then(setPreferenciaState)
      .finally(() => setPronto(true));
  }, []);

  const value = useMemo(() => {
    async function setPreferencia(valor) {
      setPreferenciaState(valor);
      await saveTemaPreferencia(valor);
    }

    const tema =
      preferencia === TEMA_AUTO ? (sistema === 'dark' ? 'dark' : 'light') : preferencia;

    return { tema, preferencia, setPreferencia, pronto };
  }, [preferencia, sistema, pronto]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  }
  return contexto;
}

export function useBrandLogo(tipo = 'logo') {
  const { tema } = useTheme();
  if (tipo === 'monograma') {
    return tema === 'dark'
      ? require('@/assets/brand/monograma-x-claro.png')
      : require('@/assets/brand/monograma-x-escuro.png');
  }
  return tema === 'dark'
    ? require('@/assets/brand/logo-claro.png')
    : require('@/assets/brand/logo-escuro.png');
}
