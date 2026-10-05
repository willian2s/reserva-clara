# 010 — Real Portfolio Dashboard

## Status

`completed`

## Ticker

`010`

## Contexto e baseline operacional

A fase 010 fecha o Marco B do roadmap: transformar ledger, posições e cotações
já disponíveis em uma leitura patrimonial compreensível. O baseline é a `main`
no commit `ddcd2ec`, com working tree limpo durante o planejamento.

As fases anteriores deixaram os seguintes contratos operacionais:

- `Portfolio` é owner-scoped, suporta múltiplas carteiras e usa BRL como moeda
  base na V1;
- carteiras arquivadas permanecem legíveis e restauráveis, mas não aceitam
  novas Transactions;
- `Asset` é identidade econômica user-scoped e reutilizável entre carteiras;
- `Transaction` é ledger append-only e continua sendo a fonte da verdade;
- `Quote` é transitória, obtida pelo boundary autenticado `/api/quotes`, com
  estado `fresh`, `stale` ou `unavailable` e lote máximo de 20 Assets;
- `Position`, `MarketPosition` e `AllocationResult` são projeções efêmeras,
  exatas e reconstruíveis, sem coleção ou cache persistido;
- `readPortfolioPositions` já compõe uma carteira, mas ainda não fornece todos
  os metadados necessários à apresentação nem existe composição global;
- a aplicação continua autenticada no browser. `AuthGate` é UX; Firestore
  Rules e a validação do token no endpoint de Quotes são os boundaries reais.

Não existem regras adicionais em `.opencode/rules/`. O projeto usa npm,
Next.js App Router, Tailwind 4 CSS-first e shadcn `base-nova` com Base UI. Não
há runner React/E2E, formatter ou CI configurados.

## Objetivo

Entregar dois dashboards patrimoniais atuais e verificáveis:

1. `/dashboard`, consolidando somente carteiras ativas;
2. `/portfolios/[portfolioId]`, detalhando uma carteira ativa ou arquivada.

As telas devem mostrar patrimônio conhecido, custo investido das posições
abertas, composição e posições, preservando explicitamente cotação stale,
indisponibilidade e moeda incompatível. A experiência deve permitir atualizar
os dados sem transformar valores ausentes em zero e sem apresentar diferença
nominal como performance histórica.

```text
Transactions + Assets
         ↓
      Positions
         + Quotes
         ↓
 Portfolio dashboard reads
         ↓
 Detail dashboard + active-portfolios dashboard
```

## Escopo

### Incluído

- projeção enriquecida por carteira com metadados mínimos de Asset e Quote;
- totais conhecidos de patrimônio e custo investido em moeda-base;
- composição global client-only das carteiras ativas;
- uma leitura do catálogo por atualização global, um ledger por carteira e
  cotações deduplicadas em lotes de até 20;
- isolamento de falha de uma carteira no dashboard global;
- dashboard global com total conhecido, distribuição entre carteiras, resumo
  das posições abertas e Assets sem cotação;
- dashboard de carteira com totais, composição corrente, posições abertas,
  estados de cotação e links para operações/configurações;
- leitura contextual de carteira arquivada, excluída do consolidado global;
- atualização manual, retry, loading, refreshing, empty, partial e error;
- formatação pt-BR sem usar ponto flutuante para matemática financeira;
- acessibilidade, responsividade e validação manual compatíveis com os padrões
  já usados no projeto;
- testes puros/read-side com `node:test` e regressão dos gates existentes.

### Fora de escopo

- target allocation, rebalanceamento ou sugestão de aporte da fase 011;
- gráfico temporal, rentabilidade, retorno percentual ou snapshots da fase 012;
- dividendos, caixa, aportes líquidos, lucro realizado, impostos ou ledger
  expandido das fases 015/016;
- conversão cambial ou agregação multi-moeda da fase 017;
- trusted write boundary da fase 020;
- Position/summary persistido, paginação ou otimização de custo da fase 021;
- polling, realtime listeners, React Query, state manager global ou biblioteca
  de gráficos;
- alteração de schema, Firestore Rules, índices, secrets, migration ou deploy.

## Comportamento atual encontrado

### Rotas

- `/dashboard` renderiza apenas o card estático “Seu espaço está pronto” e um
  link para `/portfolios`.
- `/portfolios/[portfolioId]` usa `PortfolioDetail`, lê só o Portfolio e afirma
  que saldo, valores e posições ainda não são exibidos.
- `/portfolios` já diferencia carteiras ativas e arquivadas, com estados de
  loading, erro, vazio e retry.
- o shell protegido contém navegação, skip link e `main#main-content`.

### Read-side e domínio

