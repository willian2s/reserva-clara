# 002 — Brand Integration & Design System Foundations

## Ticker

`002`

## Contexto

A fase 001 foi concluída com a vertical funcional `/login` → Google →
`/dashboard`, usando Firebase Web e guard client-side somente para UX. O
overview da fase anterior registra 4/4 subtarefas concluídas em
`docs/tasks/001-primeira-vertical-autenticacao/001-00-overview.md`.

Estado atual encontrado na `main`:

- Next.js `16.3.5`, React `19.2.8`, TypeScript strict, Tailwind CSS 4
  CSS-first, shadcn `base-nova`, Base UI e Lucide;
- `src/app/globals.css` já possui os nomes semânticos padrão do shadcn e bloco
  `.dark`, mas a raiz usa neutros genéricos e `--font-sans` está autorreferente;
- `src/app/layout.tsx` carrega Geist e Geist Mono, aplica `lang="pt-BR"` e
  expõe metadata básica da marca;
- `src/app/login/page.tsx` é Server Component, exibe marca em texto, tagline e
  `Card` com `GoogleSignIn`;
- `src/components/auth/google-sign-in.tsx` concentra listener, popup, estados,
  mensagens e navegação; a autenticação não deve ser redesenhada;
- `src/components/auth/dashboard-gate.tsx` protege somente a UX e mostra shell
  não sensível após confirmação Firebase;
- `Button`, `Card`, `Input` e `Label` já existem e usam tokens, mas ainda
  refletem a base neutra genérica do shadcn;
- nenhum arquivo de `public/brand/` é consumido pelas telas, e
  `src/app/favicon.ico` ainda é o favicon padrão;
- não há test runner nem formatter configurados; validação disponível é lint,
  typegen, typecheck, build e matriz manual;
- `/` continua o template inicial do Next.js, com `next.svg`, `vercel.svg`,
  classes `dark:*` e hex inline. A fase 002 não o transforma silenciosamente
  em landing page, mas registra esse resíduo para follow-up.

A documentação local do Next confirma `next/font/google` com variável CSS,
self-hosting em build e aplicação no root layout. A API de metadata permite
apontar `icons` para URLs públicas; o arquivo `src/app/favicon.ico` precisa ser
retirado para não competir com os assets oficiais.

## Objetivo

Transformar a identidade visual oficial de Reserva Clara em foundations leves,
reutilizáveis e verificáveis para a aplicação, usando `/login` e `/dashboard`
como primeiros consumidores reais. Ao fim da implementação futura, novas
features devem obter cores, tipografia, radius, bordas, sombras, foco e estados
básicos por contratos semânticos, sem reinventar esses fundamentos.

## Requisitos

### Identidade e marca

1. Preservar nome Reserva Clara, tagline “Seu patrimônio, com clareza.”, logos,
   símbolo, app icons, favicons, identidade e cinco cores oficiais.
2. Usar assets existentes de `public/brand/` diretamente; não recriar ou
   substituir símbolos da marca por texto, CSS ou ícones genéricos.
3. Tornar explícita a diferença entre brand colors e semantic colors. Emerald é
   identidade/acento, não sinônimo de lucro, sucesso ou performance positiva.

### Tipografia e tema

4. Integrar Inter como única família principal, com headings semibold/bold,
   body regular e interface medium/semibold.
5. Usar a abordagem compatível com Next.js 16 atual (`next/font/google` com
   variável CSS), sem request de fonte Google no browser em runtime.
6. Entregar somente light mode. Não criar toggle, provider, persistência,
   detecção de preferência ou redesign dark.

### Tokens e foundations

7. Manter aliases semânticos shadcn/base-nova em `globals.css`, cobrindo,
   quando aplicável, background, foreground, card, popover, primary, secondary,
   muted, accent, destructive, border, input e ring.
8. Manter os valores oficiais em tokens de marca separados e usar tokens
   semânticos nos componentes; nenhum componente fundamental novo deve conter
   hex arbitrário.
9. Definir escala tipográfica, uso de números, spacing baseado na escala Tailwind
   existente, radius consistente, borders sutis, sombras discretas e focus
   visible perceptível.
10. Definir somente `destructive` para erro de interface e `positive`/`negative`
    para significado financeiro inicial. `success` e `warning` aguardam
    consumidor real.

### Componentes, dados e telas

11. Ajustar apenas `Button`, `Card`, `Input` e `Label` nos estados relevantes:
    default, hover, active, focus-visible, disabled, loading quando o consumidor
    já o exigir e error quando aplicável.
12. Documentar princípios para patrimônio, moeda, percentuais, ganhos/perdas e
    alinhamento tabular sem implementar gráficos, dados ou domínio financeiro.
