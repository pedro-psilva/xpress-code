import { api } from './client'

export const login = (email, senha) =>
  api.post('/auth/login', { email, senha }).then((r) => r.data)

export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data)