- `readPortfolioPositions` lê Portfolio, Transactions e Assets, deriva
  Positions, busca Quotes de posições abertas e calcula Allocation.
- O leitor carrega o catálogo inteiro em cada chamada. Chamá-lo N vezes no
  dashboard global repetiria catálogo e Quotes compartilhadas.
- `PortfolioPositionRead` retorna `portfolio`, `positions`, `marketPositions`
  e `allocation`, mas descarta o `QuoteResult` intermediário, timestamps da
  Quote, código sanitizado e metadados exibíveis do Asset.
- `AllocationResult.totalMarketValue` é a soma conhecida na moeda-base.
  `partial` significa que ao menos uma posição aberta não foi valorizada.
- posições fechadas permanecem no resultado derivado, mas não solicitam Quote
  nem entram no valor ou na Allocation.
- `MarketPosition.nominalDifference` é diferença corrente nominal, não
  rentabilidade nem histórico.

### UI e validação

- componentes existentes preservam conteúdo durante recarga, descartam
  respostas concorrentes com `requestId` e usam `role=status`/`role=alert`.
- não existe formatador financeiro compartilhado; alguns componentes apenas
  substituem ponto por vírgula.
- `.financial-value` já fornece números tabulares em `globals.css`.
- não existem testes de renderização de dashboard. O harness atual usa
  `node:test` para domínio/read-side e deixa acessibilidade e responsividade
  para smoke manual.

## Requisitos e critérios de aceite

### Boundaries e fonte da verdade

1. Transaction continua sendo a única fonte autoritativa das posições. A fase
   não cria documento, coleção, índice, cache ou campo persistido de Position,
   dashboard ou summary.
2. `Position`, `MarketPosition`, `AllocationResult` e os novos summaries são
   derivados em memória. Nenhum componente React reimplementa reducer,
   valuation, soma financeira ou Allocation.
3. A UI e os leitores permanecem client-only sob o `AuthGate`; isso não deve
   ser descrito como autorização server-side. Repositories owner-scoped,
   Firestore Rules e `/api/quotes` permanecem os boundaries de dados.
4. A fase não muda os contratos persistidos de Portfolio, Asset, Transaction ou
   Quote, nem altera Rules, índices ou environment.
5. Matemática financeira e agregações usam os helpers decimais/`bigint`
   existentes. Conversão para `number` só pode ser usada, se necessária, para
   geometria visual não autoritativa depois de o valor textual estar definido;
   nunca para gerar valores exibidos ou totais.

### Projeção enriquecida por carteira

6. O read-side deve expor um item por Position associado ao Asset, distinguindo
   posição fechada, valor disponível e valor indisponível.
7. Para valor disponível, o item preserva `MarketPosition`, `freshness`,
   `quotedAt` e `fetchedAt`. Para indisponibilidade, preserva motivo e código de
   Quote sanitizado quando existente.
8. A extensão não adiciona timestamps ou metadados de apresentação ao contrato
   matemático de `MarketPosition`; a observação de Quote fica no read model.
9. Asset ausente, ledger inválido ou erro estrutural continua sendo falha de
   composição. Quote indisponível ou incompatível continua sendo dado parcial.
10. Posição fechada não solicita Quote e não aparece na lista principal de
    posições atuais. Ela pode permanecer no read model para reconciliação, sem
    ser apresentada como patrimônio atual.

### Semântica dos totais

11. Um total monetário derivado deve carregar moeda, valor conhecido e status
    `empty`, `complete` ou `partial`.
12. Patrimônio é a soma de `marketValue` conhecido das posições abertas na
    moeda-base. Quote `unavailable`, Quote incompatível e posição fora da
    moeda-base são excluídas e tornam o total `partial`; não viram zero.
13. Quote `stale` entra no patrimônio conhecido, preserva a marcação stale e
    não torna a cobertura monetária parcial por si só.
14. “Valor investido” significa custo de aquisição remanescente das posições
    abertas, exposto na UI como “Valor investido”. Não é
    soma histórica de compras, aporte líquido nem fluxo de caixa.
15. Custo investido pode permanecer `complete` quando uma Quote está
    indisponível, pois depende da Position. Posição fora da moeda-base é
    excluída do Valor investido e torna esse valor `partial` sem FX.
16. Ausência de posições abertas produz status `empty` e valor conhecido `0`.
    Todas as Quotes indisponíveis com posições abertas produzem patrimônio
    `partial` e valor conhecido `0`, nunca estado vazio.
17. Em estado parcial, a copy deve usar “valor conhecido”/“patrimônio conhecido”
    e informar que itens ficaram fora. Não calcular percentual de cobertura,
    pois o valor ausente é desconhecido.
