# 003-05 — Validar responsividade e acessibilidade

- **Ticker:** `003`
- **Número:** `05`
- **Status:** `pending`

## Objetivo e resultado esperado

Garantir que a landing V1 seja mobile-first, confortável em desktop e coerente
com as regras de acessibilidade e identidade visual das foundations da fase 002,
sem introduzir estética de marketing incompatível ou informação dependente de
cor.

## Requisitos cobertos

- Responsividade em viewport estreito e desktop.
- Inter, tokens, spacing, radius, borders, foco e assets oficiais.
- Contraste WCAG AA, teclado, landmarks, headings, alt e nomes acessíveis.
- Ausência de overflow, animações gratuitas, gradiente, glow e dados fictícios.

## Escopo incluído

- Revisar classes e composição da landing após 003-02/003-03.
- Validar header, hero, benefícios, explicação, CTA e footer em mobile/desktop.
- Validar foco visível, ordem de tabulação, targets de toque, zoom e leitura.
- Validar logo/mark, alt, contraste, hierarquia e spacing contra `docs/brand/` e
  `docs/specs/002-*`.
- Corrigir somente problemas da landing dentro do escopo, devolvendo problemas
  de componente base para a foundation responsável.

## Escopo excluído

- Redesign de `/login` ou `/dashboard`.
- Novo design system, dark mode, nova paleta, animações ou componentes genéricos
  sem consumidor real.
- Testar dados financeiros, gráficos, Firestore ou cenários de autorização.
- Substituir a validação técnica das tasks 003-06/003-07.

## Dependências

- 003-02 e 003-03 implementadas.
- 003-04 disponível para conferir metadata e estrutura de headings.
- `docs/brand/brand.md`, boards oficiais e matriz de acessibilidade da fase 002.
- Browser desktop e, quando possível, browser mobile ou emulação confiável.

## Arquivos e símbolos prováveis

- `src/app/(marketing)/page.tsx` e componentes locais de marketing.
- `src/app/globals.css` e `src/components/ui/button.tsx`/`card.tsx` apenas para
  inspeção/reuso; evitar alteração global.
- `public/brand/logo-horizontal.png`, `logo-compact.png`, `logo-mark.png`.

## Passos de implementação

1. Conferir uma única sequência de H1/H2/H3, landmarks e nome acessível de nav.
2. Testar viewport `390x844` e desktop `1440x900`, zoom 200% e largura estreita;
   ajustar layout se houver clipping, texto ilegível ou overflow.
3. Testar teclado do início ao footer, foco perceptível e ativação de todos os
   links sem mouse.
4. Conferir contraste de texto, border, CTA e foco; não depender somente de
   Emerald/cor para distinguir estados.
5. Conferir alt do logo informativo, alt vazio para mark decorativo redundante e
   ausência de imagens com números ou dados.
6. Comparar densidade, espaço, sombras, radius e paleta com a foundation; não
   aplicar gradiente, glow, glassmorphism ou sombra exagerada.
7. Registrar desvios concretos e corrigir na camada responsável, sem ampliar a
   página ou inventar conteúdo para ocupar espaço.

## Testes e comandos de validação

- Chrome desktop e browsers disponíveis em viewport mobile.
- Navegação somente com teclado, zoom 200%, modo de alto contraste quando
  disponível e inspeção de leitor de tela/região.
- Verificação manual de contraste com ferramenta disponível.
- Inspeção de layout para ausência de scroll horizontal e targets adequados.
- `npm run lint` após eventuais ajustes de markup/classes.

## Definição de pronto

- Landing passa a matriz mobile/desktop/zoom sem overflow relevante.
- H1, headings, landmarks, links, alt, foco e contraste estão documentados e
  observáveis.
- Visual é Reserva Clara e consistente com a fase 002, sem estética proibida.
- Não há dados financeiros, claims ou informação comunicada apenas por cor.
- Limitações de browsers indisponíveis ficam registradas, sem declarar cobertura
  inexistente.

## Riscos e cuidados

- Screenshot bonita não substitui teclado, contraste ou semântica.
- Não usar `outline: none` nem remover foco para estética.
- Não reduzir logo abaixo dos limites documentados em `docs/brand/brand.md`.
- Não introduzir texto pequeno ou blocos densos para preservar uma composição
  desktop em mobile.
