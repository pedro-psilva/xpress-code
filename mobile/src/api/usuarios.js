import { api } from '@/api/client';

export const listarUsuarios = () => api.get('/usuarios').then((r) => r.data);
export const buscarUsuario = (id) => api.get(`/usuarios/${id}`).then((r) => r.data);
export const criarUsuario = (data) => api.post('/usuarios', data).then((r) => r.data);
export const atualizarUsuario = (id, data) =>
  api.put(`/usuarios/${id}`, data).then((r) => r.data);
export const removerUsuario = (id) => api.delete(`/usuarios/${id}`);