18. Diferença nominal, se exibida em uma posição, deve ser rotulada como atual
    e nominal. A fase não mostra percentual, tendência, evolução ou performance.

### Read-side global

19. Um novo leitor global lista carteiras ativas uma vez, lista Assets uma vez,
    lê o ledger de cada carteira ativa e deduplica os `assetId` abertos antes de
    solicitar Quotes.
20. Requests de Quote continuam em lotes sequenciais de no máximo 20 IDs e
    reutilizam a mesma política de sanitização/completude do leitor individual.
21. A projeção por carteira é compartilhada entre detalhe e global; não devem
    existir duas implementações de Position, valuation, unavailable ou stale.
22. Falha ao listar carteiras, listar Assets ou autenticar torna o dashboard
    global indisponível. Falha de ledger/composição de uma carteira é isolada:
    a carteira aparece indisponível e as demais continuam legíveis.
23. Uma carteira indisponível torna os totais globais `partial`, mesmo que as
    carteiras restantes estejam completas. Nenhum zero é imputado à carteira.
24. O total global soma os totais públicos por carteira na moeda global, para
    reconciliar exatamente com o breakdown e evitar novo arredondamento por
    quantidade consolidada.
25. A distribuição entre carteiras usa somente patrimônio conhecido. Em estado
    parcial, a UI a chama de distribuição do valor conhecido. Denominador zero
    produz participação `null`, sem `NaN`, infinito ou fatias artificiais.
26. O escopo global é explicitamente `active-portfolios`. Carteiras arquivadas
    não têm ledger nem Quotes carregados pelo global e ficam fora dos totais.
27. Enquanto a V1 só cria carteiras BRL, BRL é a moeda consolidada. Se uma
    carteira com outra moeda-base aparecer, ela fica fora do agregado com
    diagnóstico parcial; nenhuma conversão implícita é aplicada.

### Dashboard global

28. `/dashboard` deixa de ser estático e exibe “Patrimônio das carteiras
    ativas”, com estado completo, vazio ou conhecido/parcial.
29. A tela mostra, no mínimo: patrimônio conhecido, custo investido das posições
    abertas, quantidade de carteiras ativas, quantidade de posições abertas e
    resumo de cobertura das Quotes.
30. A distribuição lista cada carteira legível com valor conhecido, participação
    no denominador conhecido e link para o detalhe. Carteiras ilegíveis aparecem
    separadamente como indisponíveis, sem valor zero.
31. O resumo de posições preserva a identidade `portfolioId + assetId`, mostra
    símbolo/mercado/classe, quantidade, custo e valor atual quando disponível,
    e não mistura custos de carteiras diferentes.
32. Assets sem cotação são apresentados com nome legível, motivo sanitizado e
    carteiras afetadas. O mesmo Asset pode ser deduplicado nessa seção sem
    perder os vínculos com cada carteira.
33. Sem carteiras ativas, a tela mostra empty state com ação para criar/abrir
    carteiras. Carteiras apenas arquivadas não entram no consolidado.

### Dashboard da carteira

34. `/portfolios/[portfolioId]` consome a projeção compartilhada e exibe nome,
    moeda-base, estado ativa/arquivada, patrimônio conhecido e custo investido.
35. A composição corrente lista posições valorizadas com valor e percentual
    conhecido. Indisponíveis ficam fora do denominador e são explicadas ao lado,
    não escondidas nem representadas por zero.
36. A lista de posições abertas mostra metadados do Asset, quantidade, custo
    médio, custo remanescente, valor atual, estado fresh/stale/unavailable e
    horário da Quote quando disponível.
37. Carteira sem operações ou apenas com posições fechadas apresenta estado
    vazio e ações para abrir histórico/cadastrar operação, sem gráfico vazio.
38. Carteira arquivada permanece consultável, recebe aviso de read-only e não é
    confundida com o consolidado ativo. Valores usam Quotes atuais e devem ser
    descritos como visão corrente, não valor no momento do arquivamento.
39. Links existentes para configurações, histórico de operações, lista de
    carteiras e catálogo de Assets permanecem disponíveis conforme o contexto.

### Atualização, erros, acessibilidade e responsividade

40. Cada dashboard oferece “Atualizar dados”, que relê ledger/catálogo aplicável
    e Quotes. Não haverá polling ou cache client paralelo nesta fase.
41. Durante atualização, a última leitura válida permanece visível com estado
    `refreshing`, botão ocupado e anúncio discreto. Respostas antigas são
    descartadas por request ID; unmount/troca de usuário não atualiza estado.
42. Falha fatal inicial mostra mensagem sanitizada e retry. Falha após uma
    leitura válida não apaga silenciosamente os dados anteriores e informa que
    a atualização falhou.
