# Guia para o Claude Code neste subprojeto

App universal Expo SDK 56 (RN 0.85, React 19.2). **SDK novo**; antes de
escrever código que use APIs do Expo/RN, verifique a doc versionada
em https://docs.expo.dev/versions/v56.0.0/.

## Decisões já tomadas (não revisitar sem motivo)

- Estilo: **NativeWind v5 + Tailwind v4** (validado: `npx expo export
  --platform web` compila e gera CSS). `metro.config.js` envolve o config com
  `withNativewind`; o `postcss.config.mjs` roda `@tailwindcss/postcss`; o
  `global.css` usa diretivas em camadas para compatibilidade com
  react-native-web.
- Rotas: **Expo Router** file-based em `src/app/`. `(app)` é grupo protegido
  por um `_layout.jsx` que faz `<Redirect href="/login" />` se não autenticado.
- Linguagem: **JavaScript (.jsx)** — não TypeScript, embora o `tsconfig.json`
  exista (o template é TS; arquivos .jsx convivem sem problema).
- Experimentos do Expo (`typedRoutes`, `reactCompiler`) estão **desligados** em
  `app.json` para evitar conflito com NativeWind/babel.
- `lightningcss` está **fixado em 1.30.1** via `overrides` no `package.json`
  (exigência da doc do NativeWind v5 para evitar erro de desserialização do
  global.css).

## Comandos úteis

```bash
npm run web                       # dev server (http://localhost:8081)
npx expo export --platform web    # build estático — útil como smoke test
npx expo lint                     # ESLint
```

## Pegadinhas

- O `nativewind-env.d.ts` é **gerado** pelo NativeWind a cada build; está em
  `.gitignore`.
- `Alert.alert` é mock no web — use `lib/confirm.js` para diálogo de confirmação
  multiplataforma.
- `Intl.DateTimeFormat` com `dateStyle`/`timeStyle` não é garantido em Hermes;
  formate datas manualmente (`lib/format.js`).
- A sessão é assíncrona (`AsyncStorage`); o `AuthProvider` expõe `loading` para
  a UI evitar redirecionar antes da hora.
