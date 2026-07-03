import { api } from '@/api/client';

// Resumo gerencial (faturamento + no-show) num período. `inicio`/`fim` são
// datas locais no formato YYYY-MM-DD. Rota restrita a admin no backend.
export const resumoRelatorio = ({ inicio, fim }) =>
  api.get('/relatorios/resumo', { params: { inicio, fim } }).then((r) => r.data);
