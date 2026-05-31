import { api } from '@/api/client';

export const statusIntegracao = () =>
  api.get('/whatsapp/status').then((r) => r.data);
