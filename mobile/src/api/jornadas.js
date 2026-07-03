import { api } from '@/api/client';

// Jornada de trabalho do profissional. GET pode devolver 404 quando ainda não
// há jornada definida — o chamador trata como "sem blocos".
export const obterJornada = (profissionalId) =>
  api.get(`/profissionais/${profissionalId}/jornada`).then((r) => r.data);

export const definirJornada = (profissionalId, blocos) =>
  api
    .put(`/profissionais/${profissionalId}/jornada`, { blocos })
    .then((r) => r.data);
