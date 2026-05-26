import { api } from './client'

export const listarServicos = () => api.get('/servicos').then((r) => r.data)
export const buscarServico = (id) => api.get(`/servicos/${id}`).then((r) => r.data)
export const criarServico = (data) => api.post('/servicos', data).then((r) => r.data)
export const atualizarServico = (id, data) =>
  api.put(`/servicos/${id}`, data).then((r) => r.data)
export const desativarServico = (id) => api.delete(`/servicos/${id}`)
