# 003-05 — Validar responsividade e acessibilidade

- **Ticker:** `003`
- **Número:** `05`
- **Status:** `completed`

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

## Registro da implementação

### Status

`completed`

### Arquivos alterados

- `src/app/(marketing)/page.tsx`: ajustes responsivos, semântica de headings,
  foco do CTA no hero, alvos interativos e dimensões responsivas dos assets.
- `docs/tasks/003-public-landing-app-separation/003-05-validar-responsividade-acessibilidade.md`:
  registro desta validação.
- `docs/tasks/003-public-landing-app-separation/003-00-overview.md`: checklist e
  progresso atualizados.

### Decisões e desvios

- A correção ficou restrita à landing. Não houve alteração global em
  `globals.css`, `Button`, `Card`, `/login` ou `/dashboard`.
- O header permite quebra controlada em largura extrema/zoom 200%; links e logo
  usam alvos de pelo menos 44px. O CTA do header usa a variante `lg`.
- O painel do hero usa `h2` explícito; as linhas de apoio empilham em mobile e
  recebem `min-w-0` para evitar clipping. O H1 usa quebra segura em palavras
  longas.
- O foco do CTA sobre o hero recebe indicador claro sem remover o foco global.
  O footer usa logo horizontal com 180px em desktop e compacta com 140px em
  mobile; o mark decorativo preserva 32px efetivos e `alt=""`.
- Não foi possível executar Chrome/Chromium real neste ambiente. A limitação
  impede prova visual direta de teclado, zoom, contraste renderizado e scroll;
  inspeção estrutural, cálculo de contraste e revisão independente foram usados
  como evidência equivalente disponível.

### Comandos executados

```bash
git diff --check
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também foi executado smoke HTTP com `npm start -- --hostname 127.0.0.1
--port 3125` e `curl` com parser estrutural da landing, além de cálculo pontual
de contraste WCAG sobre os tokens e revisão independente da implementação.

### Resultados e evidências

- `git diff --check`, lint, geração de tipos, typecheck e build passaram nessa
  ordem. O build reconheceu `/`, `/login`, `/dashboard` e `ƒ Proxy (Middleware)`.
- Smoke local encontrou `header`, `main` e `footer`, um H1, headings em ordem
  (`h1`, `h2`, `h2`, `h3`...), três links para `/login`, cinco imagens com
  `alt`, mark decorativo com alt vazio e nenhum resíduo `next.svg`, `vercel.svg`
  ou copy do template.
- A inspeção de classes confirmou `flex-wrap`, alvos `min-h-11`, quebra segura
  do H1, dimensões oficiais 180/140px e mark efetivo de 32px. Não há gradiente,
  glow, glassmorphism, animação gratuita, dado financeiro ou claim dependente
  somente de cor.
- Cálculo de contraste sobre o hero registrou 16.37:1 para foreground pleno e
  7.50:1, 8.52:1 e 9.59:1 para textos em 65%, 70% e 75% de opacidade sobre
  Deep Navy; foreground/background e primary/primary-foreground atendem WCAG AA.
- Revisão independente final aprovou a subtarefa sem achados blocker, major ou
  minor.

### Riscos residuais

- A ausência de browser desktop/mobile impede declarar cobertura visual real de
  teclado, zoom 200%, alto contraste, contraste computado no navegador e scroll
  horizontal. Esses pontos ficam para confirmação quando browser estiver
  disponível.
- Não há test runner ou ferramenta automatizada de acessibilidade configurada;
  validação foi estrutural/manual dentro das ferramentas disponíveis.

## Atualização — CTAs do hero no mobile

### Status

`completed`

### Arquivos alterados

- `src/app/(marketing)/page.tsx`: CTAs do hero passaram a usar `flex-row`
  com `flex-wrap`, mantendo composição lado a lado quando houver espaço.
- `docs/tasks/003-public-landing-app-separation/003-05-validar-responsividade-acessibilidade.md`:
  registro deste refinamento.

### Decisões e desvios

- A ordem acessível permanece `Entrar` e depois `Conheça a proposta`.
- `flex-wrap` preserva comportamento seguro em viewport estreito e zoom, sem
  forçar overflow quando os dois links não couberem.
- Não houve alteração de copy, destinos, foco, targets, componentes base ou
  demais superfícies da aplicação.

### Comandos executados e resultados

```bash
git diff --check
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

- Todos os comandos passaram na ordem acima.
- Smoke HTTP local confirmou `flex-row flex-wrap items-center gap-3`, três
  links para `/login` e ausência de resíduos do template.
- Revisão independente aprovou o refinamento sem achados blocker, major ou
  minor.

### Riscos residuais

- Chrome/Chromium continua indisponível; prova visual real em zoom 200% e
  larguras extremas permanece limitada à inspeção estrutural e CSS.