13. Fazer `/login` e `/dashboard` consumirem foundations e assets sem alterar o
    fluxo, o boundary Client ou a arquitetura de autenticação da fase 001.

### Acessibilidade e validação

14. Validar contraste, foco, teclado, disabled, erro, legibilidade, tamanho de
    alvo e comunicação que não dependa só de cor.
15. Executar lint, typegen, typecheck e build na ordem definida em `AGENTS.md`,
    além de smoke visual e matriz manual nos browsers disponíveis.

## Escopo

### Incluído

- troca de Geist por Inter no layout global;
- contrato de tokens de marca e tokens semânticos light em `globals.css`;
- foundations globais de tipografia, spacing, radius, borders, shadows e foco;
- catálogo normativo e uso inicial de logos, mark, app icons e favicons;
- metadata de favicon/app icon baseada nos assets oficiais;
- ajustes visuais nos quatro componentes UI já existentes;
- adaptação visual de `/login` e do shell não sensível de `/dashboard`;
- princípios de apresentação de dados financeiros, sem criar dados;
- validação de acessibilidade, regressão de auth, lint, typecheck, build e visual.

### Excluído

- qualquer alteração nesta execução fora de `docs/`;
- rebranding, alteração de nome, tagline, logo ou paleta oficial;
- dark mode, `next-themes`, ThemeProvider, toggle ou variantes de produto dark;
- redesign ou reimplementação do fluxo Firebase, popup, guard ou sessão;
- sessão server-side, Firebase Admin, middleware/proxy, autorização ou dados
  privados;
- Firestore, ativos, carteiras, transações, metas, aportes ou gráficos reais;
- novos componentes além dos quatro fundamentais já existentes;
- migração de dependências, package.json, lockfile ou criação de test runner;
- transformação da rota `/` em landing page Reserva Clara nesta fase;
- alteração, cópia ou recriação dos arquivos de `public/brand/`.

## Comportamento atual encontrado

### Tokens globais

`src/app/globals.css` importa Tailwind, `tw-animate-css` e
`shadcn/tailwind.css`; `@theme inline` mapeia os tokens semânticos para CSS
variables. A raiz usa OKLCH neutro genérico, `--radius: 0.625rem` e base aplica
`bg-background`, `text-foreground`, `border-border` e `outline-ring/50`.
Existe `.dark`, embora não haja mecanismo de ativação no layout.

`Button` usa `bg-primary`, `text-primary-foreground`, variants de outline,
secondary, ghost, destructive e link, além de ring em focus. `Card` usa
`bg-card`, `text-card-foreground`, radius XL e `ring-1 ring-foreground/10`.
`Input` usa border/input/ring e `aria-invalid`; `Label` usa `text-sm
font-medium` e estados derivados de disabled.

### Marca e telas

`/login` usa texto “Reserva Clara” em `font-heading`, tagline oficial, Card e
CTA Google. `/dashboard` mostra apenas “Dashboard” e “Autenticação confirmada.”
após `onAuthStateChanged`. Nenhum desses caminhos renderiza imagem da marca.

`public/brand/` contém:

- `logo-horizontal.png`: lockup horizontal colorido para superfícies claras;
- `logo-horizontal-dark.png`: lockup com wordmark claro para superfícies escuras;
- `logo-horizontal-off-white.png`: lockup para fundo off-white correspondente;
- `logo-compact.png`, `logo-compact-dark.png` e
  `logo-compact-off-white.png`: lockups compactos para largura reduzida;
- `logo-stacked.png`: composição vertical para áreas centradas;
- `logo-mark.png`: símbolo isolado;
- `logo-light.png`: lockup claro para superfícies escuras;
- `logo-monochrome.png`: fallback monocromático, não opção padrão da UI;
- `app-icon-light.png` e `app-icon-dark.png`: ícones de aplicativo; V1 usa a
  variante light;
- `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon-64.png`,
  `favicon-128.png` e `favicon-256.png`: favicons oficiais por tamanho.

Os boards em `docs/brand/` documentam versões visualmente, mas ainda não havia
regra textual de fundo, clear space ou tamanho mínimo. Esta spec cria essas
regras para a implementação futura.

### Fontes e Next.js

`layout.tsx` importa `Geist` e `Geist_Mono` de `next/font/google`, expõe
`--font-geist-sans`/`--font-geist-mono` e aplica as variáveis no `<html>`. A
documentação instalada recomenda `Inter({ subsets: ["latin"], display:
"swap", variable: "--font-inter" })` e mapeamento da variável no `@theme
inline`.