43. Quote stale e indisponível usam texto, não apenas cor. Valores positivos e
    negativos também não dependem somente de cor.
44. Headings, listas, links, botões, estados `role=status`/`role=alert`, foco e
    `aria-live` seguem os padrões existentes. Os dashboards funcionam por
    teclado, com zoom e sem informação exclusiva em hover.
45. Mobile usa fluxo em uma coluna e cards/listas sem tabela horizontal larga;
    desktop amplia a composição sem esconder dados. Símbolos e nomes longos não
    causam overflow.
46. Formatação monetária e percentual é pt-BR, determinística e testável a
    partir de strings decimais. Os valores canônicos não são mutados.

### Validação

47. Testes do read-side cobrem compartilhamento da projeção, metadados de Quote,
    posições fechadas, unavailable, stale e totais investido/patrimonial.
48. Testes globais provam catálogo único, um ledger por carteira ativa, Quote
    deduplicada, chunking 20+1, exclusão de arquivadas, falha isolada, moeda,
    status parcial/vazio e distribuição reconciliada.
49. Testes puros cobrem formatadores e estado de atualização sem introduzir
    runner React obrigatório. A UI é validada por smoke manual com fixtures
    sintéticas, teclado, zoom e larguras mobile/desktop.
50. Testes existentes, Rules Emulator, lint, Next typegen, TypeScript, build e
    `git diff --check` permanecem verdes.

## Abordagem escolhida

### Arquitetura

```text
Firestore repositories (client-only)
  ├── listPortfolios() uma vez no global
  ├── listAssets() uma vez por leitura
  └── listTransactions(portfolioId) por carteira
                    ↓
preparação/projeção compartilhada por carteira
  ├── reducePositions
  ├── fetch Quote batches deduplicados
  ├── deriveMarketPosition
  └── calculateAllocation
                    ↓
PortfolioDashboardRead
                    ↓
agregação global decimal exata
                    ↓
GlobalDashboardRead
                    ↓
componentes client finos
```

O leitor individual continua sendo a facade do detalhe, mas passa a reutilizar
helpers de preparação, batching e projeção. O global fornece catálogo e
QuoteResults compartilhados a essa mesma projeção. Só a leitura dos ledgers
permanece N por natureza do schema atual.

### Contratos conceituais

Os nomes finais são fechados em 010-01 e exportados por
`src/domain/portfolio-summary.ts`, preservando esta semântica:

```ts
type AmountGap =
  | Readonly<{
      scope: "asset";
      portfolioId: DocumentId;
      assetId: DocumentId;
      reason:
        | "quote-unavailable"
        | "quote-currency-mismatch"
        | "base-currency-mismatch";
    }>
  | Readonly<{
      scope: "portfolio";
      portfolioId: DocumentId;
      reason:
        | "read-failed"
        | "invalid-ledger"
        | "composition-failed"
        | "base-currency-mismatch";
    }>;

type KnownAmount = Readonly<{
  currency: CurrencyCode;
  status: "empty" | "complete" | "partial";
  knownAmount: DecimalString;
  unavailable: readonly AmountGap[];
}>;

type QuoteCoverage =
  | Readonly<{
      status: "none";
      requested: 0;
      fresh: 0;
      stale: 0;
      unavailable: 0;
    }>
  | Readonly<{
      status: "fresh";
      requested: number;
      fresh: number;
      stale: 0;
      unavailable: 0;
    }>
  | Readonly<{
      status: "stale";
      requested: number;
      fresh: 0;
      stale: number;
      unavailable: 0;
    }>
  | Readonly<{
      status: "mixed";
      requested: number;
      fresh: number;
      stale: number;
      unavailable: number;
    }>;

type PositionReadItem = Readonly<{
  asset: Pick<Asset, "id" | "symbol" | "market" | "assetType" | "currency">;
  position: Position;
  currentValue:
    | { status: "not-applicable"; reason: "closed" }
    | {
        status: "available";
        marketPosition: MarketPosition;
        quote: Pick<Quote, "price" | "quotedAt" | "fetchedAt" | "freshness">;
        baseCurrency: "included" | "excluded";
      }
    | {
        status: "unavailable";
        reason: "quote-unavailable";
        quoteCode: QuoteErrorCode;
      }
    | {
        status: "unavailable";
        reason: "quote-currency-mismatch";
        quoteCode?: never;
      };
}>;

type PortfolioDashboardRead = Readonly<{
  portfolio: Portfolio;
  items: readonly PositionReadItem[];
  allocation: AllocationResult;
  marketValue: KnownAmount;
  investedAmount: KnownAmount;
  quotes: QuoteCoverage;
}>;

type GlobalPortfolioCandidate = Readonly<
  Omit<Portfolio, "baseCurrency"> & {
    baseCurrency: "BRL" | CurrencyCode;
  }
>;

type GlobalPortfolioEntry =
  | Readonly<{
      status: "ready";
      portfolio: Portfolio;
      read: PortfolioDashboardRead;
      shareOfKnownMarketValue: DecimalString | null;
    }>
  | Readonly<{
      status: "unavailable";
      portfolio: GlobalPortfolioCandidate;
      reason:
        | "read-failed"
        | "invalid-ledger"
        | "composition-failed"
        | "base-currency-mismatch";
    }>;

type GlobalDashboardRead = Readonly<{
  scope: "active-portfolios";
  currency: "BRL";
  portfolios: readonly GlobalPortfolioEntry[];
  marketValue: KnownAmount;
  investedAmount: KnownAmount;
  quotes: QuoteCoverage;
}>;
```

