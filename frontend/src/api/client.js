import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({ baseURL })

// Anexa o token JWT (quando houver) em toda requisição.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Extrai a mensagem do erro padronizado do backend ({ status, detail }). */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    'Ocorreu um erro inesperado.'
  )
}
