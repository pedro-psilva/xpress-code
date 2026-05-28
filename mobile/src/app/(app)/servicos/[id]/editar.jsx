import { useLocalSearchParams } from 'expo-router';

import ServicoForm from '@/components/forms/servico-form';

export default function EditarServicoScreen() {
  const { id } = useLocalSearchParams();
  return <ServicoForm id={id} />;
}