`AmountGap` identifica o escopo afetado por IDs e uma razão estável, sem payload
financeiro, mensagem de provider ou erro externo. `QuoteCoverage` conta
unidades solicitadas e deriva `none` somente quando `requested` é zero;
`fresh`/`stale` representam cobertura exclusivamente daquele estado e `mixed`
representa qualquer combinação restante, inclusive somente indisponíveis. As
contagens são inteiros finitos não negativos e obedecem
`requested = fresh + stale + unavailable`. Quote disponível com moeda
incompatível conta como `unavailable`; Position em moeda não-base com Quote
compatível conta como `fresh`/`stale`, embora fique fora do amount sem FX. No
detalhe, a unidade é uma Position aberta; no global, é um `assetId` aberto
deduplicado antes da consulta compartilhada. As contagens não substituem a
lista de diagnósticos.

#### Matriz normativa de totais

| Situação | Patrimônio (`marketValue`) | Custo (`investedAmount`) |
| --- | --- | --- |
| Sem Positions abertas | `empty`, `knownAmount: "0"`, sem gaps | `empty`, `knownAmount: "0"`, sem gaps |
| Todas abertas valorizadas em BRL | `complete`, soma conhecida | `complete`, soma do custo remanescente |
| Quote stale em BRL | `complete`, stale entra na soma | `complete`, independe da Quote |
| Quote unavailable ou moeda da Quote incompatível em Position BRL | `partial`, soma apenas o conhecido e gap do Asset | `complete`, independe da Quote |
| Position em moeda diferente da moeda-base, com ou sem Quote | `partial`, excluída sem FX e gap do Asset | `partial`, excluída sem FX e gap do Asset |
| Todas as Quotes indisponíveis com Positions abertas | `partial`, `knownAmount: "0"` | `complete` se os custos forem BRL |
| Carteira indisponível no global | `partial`, sem zero imputado e gap da Portfolio | `partial`, sem zero imputado e gap da Portfolio |

Uma carteira sem Positions abertas nunca vira `partial`; uma carteira com
Positions abertas que não podem ser valorizadas nunca volta a `empty`. O custo
é sempre o custo de aquisição remanescente das Positions abertas, nunca compras
históricas, aportes, caixa ou performance.

Para uma Position não-BRL, `base-currency-mismatch` é o diagnóstico do amount
mesmo quando a Quote também está unavailable; o item ainda preserva o motivo da
Quote em `PositionReadItem`. Para Positions BRL, o diagnóstico de Quote é
`quote-unavailable` ou `quote-currency-mismatch`. Assim cada amount tem no
máximo um gap por `portfolioId + assetId`, sem ocultar o estado da Quote no item.
Items, gaps, entries e carteiras são ordenados deterministicamente por
`portfolioId` e depois `assetId`; a identidade de uma posição global é sempre
`portfolioId + assetId`, nunca apenas `assetId`.

`composition-failed` nunca é diagnóstico de Asset nem estado de
`currentValue`. Asset ausente, associação inconsistente, resultado duplicado ou
referência incompatível interrompe a leitura individual; no global, uma falha
estrutural restrita a uma carteira produz entry e gap de Portfolio, enquanto
falhas comuns de autenticação, catálogo ou listagem permanecem fatais.

`quote-unavailable` sempre preserva um `quoteCode` sanitizado. Já
`quote-currency-mismatch` representa Quote disponível incompatível e não carrega
código de provider. Uma carteira candidata cuja moeda-base difira da moeda
global vira entry indisponível com `base-currency-mismatch`, gera gap de
Portfolio nos dois amounts globais e não recebe conversão implícita. O
repository V1 continua aceitando somente Portfolio BRL; o candidato existe para
que a composição global trate explicitamente qualquer dado compatível que surja
nesse seam, sem alterar schema ou parser.

