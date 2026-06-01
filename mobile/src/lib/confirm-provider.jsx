import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';

import { registrarConfirmModal } from './confirm';

const ESTADO_INICIAL = {
  visivel: false,
  titulo: 'Confirmar',
  mensagem: '',
  textoConfirmar: 'Confirmar',
  textoCancelar: 'Cancelar',
  variant: 'danger',
};

export function ConfirmProvider({ children }) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const resolverRef = useRef(null);

  useEffect(() => {
    registrarConfirmModal((opts) => {
      setEstado({ ...ESTADO_INICIAL, ...opts, visivel: true });
      return new Promise((resolve) => {
        resolverRef.current = resolve;
      });
    });
    return () => registrarConfirmModal(null);
  }, []);

  function fechar(valor) {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setEstado((s) => ({ ...s, visivel: false }));
  }

  return (
    <>
      {children}
      <Modal
        visible={estado.visivel}
        transparent
        animationType="fade"
        onRequestClose={() => fechar(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-4"
          onPress={() => fechar(false)}
        >
          <Pressable onPress={() => {}} className="w-full max-w-sm">
            <Card className="p-6">
              <Text className="text-base font-semibold text-slate-800 dark:text-stone-100">
                {estado.titulo}
              </Text>
              <Text className="mt-2 text-sm text-slate-600 dark:text-stone-300">
                {estado.mensagem}
              </Text>
              <View className="mt-6 flex-row justify-end gap-2">
                <Button
                  title={estado.textoCancelar}
                  variant="secondary"
                  onPress={() => fechar(false)}
                />
                <Button
                  title={estado.textoConfirmar}
                  variant={estado.variant}
                  onPress={() => fechar(true)}
                />
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
