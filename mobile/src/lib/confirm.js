// Confirmação sim/não multiplataforma. No web usa o diálogo do navegador; no
// mobile usa o Alert nativo. Sempre resolve para um booleano.
import { Alert, Platform } from 'react-native';

export function confirmar(mensagem) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(mensagem));
  }

  return new Promise((resolve) => {
    Alert.alert('Confirmar', mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