### Política de falhas

| Evento | Detalhe da carteira | Dashboard global |
| --- | --- | --- |
| Portfolio ausente | erro contextual/retry e retorno à lista | não aplicável após listagem |
| Falha de autenticação/catálogo | falha fatal sanitizada | falha fatal sanitizada |
| Ledger inválido | falha fatal da carteira | só a carteira fica indisponível |
| Lote de Quotes falha | posições preservadas, valor parcial | Assets do lote parciais; demais seguem |
| Quote stale | valor conhecido com aviso | valor conhecido com aviso |
| Quote unavailable | sem zero; diagnóstico | sem zero; total global parcial |
| Moeda incompatível | posição visível, fora do total | carteira/posição fora do agregado aplicável |
| Refresh falha | última leitura preservada | última leitura preservada |

### Política visual

- usar cards, listas e barras simples em CSS; não adicionar biblioteca de
  gráficos;
- qualquer barra é complemento visual de rótulo, valor e percentual textual;
- `partial` deve ser tão visível quanto o número principal;
- “patrimônio total” só é usado quando a cobertura é completa; caso contrário,
  “patrimônio conhecido”;
- o rótulo normativo do custo é “Valor investido”, com
  explicação de custo remanescente;
- fresh/stale/unavailable e horário de Quote aparecem por posição;
- stale é “Cotação desatualizada; valor corrente calculado com a última cotação
  disponível” e unavailable é “Cotação indisponível; este item ficou fora do
  patrimônio conhecido”;
- diferença nominal é “Diferença nominal atual”, nunca rendimento ou
  performance;
- carteira arquivada recebe “Carteira arquivada — leitura somente. Os valores
  usam cotações atuais e não representam um snapshot do arquivamento” e não
  entra na navegação como carteira ativa.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Chamar `readPortfolioPositions` N vezes no global | Repete catálogo e Quotes, aumenta custo e produz observações não coordenadas. |
| Agregar dentro dos componentes React | Duplica matemática/regras, dificulta teste e mistura I/O com apresentação. |
| Incluir carteiras arquivadas no total | Mistura escopo inativo com patrimônio operacional e Quotes correntes sem snapshot de archive. |
| Tratar valor ausente como zero | Falsifica patrimônio, diferença e distribuição. |
| Reaproveitar última Quote após erro sem status | Pode exibir valor indefinidamente como atual e contorna a política stale do serviço. |
| Exibir percentual de cobertura monetária | O denominador ausente é desconhecido; o percentual seria inventado. |
| Agregar o mesmo Asset entre carteiras | Apaga a identidade da carteira e pode misturar custos médios distintos. |
| Persistir dashboard/Position | Antecipa 021 e cria segunda fonte que exige sincronização e migration. |
| SSR/BFF para todo o dashboard | Exige migrar a autenticação browser-only e não é necessário para 010. |
| Polling/realtime/React Query | Complexidade sem necessidade concreta; atualização manual cobre a fase. |
| Biblioteca de gráficos | Peso e acessibilidade adicionais sem requisito para a primeira visualização. |
| Mostrar performance histórica | Não existem snapshots confiáveis; pertence à 012. |

## Arquivos, módulos e contratos afetados

### Alterações prováveis

- `src/data/positions/portfolio-read.ts`: extrair preparação, batching e
  projeção compartilháveis; manter facade compatível.
- `src/data/positions/dashboard-read.ts`: composição client-only das carteiras
  ativas e isolamento de falhas.
- `src/domain/portfolio-summary.ts`: totais conhecidos, custo investido,
  agregação e distribuição decimal exata, se a separação se confirmar em 010-01.
- `src/domain/index.ts`: exports públicos dos novos contratos puros.
- `src/components/dashboard/*`: estado, métricas, composição e dashboard global.
- `src/components/portfolio/portfolio-detail.tsx`: substituir placeholder pelo
  dashboard de carteira.
- `src/components/portfolio/use-portfolio-dashboard.ts`: leitura e refresh do
  detalhe, se o hook dedicado mantiver a UI fina.
- `src/components/financial/*` ou equivalente: formatadores e peças visuais
  compartilhadas sem criar framework genérico.
- `src/app/(app)/(protected)/dashboard/page.tsx`: montar o dashboard global.
- `tests/positions-read.test.mjs`, novo `tests/dashboard-read.test.mjs` e testes
  puros de summary/formatação/estado.
- `scripts/run-dashboard-read-tests.mjs` e `package.json`: harness/script novo.

### Contratos preservados

