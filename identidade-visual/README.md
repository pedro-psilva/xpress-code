# Identidade Visual — Xpress Code

Kit de marca da **Xpress Code** (barbearia: barba, cabelo e bigode — *desde 2025*).
Fonte oficial dos ativos. O documento completo é o [`manual-de-marca.pdf`](./manual-de-marca.pdf).

> *"Na Xpress Code, cada corte é um código. Cada barba é uma afirmação.
> Aqui, você se expressa com estilo, na régua e com respeito."*

## Essência

- **Significado do nome:** *Xpress* vem de **expressar** — mostrar quem você é sem dizer
  uma palavra. *Code* representa um **padrão/estilo único**, definido por confiança,
  autocuidado e respeito por si mesmo.
- **Missão:** entregar mais que serviços de barbearia — estilo, confiança e uma
  experiência personalizada que transforma a imagem e a autoestima do cliente.
- **Visão:** ser referência em estilo masculino, com um "código visual" próprio.
- **Valores:** estilo com autenticidade · atendimento com respeito · técnica com
  criatividade · detalhe com precisão · visual com presença.

## Tom de voz

Confiança e atitude (sem arrogância) · masculinidade moderna · profissionalismo direto
com linguagem acessível · respeito ao estilo individual.

## Cores (manual da marca)

| Cor | HEX | Uso |
|-----|-----|-----|
| Preto | `#070507` | Fundo principal, texto sobre claro |
| Creme | `#FFF6E5` | Fundo claro, espaços de respiro |
| Bronze / marrom | `#9F7249` | Cor de apoio, detalhes |
| Cinza | `#595759` | Texto secundário, traços |
| Amarelo / ouro | `#FFD936` | Destaque, chamadas de ação |

> Nas artes da marca o dourado aparece em um tom mais quente/ocre (≈ `#E8A93C`);
> o grafite-marrom usado nas versões para fundo claro é `#2B2622`.

## Estrutura dos arquivos

```
identidade-visual/
├── manual-de-marca.pdf                         Manual completo da marca
├── logo/                                        Lettering completo (lockup)
│   ├── logo-completo-branco-transparente.png    Branco, fundo transparente — PRINCIPAL (fundos escuros)
│   ├── logo-branco-fundo-preto-sem-data.png     Branco sobre preto, sem "Desde 2025"
│   ├── logo-amarelo-fundo-preto.png             Ouro sobre preto
│   ├── logo-amarelo-fundo-marrom.png            Ouro sobre marrom
│   ├── logo-marrom-fundo-branco.png             Marrom sobre branco
│   └── logo-marrom-fundo-amarelo.png            Marrom sobre amarelo
├── simbolo/                                     Marca gráfica isolada
│   ├── monograma-x-branco.png                   Monograma "X", branco transparente
│   ├── bigode-escuro-fundo-branco.png           Bigode (ícone) escuro sobre branco
│   ├── bigode-escuro-fundo-amarelo.png          Bigode escuro sobre amarelo
│   └── bigode-branco-fundo-preto.png            Bigode branco sobre preto
└── aplicacoes/                                  Peças aplicadas
    ├── planos-assinatura.png                    Tabela de planos (Essencial / Flex / Clube One)
    └── banner-onde-o-visual-fala-mais-alto.png  Banner com slogan
```

## Versões otimizadas para a web

As variações usadas pela SPA ficam em [`frontend/public/brand/`](../frontend/public/brand/)
(redimensionadas para ≤900px e com fundo transparente):

| Arquivo | Sobre fundo | Origem |
|---------|-------------|--------|
| `logo-claro.png` | escuro | logo branco (principal) |
| `logo-escuro.png` | claro | recolorido para grafite `#2B2622` |
| `monograma-x-claro.png` | escuro | monograma branco |
| `monograma-x-escuro.png` | claro | monograma recolorido |

O **favicon** (`frontend/public/favicon.ico`, `favicon.png`, `apple-touch-icon.png`) usa o
monograma "X" branco sobre círculo escuro. A paleta da marca está aplicada na SPA via tokens
`@theme` (`--color-brand-*`) em [`frontend/src/index.css`](../frontend/src/index.css): botões
primários em ouro, links e estados ativos em bronze.

## Diretrizes rápidas

- Preserve uma margem de respiro ao redor do logo (não encoste em texto/bordas).
- Use a versão de logo com **contraste** adequado ao fundo (claro × escuro).
- Não distorça, não rotacione e não altere as cores da marca.
