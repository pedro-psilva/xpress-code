import { api } from '@/api/client';

export const resumoRelatorio = ({ inicio, fim }) =>
  api.get('/relatorios/resumo', { params: { inicio, fim } }).then((r) => r.data);
