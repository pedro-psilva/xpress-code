import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { PageHeader, Screen } from '@/components/ui';
import { useBrandLogo } from '@/theme/theme-context';

const ATUALIZADO_EM = '6 de julho de 2026';

const SECOES = [
  {
    titulo: 'Quem somos',
    paragrafos: [
      'Esta Política de Privacidade descreve como o Xpress Code trata os dados pessoais de quem utiliza a plataforma de gestão para barbearias, disponível em xpresscode.com.br e no aplicativo Xpress Code.',
      'O controlador dos dados é 60.741.325 EDIMUNDO SOARES CARDOSO, inscrita no CNPJ 60.741.325/0001-57, com sede em R. Francisco Bicalho, 2352 — Caiçara-Adelaide, Belo Horizonte — MG, 30720-412 (“nós”, “Xpress Code”).',
    ],
  },
  {
    titulo: 'A quem esta política se aplica',
    paragrafos: [
      'O Xpress Code é uma ferramenta de uso interno da equipe da barbearia (administradores e profissionais). Os clientes finais da barbearia não possuem conta nem acessam o aplicativo — seus dados de contato são cadastrados pela própria barbearia apenas para viabilizar os agendamentos.',
    ],
  },
  {
    titulo: 'Dados que coletamos',
    paragrafos: ['Coletamos apenas os dados necessários para operar a agenda e a comunicação da barbearia:'],
    itens: [
      'Dados da equipe (usuários com conta): nome, e-mail, perfil de acesso e senha, armazenada de forma cifrada e nunca em texto puro.',
      'Dados dos clientes da barbearia: nome e telefone e, quando informado, e-mail — cadastrados pela equipe ou identificados automaticamente pelo número de WhatsApp.',
      'Dados de agendamento: serviço, profissional, data, horário, status e histórico de remarcações e cancelamentos.',
      'Comunicações: mensagens trocadas com o assistente de WhatsApp e confirmações e lembretes enviados por e-mail.',
      'Dados de assinatura e cobrança, quando aplicável.',
      'Dados técnicos: registros de acesso (logs de requisição, endereço IP, data e hora) para segurança e diagnóstico.',
    ],
  },
  {
    titulo: 'Como usamos os dados',
    itens: [
      'Gerenciar agendamentos, disponibilidade e jornada dos profissionais.',
      'Enviar confirmações, lembretes e notificações por aplicativo, e-mail e WhatsApp.',
      'Operar o assistente de atendimento por WhatsApp.',
      'Autenticar o acesso da equipe e proteger as contas contra uso indevido.',
      'Emitir relatórios gerenciais, como faturamento e taxa de comparecimento.',
      'Cumprir obrigações legais e prevenir fraudes e abusos.',
    ],
  },
  {
    titulo: 'Base legal',
    paragrafos: [
      'Tratamos dados pessoais com fundamento na Lei nº 13.709/2018 (LGPD), principalmente para: execução de contrato e procedimentos preliminares (art. 7º, V), cumprimento de obrigação legal (art. 7º, II), atendimento a interesses legítimos na operação e segurança do serviço (art. 7º, IX) e, quando aplicável, consentimento (art. 7º, I).',
    ],
  },
  {
    titulo: 'Compartilhamento com terceiros',
    paragrafos: [
      'Não vendemos dados pessoais. Compartilhamos dados apenas com prestadores que viabilizam o serviço, na medida do necessário:',
    ],
    itens: [
      'Meta Platforms (WhatsApp Cloud API) — envio e recebimento de mensagens.',
      'Brevo — envio de e-mails transacionais, como confirmações e lembretes.',
      'Google (Gemini) — processamento por inteligência artificial das mensagens do assistente de WhatsApp.',
      'Provedores de infraestrutura e banco de dados em nuvem, que armazenam os dados de forma segura.',
    ],
    rodape:
      'Esses provedores podem tratar dados fora do Brasil; nesses casos, adotamos salvaguardas compatíveis com a LGPD.',
  },
  {
    titulo: 'Cookies e armazenamento local',
    paragrafos: [
      'No aplicativo web utilizamos o armazenamento local do navegador apenas para o essencial: manter sua sessão autenticada e lembrar sua preferência de tema, claro ou escuro. Não usamos cookies de publicidade nem rastreadores de terceiros.',
    ],
  },
  {
    titulo: 'Por quanto tempo guardamos',
    paragrafos: [
      'Mantemos os dados pelo tempo necessário às finalidades descritas e às obrigações legais. Dados de agendamento e cobrança podem ser retidos para fins contábeis e de defesa em processos. Encerrada a necessidade, os dados são eliminados ou anonimizados.',
    ],
  },
  {
    titulo: 'Seus direitos',
    paragrafos: [
      'Nos termos do art. 18 da LGPD, você pode solicitar: confirmação da existência de tratamento; acesso aos dados; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamento; e revogação do consentimento.',
      'Clientes da barbearia podem exercer esses direitos diretamente com a barbearia responsável pelo cadastro ou entrando em contato conosco.',
    ],
  },
  {
    titulo: 'Segurança',
    paragrafos: [
      'Adotamos medidas técnicas e organizacionais para proteger os dados, como senhas cifradas, controle de acesso por perfil, comunicação criptografada (HTTPS), limitação de tentativas de login e cabeçalhos de segurança. Nenhum sistema é totalmente imune a incidentes; caso ocorra um incidente relevante, agiremos conforme a LGPD.',
    ],
  },
  {
    titulo: 'Dados de menores',
    paragrafos: [
      'O Xpress Code não é direcionado a menores de idade e não coleta intencionalmente seus dados sem o consentimento dos responsáveis.',
    ],
  },
  {
    titulo: 'Alterações desta política',
    paragrafos: [
      'Podemos atualizar esta Política periodicamente. A data da última atualização é indicada no topo desta página, e mudanças relevantes serão comunicadas pelos canais do serviço.',
    ],
  },
  {
    titulo: 'Encarregado e contato',
    paragrafos: [
      'Para dúvidas ou solicitações sobre seus dados, fale com nosso Encarregado de Proteção de Dados (DPO):',
    ],
    itens: ['E-mail: privacidade@xpresscode.com.br'],
  },
];

