# Xpress Code — App (universal Expo)

App da Xpress Code construído como **base única em React Native + Expo**, com
três alvos:

- **Web** — SPA gerado pelo Expo (atende o requisito §5 da disciplina).
- **iOS** — via Safari por enquanto; build nativo iOS depende de Mac/EAS.
- **Android** — Expo Go ou build nativo via EAS.

Consome a API REST em Python (FastAPI) que vive na raiz do repositório.

## Stack

- Expo SDK 56 (React Native 0.85, React 19.2)
- Expo Router (rotas file-based em `src/app/`)
- NativeWind v5 + Tailwind v4 (estilo via `className`)
- axios + AsyncStorage (token JWT)

## Como rodar

```bash
cp .env.example .env             # ajuste EXPO_PUBLIC_API_URL se necessário
npm install
npm run web                      # http://localhost:8081 — alvo principal
npm run android                  # Expo Go ou emulador
npm run ios                      # exige macOS/Xcode
```

> Para abrir no celular físico, use o Expo Go com o QR code que aparece no
> terminal. Como o app precisa alcançar a API, **rode o backend em modo
> escutável na rede** (`uvicorn app.main:app --reload --host 0.0.0.0`) e ajuste
> no `.env` do app: `EXPO_PUBLIC_API_URL=http://<IP-DA-MÁQUINA>:8000/api/v1`.

## Organização

```
src/
  api/               # axios + chamadas (auth, servicos, usuarios, agendamentos)
  auth/              # contexto de autenticação (token + perfil + userId)
  lib/               # session (AsyncStorage), jwt, format, confirm
  components/        # ui primitivos, header, formulários, dashboards
  app/               # rotas Expo Router
    _layout.jsx      # raiz: AuthProvider + splash até carregar sessão
    login.jsx
    register.jsx
    (app)/           # grupo protegido (guarda + cabeçalho fixo)
      _layout.jsx
      index.jsx
      servicos/ usuarios/ agendamentos/
```

## Convenções

- Cada rota é "fina" — toda a regra fica em `components/`, `lib/` ou `api/`.
- Acesso a storage é assíncrono (AsyncStorage); o root layout espera a sessão
  antes de renderizar para evitar "flash" da tela de login.
- Nenhum `console.log` em código de produção. Erros do axios são traduzidos por
  `getErrorMessage` (mensagem padronizada do backend, timeout, falha de rede).
- Datas são formatadas manualmente em `lib/format.js` — não dependemos de Intl
  (o motor Hermes do RN não garante `dateStyle`/`timeStyle`).
- Ações destrutivas (remover usuário, cancelar agendamento, desativar serviço)
  pedem confirmação multiplataforma via `lib/confirm.js`.
