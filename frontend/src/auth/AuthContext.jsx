import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token'),
    perfil: localStorage.getItem('perfil'),
  }))

  function login(token, perfil) {
    localStorage.setItem('token', token)
    localStorage.setItem('perfil', perfil)
    setAuth({ token, perfil })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('perfil')
    setAuth({ token: null, perfil: null })
  }

  const value = {
    token: auth.token,
    perfil: auth.perfil,
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
