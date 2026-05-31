import { api } from '@/api/client';

export const listarAssinaturas = () =>
  api.get('/assinaturas').then((r) => r.data);

export const criarAssinatura = (data) =>
  api.post('/assinaturas', data).then((r) => r.data);

export const removerAssinatura = (id) =>
  api.delete(`/assinaturas/${id}`);

export const gerarCobranca = (id) =>
  api.post(`/assinaturas/${id}/cobranca`).then((r) => r.data);

export const atualizarStatusAssinatura = (id, status) =>
  api.patch(`/assinaturas/${id}/status`, { status }).then((r) => r.data);