function Item({ children }) {
  return (
    <View className="mb-2 flex-row gap-2">
      <Text className="text-brand-500 dark:text-brand-400">•</Text>
      <Text className="flex-1 text-base leading-relaxed text-slate-600 dark:text-stone-300">
        {children}
      </Text>
    </View>
  );
}

function Secao({ titulo, paragrafos = [], itens = [], rodape }) {
  return (
    <View className="mb-8">
      <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
        {titulo}
      </Text>
      {paragrafos.map((texto) => (
        <Text
          key={texto}
          className="mb-3 text-base leading-relaxed text-slate-600 dark:text-stone-300"
        >
          {texto}
        </Text>
      ))}
      {itens.map((texto) => (
        <Item key={texto}>{texto}</Item>
      ))}
      {rodape ? (
        <Text className="mt-3 text-base leading-relaxed text-slate-600 dark:text-stone-300">
          {rodape}
        </Text>
      ) : null}
    </View>
  );
}

export default function PoliticaPrivacidadeScreen() {
  const logo = useBrandLogo('logo');
  return (
    <Screen>
      <Image
        source={logo}
        style={{ width: 200, height: 94, alignSelf: 'center', marginBottom: 16 }}
        resizeMode="contain"
      />
      <PageHeader title="Política de Privacidade" subtitle={`Última atualização: ${ATUALIZADO_EM}`} />
      {SECOES.map((secao) => (
        <Secao key={secao.titulo} {...secao} />
      ))}
      <Link href="/" className="text-base font-medium text-brand-600 dark:text-brand-400">
        ← Voltar ao início
      </Link>
    </Screen>
  );
}
