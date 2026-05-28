// Formatadores de data/hora. Implementados manualmente (sem Intl) porque o
// motor Hermes do React Native não garante as opções dateStyle/timeStyle.

function pad(numero) {
  return String(numero).padStart(2, '0');
}

export function ehHoje(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

export function formatarHora(iso) {
  const data = new Date(iso);
  return `${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export function formatarDataHora(iso) {
  const data = new Date(iso);
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ${formatarHora(iso)}`;
}

// Ordena agendamentos por horário de início (crescente).
export function porInicio(a, b) {
  return new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio);
}

export function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2)}`;
}
