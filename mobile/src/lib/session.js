// Persistência da sessão (token + perfil) no armazenamento do dispositivo.
// Usa AsyncStorage, que é universal: no web grava em localStorage, no mobile
// no armazenamento nativo. É a única camada que conhece as chaves de storage.
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'xpress.token';
const PERFIL_KEY = 'xpress.perfil';

export async function loadSession() {
  const [token, perfil] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(PERFIL_KEY),
  ]);
  return { token, perfil };
}

export async function saveSession(token, perfil) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [PERFIL_KEY, perfil],
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, PERFIL_KEY]);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
