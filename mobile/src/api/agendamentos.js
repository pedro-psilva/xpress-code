import { api } from '@/api/client';

export const listarAgendamentos = (params = {}) =>
  api.get('/agendamentos', { params }).then((r) => r.data);
export const buscarAgendamento = (id) =>
  api.get(`/agendamentos/${id}`).then((r) => r.data);
export const criarAgendamento = (data) =>
  api.post('/agendamentos', data).then((r) => r.data);
export const cancelarAgendamento = (id) => api.delete(`/agendamentos/${id}`);
export const concluirAgendamento = (id) =>
  api.post(`/agendamentos/${id}/concluir`).then((r) => r.data);
export const naoCompareceuAgendamento = (id) =>
  api.post(`/agendamentos/${id}/no-show`).then((r) => r.data);
