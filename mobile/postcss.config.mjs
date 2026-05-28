// O Expo roda o PostCSS sobre o global.css; o plugin do Tailwind v4 gera as
// classes utilitárias que o NativeWind converte em estilos nativos.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
