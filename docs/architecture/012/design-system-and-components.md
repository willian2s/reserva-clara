# 012 — Design system, componentes e boundaries de UI

- **Ticker:** `012`
- **Subtarefa:** `012-06`
- **Estado da decisão:** recomendação documental para prototipação; implementação e
  validação em runtime ficam para 013 e para as slices
- **Dados:** fixtures sintéticas; nenhum dado patrimonial real, token ou write

## 1. Escopo, evidência e decisão resumida

Este documento inventaria o design system efetivamente usado no baseline e define
como ele deve ser reutilizado nas jornadas de Carteiras, Ativos, Operações, Quotes,
posições e Visão geral. Ele não cria catálogo produtivo, não escolhe uma biblioteca
nova e não altera componentes de produção.

As decisões são:

1. **Preservar** os tokens semânticos de `globals.css`, as primitivas `Button`,
   `Card`, `Input` e `Label`, a formatação decimal exata e a copy que distingue
   patrimônio conhecido, cobertura, `partial`, `stale` e `unavailable`.
2. **Adaptar** shell, formulários, feedback, estados financeiros, tabela/listas e
   refresh para contratos compartilhados de acessibilidade, escopo e foco. A ação
   de Transaction é **Registrar operação**; posição é uma derivação de leitura.
3. **Adicionar como primitives conceituais**, na fundação 013, `Field`, status de
   leitura, `EmptyState`, `ErrorState`/retry, confirmação destrutiva e uma tabela
   responsiva. A implementação deve preferir HTML semântico e as primitives já
   existentes antes de adicionar dependência.
4. **Não transportar regra de domínio para UI**: componentes recebem view models,
   estados e callbacks; não calculam posição, patrimônio, alocação, idempotência,
   owner ou autorização.
5. Nenhuma decisão desta subtarefa congela router, cache, API, DTO, OpenAPI ou
   biblioteca produtiva. A comparação de alternativas e a prova em protótipo são
   handoff para 013.

O baseline observado foi `src/app/globals.css`, `src/components/ui/*`,
`src/components/financial/*`, shell protegido, dashboard, Portfolio, Asset e
Transaction. A matriz de acessibilidade de 012-05 e a taxonomia de estados de
012-04 são a fonte dos critérios, não uma declaração de conformidade executada.

## 2. Inventário de tokens e padrões efetivamente usados

### 2.1 Tokens e papéis

| Grupo | Tokens/padrões existentes | Uso permitido | Decisão |
| --- | --- | --- | --- |
| Marca | `brand-deep-navy`, `brand-emerald`, `brand-slate-gray`, `brand-cool-gray`, `brand-off-white` | Identidade visual e composição dos semânticos; não comunicar estado financeiro sozinho | Preservar; não usar hex diretamente em componentes |
| Superfície e texto | `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` | Fundo, conteúdo, card e overlay | Preservar; testar claro/escuro |
| Ação | `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground` | Ações e realce de interface | Preservar; `accent` não significa lucro |
| Apoio | `muted`, `muted-foreground`, `border` | Texto auxiliar, separadores e superfícies secundárias | Preservar; medir contraste |
| Controle e foco | `input`, `ring`, `destructive` | Campos, foco visível e erro de interação | Preservar; foco nunca depende de cor sem outline/offset |
| Estado financeiro | `positive`, `positive-foreground`, `negative`, `negative-foreground` | Somente quando acompanhado de rótulo/copy e significado financeiro confirmado | Adaptar; não reutilizar para sucesso genérico, stale ou indisponível |
| Visualização | `chart-1` a `chart-5` | Futuras visualizações, fora do catálogo desta subtarefa | Deferir; não criar gráficos em 012 |
| Geometria | `radius-sm`…`radius-4xl`, `radius-control`, `radius-card`, `--radius` | `rounded-control` para controles e `rounded-card` para superfícies | Preservar; evitar raios locais sem justificativa |
| Tipografia | `font-sans`, `font-interface`, `font-heading`, `font-mono`; `type-*`; `financial-value` | Hierarquia, controles, captions e números tabulares | Preservar; números financeiros continuam strings e `tabular-nums` |

O tema `.dark` redefine superfícies e controles, mas os tokens `positive` e
`negative` não têm redefinição própria. Isso é uma lacuna de validação, não uma
licença para assumir contraste ou semântica em tema escuro.

### 2.2 Primitivas existentes

