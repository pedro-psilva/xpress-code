import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMA_KEY = 'xpress.tema';

export const TEMA_AUTO = 'auto';
export const TEMA_CLARO = 'light';
export const TEMA_ESCURO = 'dark';

const VALIDOS = [TEMA_AUTO, TEMA_CLARO, TEMA_ESCURO];

export async function loadTemaPreferencia() {
  const valor = await AsyncStorage.getItem(TEMA_KEY);
  return VALIDOS.includes(valor) ? valor : TEMA_AUTO;
}

export async function saveTemaPreferencia(valor) {
  if (!VALIDOS.includes(valor)) return;
  await AsyncStorage.setItem(TEMA_KEY, valor);
}
