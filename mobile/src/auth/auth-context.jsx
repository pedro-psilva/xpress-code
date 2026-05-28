// Estado global de autenticação. Diferente da web, o armazenamento é
// assíncrono (AsyncStorage), então expomos `loading` enquanto a sessão é
// carregada na inicialização — evita um "flash" da tela de login.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { userIdFromToken } from '@/lib/jwt';
import { clearSession, loadSession, saveSession } from '@/lib/session';

const AuthContext = createContext(null);

const SESSAO_VAZIA = { token: null, perfil: null, userId: null };

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(SESSAO_VAZIA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(({ token, perfil }) =>
        setSessao({ token, perfil, userId: userIdFromToken(token) }),
      )
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => {
    async function login(token, perfil) {
      await saveSession(token, perfil);
      setSessao({ token, perfil, userId: userIdFromToken(token) });
    }

    async function logout() {
      await clearSession();
      setSessao(SESSAO_VAZIA);
    }

    return {
      ...sessao,
      loading,
      isAuthenticated: Boolean(sessao.token),
      isAdmin: sessao.perfil === 'admin',
      login,
      logout,
    };
  }, [sessao, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return contexto;
}
