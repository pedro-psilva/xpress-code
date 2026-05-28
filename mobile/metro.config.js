// Configuração do Metro (bundler). Envolvemos o config padrão do Expo com o
// NativeWind para que ele processe o global.css (Tailwind) e habilite o uso de
// `className` em componentes React Native. Ver nativewind.dev/v5.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
