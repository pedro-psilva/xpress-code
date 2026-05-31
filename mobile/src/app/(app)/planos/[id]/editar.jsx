import { useLocalSearchParams } from 'expo-router';

import PlanoForm from '@/components/forms/plano-form';

export default function EditarPlanoScreen() {
  const { id } = useLocalSearchParams();
  return <PlanoForm id={id} />;
}