- paths Firestore, parsers, converters, Rules e repositories de escrita;
- `Position`, `MarketPosition`, `AllocationResult` e precisão da fase 009;
- `/api/quotes`, limite de lote, cache server-side e erros sanitizados da 008;
- archive/restore e proibição de novas Transactions em carteira arquivada;
- autenticação browser-only e separação dos hosts;
- links e rotas de Portfolio, Transactions, Assets e Settings.

Não criar GenericRepository, store global, provider registry, coleção de Quote,
Position persistida ou abstração visual sem uso concreto.

## Migração, rollout e rollback

- não há migration de dados, alteração de schema, Rules, índice ou secret;
- rollout recomendado: contratos e projeção compartilhada, leitor global,
  componentes compartilhados, detalhe, global e gates;
- o detalhe pode ser validado antes do consolidado, mas a fase só encerra com
  as duas rotas e os estados parciais;
- smoke usa apenas dados sintéticos/emulador ou conta de teste sem registrar
  valores, UID ou tokens em evidências;
- rollback remove o novo read-side e restaura os componentes anteriores. Como
  nada é persistido, não há reversão de dados.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Total parcial parecer completo | Tipo discriminado, copy “conhecido”, diagnóstico e testes. |
| Quote stale parecer atual | Badge textual, horário da Quote e coverage summary. |
| Dashboard global repetir reads | Catálogo único, Quote deduplicada e um ledger por carteira ativa. |
| Uma carteira quebrar o global | Isolar ledger/composição por entrada e marcar agregado parcial. |
| Drift por `number`/arredondamento | Helpers decimais existentes e testes de reconciliação. |
| “Valor investido” ser entendido como aportes | Usar “Valor investido” e texto explicativo sobre custo de aquisição remanescente. |
| Arquivada inflar patrimônio ativo | Excluir do global e marcar claramente no detalhe. |
| Arquivada parecer snapshot do archive | Informar que a valorização é corrente; histórico fica para 012. |
| Ledger grande encarecer refresh | Manter leitura explícita nesta fase e encaminhar read model para 021. |
| Respostas concorrentes sobrescreverem UI | `requestId`, mounted guard e preservação da última leitura. |
| Ausência de runner React esconder regressão | Extrair lógica pura, smoke manual estruturado e gates de build/lint/type. |
| Dados sensíveis em logs/evidências | Erros sanitizados e fixtures sintéticas; não logar payload financeiro. |

## Estratégia de testes e validação

### Domínio e projeção

- soma exata de patrimônio e custo investido;
- status vazio, completo e parcial;
- quote unavailable não afeta custo BRL, mas afeta patrimônio;
- moeda não-base afeta ambos sem conversão;
- stale é valorizável e contado como stale;
- denominador zero produz participação `null`;
- reconciliação entre total global e breakdown por carteira;
- posição fechada permanece derivável, sem Quote nem exposição como atual.

### Read-side global

- `listPortfolios` e `listAssets` uma vez;
- `listTransactions` somente para cada carteira ativa;
- Asset compartilhado cotado uma vez por refresh;
- chunking 20+1 e resultado incompleto sanitizado;
- falha de uma carteira não remove as demais;
- falha estrutural comum é fatal;
- nenhuma carteira arquivada é lida;
- ordenação determinística por Portfolio/Asset e ausência de payload externo.

### UI e smoke manual

- nenhuma carteira, carteira vazia, posições completas, stale, unavailable,
  moeda incompatível, ledger inválido e carteira arquivada;
- refresh com sucesso, falha e cliques concorrentes;
- teclado, foco, anúncios, contraste sem depender de cor, zoom 200% e larguras
  320 px/desktop;
- nomes e símbolos longos, números negativos e timestamps pt-BR;
- navegação para operações, configurações, Assets e detalhe.

### Comandos

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run test:dashboard-read
npm run test:quotes-adapter
npm run test:quotes-service
npm run test:quotes-route
npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

O Rules Emulator exige Java compatível; neste Linux a fase 009 confirmou Java
21. `next typegen` deve preceder o typecheck. A documentação local da versão
instalada do Next deve ser consultada antes de alterar APIs/convenções do App
Router; ela não estava disponível em `node_modules` durante o planejamento.

## Ordem das subtarefas