| Primitive | Contrato observado | Uso e estado | Decisão |
| --- | --- | --- | --- |
| `Button` / `buttonVariants` | Variantes `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; tamanhos de ação e ícone; foco, `disabled`, `aria-invalid` e `aria-busy` são suportados pelo uso | Toda ação com nome previsível; busy deve preservar o escopo da ação | Preservar; adaptar nomes, foco de retorno e uso de ícones |
| `Card` e subcomponentes | Superfície com header/content/footer, `default`/`sm`, borda, raio e spacing semântico | Resumo, formulário e mensagem contextual; não é automaticamente um estado | Preservar; evitar transformar todo feedback em card |
| `Input` | Campo `h-10`, largura total, `aria-invalid`, foco, disabled e placeholder | Formulários de Portfolio, Asset e Transaction | Preservar; completar com `Field`/diagnóstico associado |
| `Label` | Rótulo tipado visualmente e estados disabled | Todo controle com nome visível | Preservar; garantir `htmlFor` e associação verificável |
| `formatDecimal`, `formatMoney`, `formatPercentage`, `formatTimestamp` | Formatação sem ponto flutuante para strings canônicas, pt-BR e timezone explícito | Valores, quantidade, participação e cotação | Preservar; nunca substituir por `number` na UI |
| `financial-copy.ts` | Tradução sanitizada de códigos/estados, incluindo lacunas e frescor | Texto próximo do valor e do diagnóstico | Preservar/adaptar; não esconder `partial`/`unavailable` em símbolo ou cor |

## 3. Matriz componente → estado → critério a11y → slice

| Componente/boundary | Estados mínimos | Critério observável | Slice consumidora | Ação |
| --- | --- | --- | --- | --- |
| Shell aplicado e navegação | público, autenticando, aplicado, `unauthorized`, logout pendente | Skip link, item ativo visual e `aria-current`, logout alcançável, foco no título após rota; Auth UX não é autorização | 013, 014, 017–019 | Adaptar `layout.tsx`; extrair shell na fundação |
| `Button`/ação assíncrona | idle, busy, disabled, invalid, destructive, resultado desconhecido | Nome inclui escopo; `aria-busy` não apaga contexto; foco retorna ao originador ou ao resumo; não repetir write não idempotente | 013, 018, 019 | Preservar primitive; padronizar contrato de ação |
| `Field` + `Label` + `Input` | vazio, preenchido, inválido, disabled, read-only, submetendo | `label`/`id`, `aria-describedby`, resumo e primeiro campo inválido; erro não depende de cor | 013, 017, 018 | Adicionar primitive conceitual; validar em 320 px/200% |
| `Status`/`ReadStatus` | `loading`, `refreshing`, `ready`, `empty`, `partial`, `stale`, `unavailable`, `offline` | Estado anunciado uma vez, com escopo e horário; snapshot permanece; indisponível nunca vira zero | 013, 017, 019 | Adicionar primitive; estado vem da capability |
| `EmptyState` | vazio sem fatos, somente arquivadas, catálogo/ledger vazio | Explica que não é erro e oferece uma ação primária contextual | 017, 018 | Adicionar primitive; destino padrão é Carteiras quando aplicável |
| `ErrorState`/retry | erro sem snapshot, erro com snapshot, offline, `unauthorized`, conflito | Copy sanitizada, retry nomeado, último dado válido preservado; foco no resumo; sem retry cego | 013, 014, 017–019 | Adicionar primitive; separar falha de leitura de falha de comando |
| `AlertDialog`/confirmação | abrir, cancelar, confirmar, erro, foco devolvido | Modal real com nome, foco preso/retornado, Escape e ação destrutiva inequívoca; não usar grupo inline como contrato geral | 013, 017, 018 | Adicionar somente após comparar HTML/Base UI; manter lifecycle contextual |
| Tabela/lista responsiva | lista vazia, dados longos, parcial, stale, indisponível | Cabeçalhos associados; anúncio único; reflow em 320 px/200%; diagnóstico crítico não depende de `<details>` fechado | 017, 019 | Adaptar `PositionTable`; preferir `<table>` nativa se o layout permitir |
| Card financeiro | completo, parcial, stale, unavailable, moeda incompatível | Rótulo separa custo, patrimônio conhecido, cobertura e performance ausente; valor completo e estado audíveis | 017, 019 | Preservar `KnownAmountCard`, `QuoteCoverageCard`, `PositionCard`; corrigir copy nas slices |
| Lista de alocação | itens conhecidos, nenhum valorizado, itens fora do conhecido | Participação é do patrimônio conhecido; indisponíveis aparecem fora da composição e nunca como zero | 019 | Preservar `AllocationList`; manter nota junto da lista |
| Formulário de Transaction | válido, erro de domínio, conflito, offline pré-dispatch, resultado desconhecido | “Registrar operação”; append-only; preservar valores seguros e oferecer “Verificar histórico”; sem replay cego | 018 | Adaptar formulário/feedback, sem mover invariantes para UI |

## 4. Boundaries de apresentação, capability e domínio

### 4.1 Fluxo permitido

```text
rota/shell → feature UI → capability/view model → cliente HTTP/auth → domínio/API
                         ↘ primitives de UI
