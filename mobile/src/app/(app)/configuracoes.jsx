import { Card, Field, PageHeader, Screen, Select } from '@/components/ui';
import { TEMA_AUTO, TEMA_CLARO, TEMA_ESCURO } from '@/lib/preferences';
import { useTheme } from '@/theme/theme-context';

export default function ConfiguracoesScreen() {
  const { preferencia, setPreferencia, tema } = useTheme();
  const ativo = tema === 'dark' ? 'escuro' : 'claro';

  return (
    <Screen>
      <PageHeader
        title="Configurações"
        subtitle="Ajustes do app neste dispositivo."
      />
      <Card className="p-6">
        <Field label="Tema" hint={`Ativo agora: ${ativo}`}>
          <Select selectedValue={preferencia} onValueChange={setPreferencia}>
            <Select.Item label="Automático (segue o sistema)" value={TEMA_AUTO} />
            <Select.Item label="Claro" value={TEMA_CLARO} />
            <Select.Item label="Escuro" value={TEMA_ESCURO} />
          </Select>
        </Field>
      </Card>
    </Screen>
  );
}
