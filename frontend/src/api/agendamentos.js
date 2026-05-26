import { api } from './client'

export const listarAgendamentos = (params = {}) =>
  api.get('/agendamentos', { params }).then((r) => r.data)
export const buscarAgendamento = (id) =>
  api.get(`/agendamentos/${id}`).then((r) => r.data)
export const criarAgendamento = (data) =>
  api.post('/agendamentos', data).then((r) => r.data)
export const cancelarAgendamento = (id) => api.delete(`/agendamentos/${id}`)
