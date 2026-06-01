import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';

import { registrarConfirmModal } from './confirm';

const ESTADO_INICIAL = { visivel: false, tipo: 'confirmar' };

export function ConfirmProvider({ children }) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const resolverRef = useRef(null);
  const { tema } = useTheme();

  useEffect(() => {
    registrarConfirmModal((opts) => {
      setEstado({ ...opts, visivel: true });
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

  const escuro = tema === 'dark';
  const cardCls = escuro
    ? 'rounded-xl border border-stone-800 bg-stone-900 p-6'
    : 'rounded-xl border border-slate-200 bg-white p-6';
  const tituloCls = escuro
    ? 'text-base font-semibold text-stone-100'
    : 'text-base font-semibold text-slate-800';
  const msgCls = escuro
    ? 'mt-2 text-sm text-stone-300'
    : 'mt-2 text-sm text-slate-600';

  return (
    <>
      {children}
      <Modal
        visible={estado.visivel}
        transparent
        animationType="fade"
        onRequestClose={() => fechar(estado.tipo === 'confirmar' ? false : null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-4"
          onPress={() => fechar(estado.tipo === 'confirmar' ? false : null)}
        >
          <Pressable onPress={() => {}} className="w-full max-w-sm">
            <View className={cardCls}>
              <Text className={tituloCls}>{estado.titulo}</Text>
              {estado.mensagem ? (
                <Text className={msgCls}>{estado.mensagem}</Text>
              ) : null}

              {estado.tipo === 'escolher' ? (
                <ScrollView style={{ maxHeight: 300 }} className="mt-4">
                  <View className="gap-2">
                    {estado.opcoes?.map((op) => (
                      <Button
                        key={String(op.value)}
                        title={op.label}
                        variant={op.variant ?? 'secondary'}
                        onPress={() => fechar(op.value)}
                      />
                    ))}
                    <View className="mt-2">
                      <Button
                        title="Cancelar"
                        variant="secondary"
                        onPress={() => fechar(null)}
                      />
                    </View>
                  </View>
                </ScrollView>
              ) : (
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
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