## Abordagem escolhida

1. **Fonte:** substituir Geist por Inter no root layout; mapear
   `--font-sans` e `--font-heading` para `var(--font-inter)`, corrigindo a
   autorreferência atual. Não adicionar fonte de display ou fonte numérica.
2. **Tokens:** declarar `--brand-*` na camada global e mapear tokens semânticos
   em `:root` para light mode. Preservar nomes usados pelos componentes
   shadcn/base-nova. Usar valores derivados apenas em tokens, nunca em JSX.
3. **Foundations:** reutilizar spacing e utilities já fornecidos pelo Tailwind;
   manter radius base próximo do atual; preferir `border-border` e sombras
   pequenas; unificar `focus-visible` com `ring` acessível.
4. **Assets:** renderizar arquivos estáticos por `/brand/...`, com dimensão
   conhecida e alt correto. Em superfícies claras, usar `logo-horizontal.png`
   como lockup padrão e `logo-compact.png`/`logo-mark.png` quando espaço exigir.
   Variantes dark/light/off-white só entram quando o fundo correspondente
   existir; não usar variante dark para simular dark mode.
5. **Favicon:** remover `src/app/favicon.ico` como fonte concorrente e declarar
   `metadata.icons` no Server Component do layout apontando para favicons e
   `app-icon-light.png` oficiais. Confirmar MIME, tamanhos e `<head>` gerado.
6. **Componentes:** ajustar classes dos quatro componentes existentes sem trocar
   base-nova, Base UI, `cn`, CVA ou contratos públicos. Loading continua
   responsabilidade do consumidor quando já existe, como `GoogleSignIn`.
7. **Telas:** trocar branding textual de `/login` por asset oficial, preservar
   tagline e textos de auth, e aplicar tokens ao shell de `/dashboard`. Não
   mover Firebase para páginas/layout nem introduzir conteúdo privado.
8. **Dados financeiros:** preparar semântica para futuras telas: label separada
   de valor, moeda em `pt-BR`/BRL quando aplicável, percentuais consistentes,
   `tabular-nums`, alinhamento final em tabelas e redundância textual/iconográfica
   para ganho, perda, erro e sucesso.

## Regras de uso dos assets

| Contexto | Asset preferencial | Regra |
| --- | --- | --- |
| Header ou branding em superfície clara | `/brand/logo-horizontal.png` | Usar lockup completo; não repetir nome em texto ao lado |
| Área estreita com wordmark | `/brand/logo-compact.png` | Usar somente quando horizontal não couber sem reduzir legibilidade |
| Área centrada e vertical | `/brand/logo-stacked.png` | Opcional; respeitar proporção e clear space |
| Avatar, marca de navegação ou espaço sem wordmark | `/brand/logo-mark.png` | Informar nome acessível quando não houver texto equivalente |
| Fundo Deep Navy ou escuro real | `/brand/logo-horizontal-dark.png` ou `/brand/logo-light.png` | Não usar na V1 light sem superfície que exija contraste claro |
| Fundo off-white correspondente | variante `*-off-white` | Só usar se fundo da imagem casar com superfície; preferir transparente quando possível |
| Monocromático, impressão ou fallback autorizado | `/brand/logo-monochrome.png` | Não substituir lockup colorido por conveniência |
| Favicon do navegador | `/brand/favicon-16.png` até `favicon-256.png` | Declarar via metadata; não manter favicon padrão concorrente |
| Ícone Apple/app | `/brand/app-icon-light.png` | V1 light; `app-icon-dark.png` fica reservado para contexto dark futuro |

Regras comuns: preservar proporção, não distorcer, não aplicar filtros, não
recolorir, não aplicar gradiente/glow e não usar logo em tamanho que torne texto
ilegível. Logo com função informativa recebe alt “Reserva Clara”; mark ao lado de
nome já visível recebe `alt=""`. A implementação deve confirmar dimensões reais
dos arquivos antes de preencher `width`/`height` de `next/image`. Para operação,
reservar clear-space mínimo de uma altura do mark renderizado em cada lado do
lockup ou mark e manter, como menor largura de uso, `180px` no horizontal,
`140px` no compact, `128px` no stacked e `32px` no mark. O mark usado como
controle deve continuar dentro de alvo interativo mínimo de `44px`; esses limites
evitam perda de legibilidade e não substituem a validação visual da tela.

## Arquivos, módulos e contratos afetados

### Alterações esperadas na implementação futura

- `src/app/layout.tsx`: Inter, variável CSS e metadata de icons;
- `src/app/globals.css`: brand tokens, semantic tokens light, aliases de fonte e
  foundations base;
