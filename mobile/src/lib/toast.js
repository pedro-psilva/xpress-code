let _mostrar = null;

export function registrarToast(fn) {
  _mostrar = fn;
}

export const toast = {
  success(mensagem) {
    if (_mostrar) _mostrar({ tipo: 'success', mensagem });
  },
  error(mensagem) {
    if (_mostrar) _mostrar({ tipo: 'error', mensagem });
  },
  info(mensagem) {
    if (_mostrar) _mostrar({ tipo: 'info', mensagem });
  },
};
