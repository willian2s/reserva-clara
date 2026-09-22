# 003-02 — Estruturar landing V1

- **Ticker:** `003`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Substituir o template Create Next App por uma landing Server Component,
reconhecivelmente Reserva Clara, enxuta e suficiente para explicar o produto
sem inventar dados, prova social ou promessas de rentabilidade.

## Requisitos cobertos

- `/` sem resíduos do template.
- Posicionamento amplo sobre patrimônio e longo prazo.
- Header, hero, proposta de valor, explicação, CTA final e footer.
- Reuso de Inter, tokens, assets e componentes da fase 002.
- Ausência de Firebase/Firestore na superfície pública.

## Escopo incluído

- Composição de `src/app/(marketing)/page.tsx` e, se necessário, pequenos
  componentes locais em `src/components/marketing/` com responsabilidade real.
- Header com lockup oficial e entrada para a aplicação.
- Hero com H1 “Seu patrimônio, com clareza.”, texto de posicionamento e CTA.
- Três benefícios curtos: visão do todo, organização contínua e decisões
  conscientes, sem números ou estado financeiro.
- Explicação simples em organizar, acompanhar e decidir.
- CTA final e footer mínimos.
- Uso de `logo-horizontal.png`, `logo-compact.png` ou `logo-mark.png` conforme
  espaço, respeitando alt, proporção e regras de `docs/brand/brand.md`.

## Escopo excluído

- Host routing, redirects ou leitura de headers.
- Login, Firebase, Firestore, dashboard financeiro ou qualquer dado real/falso.
- Gráficos `docs/brand/patrimonio.png` e `docs/brand/consolidacao.png`.
- Depoimentos, métricas, pricing, planos, parceiros, certificações, prêmios,
  analytics e formulário de captura.
- Nova paleta, novo componente UI genérico ou dark mode.

## Dependências

- 003-01 concluída, com a rota de marketing disponível.
- `docs/brand/brand.md`, boards visuais e `docs/specs/002-*`.
- `src/app/globals.css`, `Button`, `Card` e assets existentes.

## Arquivos e símbolos prováveis

- `src/app/(marketing)/page.tsx`: página Server Component.
- `src/components/ui/button.tsx` e `card.tsx`: reuso sem alteração de contrato.
- `src/app/globals.css`: tokens/fontes existentes, sem hex em JSX.
- `public/brand/logo-horizontal.png`, `logo-compact.png`, `logo-mark.png`.
- `src/app/page.tsx`: resíduo a remover depois da migração.

## Passos de implementação

1. Remover a composição Create Next App e definir a hierarquia semântica
   `header`, `nav`, `main`, seções com H2 e `footer`.
2. Escrever copy em pt-BR que explique organização, acompanhamento e construção
   de patrimônio com visão de longo prazo, sem restringir o produto a uma única
   capacidade.
3. Compor hero e benefícios com bastante espaço, hierarquia forte, borders
   sutis e superfícies da foundation; não criar hero de SaaS genérico.
4. Reutilizar os assets oficiais sem recriar logo em texto/CSS, preservando
   proporções, clear space, dimensão mínima e alt adequado.
5. Usar `Button`/`Card` somente onde o elemento semântico e o contrato forem
   apropriados; CTA deve continuar sendo link real.
6. Confirmar que o módulo não importa Firebase, `GoogleSignIn`,
   `DashboardGate` ou APIs de browser.
7. Remover referências a `next.svg`, `vercel.svg`, links externos do template e
   classes `dark:*` da landing.

## Testes e comandos de validação

- `npm run lint`
- `npm exec next typegen`
- `npx tsc --noEmit`
- `npm run build`
- Inspeção de HTML para ausência de copy/links do template e presença de H1,
  tagline, logo oficial e CTA.
- Busca estrutural para confirmar que a landing não importa Firebase ou auth.

## Definição de pronto

- `/` renderiza somente a landing oficial planejada.
- A copy comunica patrimônio, clareza, organização e longo prazo.
- A página não contém números, gráficos, claims comerciais ou prova social
  inventados.
- Assets, Inter, tokens e fundamentos da fase 002 são reutilizados.
- A página é Server Component e funciona sem configuração Firebase.
- A task deixa ajustes finos de responsividade/acessibilidade para 003-05 e
  mantém CTA/navegação verificáveis em 003-03.

## Riscos e cuidados

- Não transformar os boards com gráficos em dados de produto.
- Não usar Emerald como sinônimo de lucro/sucesso; ele é acento de marca.
- Não adicionar seções apenas para aumentar altura da página.
- Não introduzir client island por animação, menu ou efeito sem requisito real.
- Não alterar `/login` ou `/dashboard` para acomodar a landing.

