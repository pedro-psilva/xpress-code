let _abrir = null;

export function registrarConfirmModal(fn) {
  _abrir = fn;
}

export function confirmar(mensagem, opcoes = {}) {
  if (_abrir) {
    return _abrir({
      tipo: 'confirmar',
      mensagem,
      titulo: opcoes.titulo ?? 'Confirmar',
      textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
      textoCancelar: opcoes.textoCancelar ?? 'Cancelar',
      variant: opcoes.variant ?? 'danger',
    });
  }
  if (typeof window !== 'undefined' && window.confirm) {
    return Promise.resolve(window.confirm(mensagem));
  }
  return Promise.resolve(false);
}

export function escolher({ titulo = 'Escolher', mensagem, opcoes }) {
  if (_abrir) {
    return _abrir({ tipo: 'escolher', titulo, mensagem, opcoes });
  }
  return Promise.resolve(null);
}
