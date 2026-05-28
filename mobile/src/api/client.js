// Cliente HTTP central. A URL base vem de variável de ambiente
// (EXPO_PUBLIC_API_URL) com fallback para o backend local. Em dispositivo
// físico, aponte para o IP da máquina (ex.: http://192.168.0.10:8000/api/v1) e
// rode o backend com `uvicorn ... --host 0.0.0.0`.
import axios from 'axios';

import { getToken } from '@/lib/session';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({ baseURL, timeout: 15000 });

// Anexa o token JWT (quando houver) em toda requisição.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extrai a mensagem do erro padronizado do backend ({ status, detail }),
// tratando também falhas de rede e timeout.
export function getErrorMessage(error) {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Tempo de conexão esgotado. Verifique sua rede e tente novamente.';
  }
  if (error?.request && !error.response) {
    return 'Não foi possível conectar ao servidor.';
  }
  return error?.message ?? 'Ocorreu um erro inesperado.';
}
