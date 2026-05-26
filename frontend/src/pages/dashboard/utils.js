// Helpers de data compartilhados pelos painéis.

export function ehHoje(iso) {
  const d = new Date(iso)
  const hoje = new Date()
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  )
}

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

// Ordena agendamentos por horário de início (crescente).
export function porInicio(a, b) {
  return new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio)
}
