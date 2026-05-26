import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

/** Extrai o id do usuário (campo `sub`) do payload do JWT, sem validar a
 *  assinatura — a validação real é responsabilidade do backend. */
function userIdFromToken(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).sub ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token')
    return {
      token,
      perfil: localStorage.getItem('perfil'),
      userId: userIdFromToken(token),
    }
  })

  function login(token, perfil) {
    localStorage.setItem('token', token)
    localStorage.setItem('perfil', perfil)
    setAuth({ token, perfil, userId: userIdFromToken(token) })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('perfil')
    setAuth({ token: null, perfil: null, userId: null })
  }

  const value = {
    token: auth.token,
    perfil: auth.perfil,
    userId: auth.userId,
    isAuthenticated: Boolean(auth.token),
    isAdmin: auth.perfil === 'admin',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