## Registro da implementação

### Status

`completed`

### Arquivos alterados

- `src/app/(marketing)/page.tsx`: substituição do template Create Next App por
  uma landing Server Component com header, hero, proposta de valor, explicação
  em organizar/acompanhar/decidir, CTA final e footer.

### Decisões e desvios

- A composição foi mantida em um único arquivo porque as seções não exigem
  responsabilidade compartilhada nem introduzem componente local reutilizável.
- Os CTAs usam `Link` real com `buttonVariants`, preservando semântica de link e
  o contrato same-origin para `/login`; `Card` foi reutilizado nas superfícies
  de proposta e apoio visual abstrato.
- O apoio visual usa apenas texto e o `logo-mark.png`; não foram usados gráficos,
  números, dados financeiros, prova social ou claims de rentabilidade.
- Metadata, ajustes finos de responsividade/acessibilidade e validação final de
  navegação permanecem nas subtarefas posteriores conforme o plano.

### Comandos executados

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também foram executadas inspeções estruturais com `git diff --check`, busca de
resíduos do template e de imports Firebase/auth na landing, além de smoke HTTP
local com `npm start -- --hostname 127.0.0.1 --port 3101` e parser HTML.

### Resultados e evidências

- Lint, geração de tipos, typecheck e build passaram nessa ordem.
- O build reconheceu `/`, `/login`, `/dashboard` e `ƒ Proxy (Middleware)`.
- A inspeção HTML encontrou a tagline, logo oficial, CTA `/login`, os movimentos
  de organizar/acompanhar/decidir e ausência de `next.svg`, `vercel.svg`, copy ou
  links do template.
- O parser HTML confirmou um único `h1`, headings em ordem e `alt` presente nas
  imagens renderizadas.
- A landing não importa Firebase, Firestore, `GoogleSignIn`, `DashboardGate` ou
  APIs de browser.

### Riscos residuais

- A validação visual detalhada em viewport, zoom, contraste e teclado pertence à
  subtarefa 003-05; a integração final de CTA/navegação pertence à 003-03.
- Metadata/canonical/OG e a política de indexação permanecem para a 003-04.
- O smoke foi local e não prova a configuração de DNS, domínio produtivo ou
  OAuth em produção.

## Atualização — refinamento visual

### Decisão

- A página recebeu uma direção editorial mais marcada, inspirada em referências
  de produtos financeiros com hero de alto contraste, tipografia mais expressiva,
  composição assimétrica e blocos de conteúdo mais abertos.
- A referência do Gorila foi usada somente como inspiração de ritmo e hierarquia;
  não foram copiados copy, assets, dados, estrutura proprietária ou destinos.
- O refinamento preserva a paleta, os assets, a tagline, o CTA same-origin, a
  ausência de dados financeiros e as restrições de não usar gradientes, glow ou
  estética de performance/trading.

### Evidências adicionais

- `src/app/(marketing)/page.tsx` continua sendo Server Component sem imports de
  Firebase, auth ou APIs de browser.
- O header usa `logo-compact.png` e o rótulo curto “Entrar” em viewport estreito,
  preservando o nome acessível completo e evitando overflow em telas pequenas.
- O link secundário do hero recebeu foco contrastante sobre a superfície Deep
  Navy, sem remover o indicador de teclado.
- O smoke HTML confirmou um único `h1`, landmarks/headings, imagens com `alt`,
  CTA `/login` e ausência dos resíduos do Create Next App. A composição
  agora renderiza as variantes horizontal e compacta do lockup, com apenas uma
  visível por breakpoint.
- `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit` e `npm run build`
  passaram novamente após o refinamento.

### Atualização — header fixo

- O header passou a usar `sticky top-0 z-50`, permanecendo disponível durante a
  rolagem sem retirar o elemento do fluxo nem sobrepor o início do conteúdo.
- O header mantém fundo opaco da foundation e borda inferior, sem introduzir
  glassmorphism, sombra ou dependência de JavaScript.
- Os gates técnicos e o smoke HTML foram executados novamente após a alteração;
  todos passaram.

### Atualização — CTA de entrada

- Os CTAs da landing agora usam o rótulo curto e consistente “Entrar”, incluindo
  o nome acessível do link do header.
- O link “Entrar” do header usa a variante `default` de `buttonVariants`, com a
  cor primária da foundation; os demais CTAs preservam suas variantes de
  contraste adequadas às respectivas superfícies.
- O link “Entrar” foi removido do footer para evitar repetição desnecessária;
  permanecem a entrada persistente no header e os CTAs contextuais do hero e da
  seção final.
- Lint, typegen, typecheck, build e smoke HTML passaram após a alteração.