1. [010-01-fechar-contratos-e-semantica.md](../tasks/010-real-portfolio-dashboard/010-01-fechar-contratos-e-semantica.md) — fechar tipos, escopo ativo, totais e política visual.
2. [010-02-refatorar-projecao-de-carteira.md](../tasks/010-real-portfolio-dashboard/010-02-refatorar-projecao-de-carteira.md) — compartilhar preparação/batching e enriquecer a leitura individual.
3. [010-03-compor-read-side-global.md](../tasks/010-real-portfolio-dashboard/010-03-compor-read-side-global.md) — ler carteiras ativas com catálogo/Quotes deduplicados e falha isolada.
4. [010-04-criar-apresentacao-patrimonial.md](../tasks/010-real-portfolio-dashboard/010-04-criar-apresentacao-patrimonial.md) — formatadores, estado e componentes acessíveis compartilhados.
5. [010-05-entregar-dashboard-da-carteira.md](../tasks/010-real-portfolio-dashboard/010-05-entregar-dashboard-da-carteira.md) — transformar o detalhe em visão patrimonial real.
6. [010-06-entregar-dashboard-global.md](../tasks/010-real-portfolio-dashboard/010-06-entregar-dashboard-global.md) — substituir o placeholder global pelo consolidado ativo.
7. [010-07-validar-gates-e-handoff.md](../tasks/010-real-portfolio-dashboard/010-07-validar-gates-e-handoff.md) — executar regressões, smoke, revisão de boundaries e handoff.

As subtarefas são sequenciais: contratos precedem projeção, a projeção precede
o global, e as duas telas dependem dos contratos e peças compartilhadas. Cada
tela permanece revisável isoladamente antes do fechamento conjunto.

## Premissas explícitas

- `010` é o ticker explícito da solicitação e o slug adotado é
  `real-portfolio-dashboard`.
- `main` e o código atual prevalecem sobre documentação histórica divergente.
- carteiras ativas são o escopo operacional do consolidado; arquivadas continuam
  acessíveis individualmente e retornam ao consolidado após restauração.
- Portfolio V1 continua BRL. Qualquer outra moeda-base é diagnosticada e
  excluída sem FX.
- o total conhecido pode ser zero e parcial; zero não significa ausência de
  posições quando existem itens indisponíveis.
- stale é utilizável conforme o contrato da 008 e deve ser marcada; unavailable
  não possui valor numérico.
- atualização manual completa é suficiente; não haverá refresh automático nem
  ação separada de quote-only nesta fase.
- posições atuais são as abertas; posições fechadas permanecem reconstruíveis
  pelo ledger e acessíveis pelo histórico de operações.
- nenhuma visualização desta fase constitui histórico, recomendação ou
  autorização de escrita.
- o custo de reler ledgers ativos é aceitável para a escala atual e permanece
  dívida explícita para 021.

## Checkpoints

1. Confirmar em 010-01 que nenhum contrato sugere performance, target ou FX.
2. Após 010-02, executar toda a regressão 009 e provar compatibilidade da facade.
3. Após 010-03, provar deduplicação, falha isolada e reconciliação decimal.
4. Antes das telas, revisar copy de total completo/parcial, stale e archive.
5. Após cada tela, executar lint/typecheck/build e smoke de estados críticos.
6. Antes de concluir, confirmar ausência de schema, Rules, secrets, logs
   financeiros, dependência pesada e persistência derivada.

## Handoff para fases seguintes

- **011 — Contribution Planning:** usar Allocation corrente como observação,
  mas criar target allocation separado; dashboard não representa intenção.
- **012 — Snapshots & Wealth History:** timestamps de Quote e horário de refresh
  não são histórico; snapshots devem versionar captura e algoritmo.
- **015/016 — Ledger expandido/Cash:** custo investido não substitui aportes,
  caixa, dividendos, taxas independentes ou resultado realizado.
- **017 — Currency & FX:** posições excluídas por moeda só entram no agregado
  após conversão explícita/versionada.
- **020 — Trusted Boundary:** dashboard não resolve invariantes de escrita que
  Rules não conseguem agregar.
- **021 — Read Models & Performance:** substituir releitura integral por projeção
  reconstruível, preservando a semântica e os estados desta fase.

## Referências

- `AGENTS.md`.
- `docs/roadmap/reserva-clara-roadmap.md`, seção 7 e sequência crítica.
- `docs/specs/009-positions-allocation.md`.
- `docs/tasks/009-positions-allocation/009-05-compor-read-side-de-carteira.md`.
- `docs/tasks/009-positions-allocation/009-06-validar-gates-e-handoff.md`.
- `docs/decisions/005-portfolio-archive-lifecycle.md`.
- `docs/decisions/006-assets-transactions-ledger.md`.
- `src/data/positions/portfolio-read.ts`.
- `src/domain/position-engine.ts`, `src/domain/market-position.ts`,
  `src/domain/allocation.ts`, `src/domain/decimal-reducer.ts` e
  `src/domain/quote.ts`.
- `src/components/portfolio/portfolio-detail.tsx` e
  `src/app/(app)/(protected)/dashboard/page.tsx`.