- `src/app/favicon.ico`: remoção da fonte padrão concorrente;
- `src/components/ui/button.tsx`: variants, focus e estados alinhados;
- `src/components/ui/card.tsx`: superfície, border, radius e sombra discreta;
- `src/components/ui/input.tsx`: borda, focus, disabled e invalid semânticos;
- `src/components/ui/label.tsx`: peso, cor, disabled e coerência tipográfica;
- `src/app/login/page.tsx`: asset oficial e composição visual;
- `src/components/auth/google-sign-in.tsx`: somente classes/feedback visual se
  necessário; preservar lógica e estados;
- `src/components/auth/dashboard-gate.tsx`: shell visual somente;
- `src/app/dashboard/page.tsx`: apenas se composição visual exigir ajuste.

### Reutilização sem alteração esperada

- `src/lib/firebase/client.ts`;
- contratos de `GoogleSignIn`, `DashboardGate`, `router.replace` e
  `onAuthStateChanged`;
- `components.json`, `package.json`, `package-lock.json` e assets de
  `public/brand/`;
- `src/app/page.tsx`, que permanece follow-up explicitamente fora desta fase.

### Contratos técnicos

- `--brand-*` representa identidade; tokens semânticos representam papel;
- `font-sans` e `font-heading` resolvem para Inter sem carregar Geist Sans;
- classes shadcn existentes continuam encontrando `--background`, `--primary`,
  `--border`, `--ring` e demais aliases;
- URLs públicas de branding começam em `/brand/`, nunca `/public/brand/`;
- `layout.tsx`, `/login/page.tsx` e `/dashboard/page.tsx` continuam Server
  Components;
- Firebase continua limitado às ilhas Client existentes;
- nenhum dado financeiro, token Firebase ou segredo atravessa novo boundary;
- V1 não ativa `.dark`, não adiciona provider de tema e não depende de
  preferência do sistema.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Contraste insuficiente de Slate/Emerald | Testar combinações WCAG; usar token derivado para texto e reservar Emerald para acento/fundo apropriado |
| `--font-sans` continuar autorreferente | Validar fonte computada e CSS gerado; mapear para `--font-inter` explicitamente |
| Geist e Inter carregados juntos | Remover imports/variáveis Geist; inspecionar HTML/network no build local |
| Favicon antigo competir ou ficar em cache | Remover `src/app/favicon.ico`, validar `<head>` em janela limpa e registrar cache residual |
| Variante de logo inadequada ao fundo | Usar tabela de assets, validar contraste e não usar variantes dark como dark mode |
| Mudança visual quebrar estados auth | Rodar matriz da fase 001 e manter `GoogleSignIn`/`DashboardGate` contratos |
| Border ou focus pouco perceptível | Usar ring Deep Navy, `aria-invalid`, mensagens e redundância além da cor |
| Build sem acesso à fonte Google | Executar build cedo; se bloqueado, registrar decisão sobre `next/font/local` e não criar fallback ad hoc |
| `/` continuar não-branded | Manter exclusão explícita e abrir follow-up; não declarar que rota template foi migrada |
| Expansão prematura do design system | Alterar somente Button/Card/Input/Label e foundations consumidas por telas reais |

## Estratégia de testes e validação

Não há test runner configurado. A prova futura será:

1. executar `npm run lint`;
2. executar `npm exec next typegen`;
3. executar `npx tsc --noEmit`;
4. executar `npm run build`;
5. inspecionar CSS/HTML gerado para fonte Inter, aliases semânticos, URLs
   `/brand/`, ausência de favicon concorrente e ausência de `use client` novo em
   layout/páginas;
6. validar `/login` e `/dashboard` em viewport mobile e desktop, com estados
   de auth existentes, sem dados privados;
7. validar teclado, foco, leitor de tela, disabled, mensagens de erro,
   `aria-invalid`, regiões live e contraste;
8. executar matriz visual em browsers disponíveis, incluindo janela limpa para
   favicon e carregamento sem fonte externa runtime.

### Matriz mínima de acessibilidade

- texto normal e captions: contraste mínimo WCAG AA de 4.5:1;
- texto grande: mínimo de 3:1;
- bordas/indicadores/foco que comunicam estado: validar 3:1 contra entorno;
- foco visível em Button, Input e qualquer link/controle navegável;
- disabled perceptível por mais que opacidade, sem receber foco ou clique;
- erro comunicado por `aria-invalid`, descrição/alerta e texto, não apenas cor;
- ganhos/perdas acompanhados de sinal, label, ícone ou texto, não só verde/vermelho;
- números financeiros em `tabular-nums`, com legibilidade em viewport estreito;
- logo informativo com alt e logo redundante com alt vazio.

