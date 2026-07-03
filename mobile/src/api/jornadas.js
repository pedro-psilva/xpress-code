import { api } from '@/api/client';

export const obterJornada = (profissionalId) =>
  api.get(`/profissionais/${profissionalId}/jornada`).then((r) => r.data);

export const definirJornada = (profissionalId, blocos) =>
  api
    .put(`/profissionais/${profissionalId}/jornada`, { blocos })
    .then((r) => r.data);