```

- **Primitives de UI** conhecem HTML, tokens, composição visual, acessibilidade,
  `children` e callbacks. Não importam Firestore, domínio financeiro, owner,
  token ou repository.
- **Feature UI** conhece a tarefa e traduz um view model para primitives. Pode
  decidir qual copy/ação apresentar para um estado já classificado, mas não
  recalcula posição, alocação, custo ou validade de Transaction.
- **Capability/data layer** transforma dados da API em view models por owner e
  escopo, aplica a política de snapshot/retry e fornece estados discriminados.
  Essa camada é alvo do spike 013; não é um store global de negócio obrigatório.
- **Domínio** continua autoridade para invariantes, ledger append-only,
  decimais, datas civis, IDs opacos e derivação financeira. A UI não aceita
  `uid`/`ownerId` do usuário nem decide autorização.
- **Auth** fornece identidade/token sob demanda. `AuthGate` orienta a UX, mas não
  pode ser usado como boundary de dados.

`financial-format.ts` e `financial-copy.ts` são adaptadores de apresentação. O
primeiro não deve converter decimal canônico para ponto flutuante; o segundo
deve traduzir código/estado para copy sanitizada. A regra que produz o estado e o
valor continua fora desses módulos.

### 4.2 Critérios para reuso

Reutilizar uma primitive somente quando ela:

1. tiver semântica HTML/ARIA estável e um contrato pequeno;
2. permitir nome, estado, foco e escopo explícitos sem depender de cor;
3. não importar regra de negócio nem conhecer uma rota específica;
4. tiver comportamento testável com teclado, leitor de tela, 320 px e zoom de
   200%; e
5. puder ser usada por pelo menos duas jornadas sem criar exceções incompatíveis.

Um componente de feature deve permanecer local quando o comportamento é
específico de uma capability, depende de um view model financeiro singular ou
tem uma decisão ainda aberta. Não extrair por semelhança de classes CSS.

## 5. Decisões de preservar, adaptar e substituir

### Preservar

- Tokens semânticos e CSS-first de `globals.css`, com validação real de contraste.
- Base UI/shadcn `base-nova` já instalada para as primitives existentes; não
  copiar outro estilo nem adicionar biblioteca por hábito.
- `Button`, `Card`, `Input`, `Label`, foco visível global e espaçamento existente.
- Formatação exata, `tabular-nums`, valores conhecidos e copy de `financial/*`.
- `partial`, `stale`, `unavailable`, `offline`, resultado desconhecido e último
  snapshot como estados discriminados, não como variações cosméticas.

### Adaptar

- Shell: Visão geral, Carteiras e Ativos com item ativo, logout visível, foco e
  nomenclatura aprovados pela IA.
- Formulários: um contrato de campo/diagnóstico e o vocabulário **Registrar
  operação**, sem duplicar tradução de `DomainError` em cada tela.
- Feedback: escopo explícito em refresh/retry, status polite/alert apropriado,
  diagnóstico essencial visível e foco previsível.
- `PositionTable`: validar e, se possível, trocar roles customizados por tabela
  nativa; manter reflow e não anunciar célula duas vezes.
- Cards financeiros: substituir “Valor investido” sem contexto por “Custo de
  aquisição remanescente” quando a semântica for custo; não prometer performance.
- Empty/error e 404: oferecer a próxima tarefa no contexto de Carteiras, sem
  tratar vazio como falha.

### Substituir ou criar na fundação

- Grupos inline de erro/empty/retry por `Status`, `EmptyState` e `ErrorState`
  compartilhados quando o contrato estiver provado.
- Confirmação inline de exclusão por `AlertDialog` real para ações que exigem
  confirmação; não implementar modal genérico apenas para preencher catálogo.
- `role="table"` customizado por `<table>` nativa quando a responsividade e os
  testes assistivos confirmarem que não há perda de função.

Não substituir componentes financeiros por um pacote de dashboard/chart nesta
fase. Gráficos e catálogo completo estão fora do escopo.

## 6. Lacunas, dependências e handoff

| Lacuna/decisão aberta | Evidência atual | Próximo dono | Critério de saída |
| --- | --- | --- | --- |
| Não existem `Field`, status, empty/error/retry ou dialog compartilhados | Componentes de jornada repetem markup e classes | 013 | Primitive tem contrato, teste de teclado/foco e ao menos duas consumidoras |
| Taxonomia financeira não é transversal no dashboard | `dashboard-read-state.ts` só modela `loading/ready/refreshing/error` | 013/019 | View model expõe estado discriminado e preserva snapshot |
| Shell não marca rota nem oferece logout | `layout.tsx` tem links e skip link, sem `aria-current`/logout | 013/014 | Walkthrough identifica item ativo, logout e foco sem depender de cor |
| Tabela e `<details>` podem esconder/anunciar informação de forma redundante | `PositionTable` usa roles customizados e diagnóstico recolhido | 013/019 | Leitor de tela anuncia cabeçalho, valor e estado uma vez; diagnóstico essencial é visível |
| Contraste e tema escuro não foram medidos | Tokens existem, mas não há pares verificados | 013 | Razões registradas para texto, borda e foco nos temas |
| Copy de custo/operação ainda diverge no baseline | “Valor investido”, “Cadastrar posição”, “lançamento” e “evento” aparecem em features | 017/018/019 | Jornada usa vocabulário aprovado em título, ação, erro e anúncio |
| Confirmação, conflito e resultado desconhecido não têm primitive transversal | Asset usa confirmação inline; Transaction possui recovery local | 013/018 | Ação destrutiva e comando incerto mantêm foco, contexto e não repetem write |
| Biblioteca concreta, router e cache | ADR 015 permanece `proposed` | 013 | Spike comparável decide por evidência, não por hábito |

### Handoff por slice

- **013:** comparar primitives nativas/Base UI, definir contratos de `Field`,
  status, erro, foco, tabela e boundaries de capability; criar testes de
  componente/E2E sem store global de negócio.
- **017:** usar Carteiras como slice de referência, incluindo vazio, arquivada,
  somente leitura, custo, patrimônio conhecido e 320 px/200%.
- **018:** usar `Registrar operação`, formulário associado, conflito,
  append-only, resultado desconhecido e “Verificar histórico”; não colocar
  idempotência em componente visual.
- **019:** manter hierarquia de Quotes/valuation/Visão geral, cobertura separada
  de patrimônio e estados `partial`/`stale`/`unavailable` sem performance falsa.
- **014:** manter Auth UX, API e autorização separados; componentes não recebem
  owner escolhido pelo cliente nem tratam redirect como autorização.

## 7. Roteiro de validação

Esta entrega é documental. Antes de declarar a fundação pronta, cada primitive e
slice deve registrar, com fixtures sintéticas `A11Y-LONG`, `A11Y-PARTIAL`,
`A11Y-STALE`, `A11Y-NO-PERFORMANCE` e `A11Y-KEYBOARD`:

1. ordem de Tab/Shift+Tab, foco inicial, foco pós-rota, foco pós-erro e foco
   devolvido após diálogo;
2. transcript curto de leitor de tela para estado, escopo, valor e ação, sem
   anúncio duplicado;
3. pares de contraste de texto, borda, foco e estados nos temas claro/escuro;
4. reflow em viewport de 320 CSS px e zoom de 200%, sem corte, sobreposição ou
   rolagem horizontal para ler valor/ação;
5. distinção compreensível entre custo, patrimônio conhecido, cobertura, stale,
   unavailable, offline e ausência de performance histórica;
6. teste de boundary que prove que primitives não importam domínio, repository,
   Firestore, BRAPI, token ou `ownerId`.

`git diff --check`, inspeção de links e conferência de ticker são evidências desta
subtarefa. Lint, typecheck, build e testes de código só são necessários se uma
futura implementação alterar código; esta decisão não declara validação de
runtime nem conformidade WCAG.

## Referências

- [`Spec 012`](../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-04 — estados, sessão e recovery`](../../tasks/012-product-ux-ui-ia-api-discovery/012-04-definir-estados-sessao-e-recovery.md)
- [`012-05 — acessibilidade, densidade e microcopy`](../../tasks/012-product-ux-ui-ia-api-discovery/012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [`Arquitetura da informação`](information-architecture.md)
- [`Mapa de jornadas`](journeys-and-product-findings.md)
- [`Matriz de acessibilidade e linguagem`](accessibility-and-language-matrix.md)
- [`Estados, sessão e recovery`](state-and-session-recovery.md)
- [`ADR 015 — frontend e data layer`](../../decisions/015-arquitetura-frontend-e-data-layer.md)
- [`globals.css`](../../../src/app/globals.css)
- [`UI primitives`](../../../src/components/ui/)
- [`financial components`](../../../src/components/financial/)
