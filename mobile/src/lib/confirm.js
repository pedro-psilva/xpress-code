let _abrirModal = null;

export function registrarConfirmModal(fn) {
  _abrirModal = fn;
}

export function confirmar(mensagem, opcoes = {}) {
  if (_abrirModal) {
    return _abrirModal({
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