## Critérios de aceite

1. `/login` e `/dashboard` reconhecem Reserva Clara por assets oficiais, tagline
   preservada e composição visual coerente; nenhum logo é recriado.
2. Paleta oficial continua disponível sem alteração de valores e é aplicada por
   tokens; componentes não espalham hex arbitrário.
3. Inter é a família principal, `font-sans`/`font-heading` resolvem para ela e
   Geist Sans não é carregada em paralelo.
4. V1 funciona em light mode, sem toggle/provider/ativação dark.
5. Tokens semânticos cobrem os papéis shadcn relevantes; brand colors não são
   confundidas com `positive`, `negative` ou `destructive`.
6. Button, Card, Input e Label compartilham radius, border, tipografia, focus e
   disabled coerentes; hover, active, invalid, loading e error respeitam seus
   consumidores reais.
7. Foco é perceptível, contraste atende matriz prevista e feedback não depende
   exclusivamente de cor.
8. Dados financeiros futuros têm base documentada para label/valor, moeda,
   percentuais, ganhos/perdas, alinhamento e números tabulares, sem gráficos
   antecipados.
9. `/login` e `/dashboard` consomem foundations sem alteração da arquitetura de
   autenticação, dos redirects ou da fronteira Client.
10. Favicon e app icon oficiais são referenciados sem a autoridade concorrente
    de `src/app/favicon.ico`; assets carregam de `/brand/...`.
11. Lint, typegen, typecheck, build e validações manuais previstas passam; falha
    de CI/fontes, cache ou escopo de `/` fica registrada, não ocultada.

## Ordem das subtarefas

1. [002-01-integrar-inter.md](../tasks/002-brand-integration-design-system-foundations/002-01-integrar-inter.md) — integrar Inter e corrigir aliases de fonte.
2. [002-02-estabelecer-tokens-semanticos.md](../tasks/002-brand-integration-design-system-foundations/002-02-estabelecer-tokens-semanticos.md) — separar brand colors e semantic colors.
3. [002-03-estabelecer-foundations-globais.md](../tasks/002-brand-integration-design-system-foundations/002-03-estabelecer-foundations-globais.md) — consolidar typography, spacing, radius, borders, shadows e focus.
4. [002-04-integrar-assets-oficiais.md](../tasks/002-brand-integration-design-system-foundations/002-04-integrar-assets-oficiais.md) — usar logos, icons e favicons oficiais.
5. [002-05-ajustar-componentes-fundamentais.md](../tasks/002-brand-integration-design-system-foundations/002-05-ajustar-componentes-fundamentais.md) — alinhar Button, Card, Input e Label.
6. [002-06-aplicar-foundations-as-telas.md](../tasks/002-brand-integration-design-system-foundations/002-06-aplicar-foundations-as-telas.md) — adaptar `/login` e `/dashboard` sem alterar auth.
7. [002-07-validar-acessibilidade.md](../tasks/002-brand-integration-design-system-foundations/002-07-validar-acessibilidade.md) — validar contraste, teclado, foco e comunicação de estados.
8. [002-08-validar-checks-tecnicos.md](../tasks/002-brand-integration-design-system-foundations/002-08-validar-checks-tecnicos.md) — executar lint, typegen, typecheck e build.
9. [002-09-validar-visual-final.md](../tasks/002-brand-integration-design-system-foundations/002-09-validar-visual-final.md) — realizar matriz visual e encerrar evidências.

## Premissas explícitas e pendências

- `002` foi informado explicitamente e não é um número gerado pelo repositório.
- A paleta, tagline, logos, Inter e light mode são restrições já decididas; não
  são perguntas abertas desta fase.
- `/login` e `/dashboard` são o escopo visual das telas da fase 001. `/` fica
  fora da implementação 002 por ainda ser template; qualquer aceite que inclua
  `/` exige follow-up explícito antes de ampliar a task 06.
- `next/font/google` é escolha técnica inicial porque Next 16 o suporta e não há
  arquivos Inter locais. Se CI não tiver rede/cache, implementação deve parar e
  registrar decisão humana entre disponibilizar cache/artefato ou adotar
  `next/font/local` com arquivos licenciados.
- Nenhuma decision adicional por componente é necessária; as decisões técnicas
  estão registradas nesta spec para a execução planejada.
- Nenhum dado privado pode entrar no dashboard durante esta fase; o guard Client
  continua sendo UX, conforme decisão 001.
- A documentação desta execução só cria/atualiza arquivos em `docs/`; código,
  assets, dependências e lockfiles ficam para execução futura.
