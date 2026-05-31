import { api } from '@/api/client';

export const login = (email, senha) =>
  api.post('/auth/login', { email, senha }).then((r) => r.data);
