import { api } from '@/api/client';

export const listarPlanos = () => api.get('/planos').then((r) => r.data);
export const buscarPlano = (id) => api.get(`/planos/${id}`).then((r) => r.data);
export const criarPlano = (data) => api.post('/planos', data).then((r) => r.data);
export const atualizarPlano = (id, data) =>
  api.put(`/planos/${id}`, data).then((r) => r.data);
export const desativarPlano = (id) => api.delete(`/planos/${id}`);
