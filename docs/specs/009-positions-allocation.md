# 009 — Positions & Allocation

## Status

`planned` — planejamento documental; nenhuma implementação desta fase foi
iniciada.

## Ticker

`009`

## Contexto e baseline operacional

O baseline operacional é a `main` após o fechamento da 008, atualmente
registrada no handoff como `82c1d28`. Não há spec, task ou módulo próprio de
Position/Allocation no repositório. Não existem regras adicionais em
`.opencode/rules/`.

As fases 005–008 estabeleceram os contratos que esta fase deve preservar:

- `Asset` é identidade econômica owner-scoped, reutilizável entre carteiras,
  com `assetId` estável;
- `Transaction` é ledger append-only portfolio-scoped, limitado a `buy` e
  `sell`, ordenado por `effectiveDate`, `createdAt` e ID;
- `Transaction.quantity`, `unitPrice` e `fee` são decimais textuais canônicos;
- o reducer atual usa `bigint`, mas só calcula quantidade;
- `Quote` é transitória, vem do boundary `/api/quotes`, tem estado `fresh` ou
  `stale` e pode ser `unavailable`;
- não existe documento, coleção, índice ou cache autoritativo de Position;
- repositories de Portfolio, Asset e Transaction são client-only;
- o repositório usa `node:test`, lint, Next typegen, TypeScript, build e
  Emulator Rules como gates, sem runner de UI/E2E.

O handoff da 008 orienta explicitamente derivar Position de
`Transaction + Asset + Quote`, sem persistir Quote ou substituir o ledger.
O working tree da base foi tratado como limpo no encerramento da 008; qualquer
divergência observada durante a execução deve ser registrada antes de alterar
contratos.

## Objetivo

Entregar um motor determinístico e reconstruível para derivar posições e
alocação corrente a partir do ledger, combinando cotação somente na projeção
de valor de mercado. Ao final, a fase deve fornecer contratos de domínio puros
e uma composição read-side que a fase 010 possa consumir, sem antecipar o
dashboard, histórico, FX, targets ou uma fonte de verdade paralela.

O resultado deve responder, para uma carteira:

```text
Transactions
      ↓
Position Engine
      ↓
Positions
      + Quote
      ↓
Market Positions
      ↓
Current Allocation
```

`investedAmount` significa o custo de aquisição remanescente da posição, não
o total histórico de compras. `averageCost` é custo médio ponderado e não uma
apuração de lucro realizado.

## Comportamento atual encontrado

- `src/domain/decimal-reducer.ts` implementa soma, subtração não negativa,
  comparação, ordenação e `reduceTransactionQuantity`; não implementa
  multiplicação, divisão, custo médio ou valor de mercado.
- `src/domain/transaction.ts` aceita `buy`/`sell`, `unitPrice` positivo e
  `fee` monetária fixa opcional. A taxa zero é normalizada para `null`.
- `src/domain/value-objects.ts` limita decimais a 30 dígitos inteiros e 18
  fracionários. `DecimalString` admite valores negativos, mas o reducer de
  subtração atual rejeita resultado negativo.
- `src/data/firestore/transaction-repository.ts` lê o ledger completo da
  carteira, ordena e valida venda contra quantidade. O código usa um candidato
  com timestamp máximo para validação de uma nova escrita.
- `src/domain/quote.ts` define Quote/QuoteResult com preço decimal, moeda,
  `freshness` e falhas sanitizadas. `src/data/quotes/quote-client.ts` é o único
  caminho client-side para `/api/quotes`.
- `src/components/portfolio/portfolio-detail.tsx` ainda informa que não
  exibe saldo, valores ou posições. Essa tela não deve virar o dashboard da
  fase 010 durante a 009.
- Não existe combinação atual de Portfolio, Transactions, Assets e Quotes.

## Requisitos e critérios de aceite

### Fonte da verdade e boundary

1. Position, Market Position e Allocation são valores derivados em memória.
   Nenhum documento `positions`, campo derivado em Portfolio/Asset/Transaction,
   coleção nova, índice, Rule, migration ou cache autoritativo é criado.
2. O motor nunca altera, ordena permanentemente ou regrava Transactions; a
   ordem de cálculo é sempre uma cópia ordenada por `effectiveDate ASC`,
   `createdAt ASC`, `id ASC`.
3. Uma venda que deixa quantidade negativa falha com o erro de domínio já
   conhecido (`INSUFFICIENT_QUANTITY`). O read-side não converte ledger
   inválido em posição zero nem esconde a falha.
4. A posição é agrupada por `assetId`, nunca por símbolo, provider ou índice do
   array. Asset ausente, referência inconsistente ou moeda incompatível falha
   explicitamente; nenhuma conversão implícita é feita.
5. O motor não é usado para autorizar escrita de Transaction. A limitação de
   Security Rules contra um cliente que ignore o repository continua sendo
   handoff da fase 020.

### Contrato de Position

6. O contrato puro deve conter, no mínimo:

   ```ts
   type Position = {
     portfolioId: DocumentId;
     assetId: DocumentId;
     currency: CurrencyCode;
     quantity: DecimalString;
     investedAmount: DecimalString;
     averageCost: DecimalString | null;
     closed: boolean;
   };
   ```

   `quantity` e `investedAmount` podem ser `0`; `averageCost` é `null` quando
   a quantidade é zero. `closed` é verdadeiro quando existiu movimento e a
   quantidade final é zero.
7. `reducePosition` reduz as Transactions de um único Asset; `reducePositions`
   reduz uma carteira multi-Asset e retorna resultado determinístico ordenado
   por `assetId`. Assets sem Transaction não criam Position artificial.
8. Operação retroativa é suportada por recomputação integral da sequência
   ordenada. O resultado não depende da ordem em que o array foi recebido.
9. O custo usa média ponderada:

   ```text
   BUY:
     quantity += q
     cost += q × unitPrice + fee

   SELL:
     cost -= q × averageCost vigente
     quantity -= q

   averageCost = cost / quantity, quando quantity > 0
   ```

   A taxa de compra entra no custo somente como valor fixo na mesma moeda do
   preço. A taxa de venda não altera o custo remanescente e não gera lucro
   realizado; ela fica preservada na Transaction para fases de caixa/ledger
   expandido.
10. `unitPrice.currency` deve coincidir com `Asset.currency` e todas as taxas
    usadas no cálculo devem coincidir com essa moeda. Incompatibilidade resulta
    em erro explícito de posição, nunca em ignorar a taxa ou aplicar FX.

### Precisão e aritmética

11. Multiplicação, divisão, redução proporcional e diferença nominal usam
    `bigint`/racionais exatos em memória; `number` não participa da matemática
    financeira. Soma e comparação existentes podem ser reutilizadas.
12. Produtos e divisões intermediários não são arredondados a cada evento. Ao
    materializar `Position`, `MarketPosition` ou razão de Allocation, o valor é
    normalizado para no máximo 30 dígitos inteiros e 18 fracionários com
    arredondamento half-up determinístico. Overflow continua sendo erro de
    domínio.
13. O valor nominal de `MarketPosition` pode ser negativo e deve usar uma
    operação decimal assinada; não se deve reaproveitar a subtração não
    negativa de quantidade para mascarar prejuízo.

### Market Position e Quotes

14. A combinação de uma Position aberta com `QuoteResult` disponível e moeda
    compatível produz Market Position com, no mínimo, `marketValue`,
    `investedAmount`, `nominalDifference` e `freshness`. A diferença é nominal
    e corrente, não é percentual nem histórico.
15. Quote `stale` pode ser usada para valuation, mas seu estado é propagado e
    nunca é apresentado como `fresh`. Quote `unavailable` não produz preço zero
    nem Market Position valorizada.
16. Quote com moeda diferente da Position é indisponível para essa combinação.
    Não há FX na 009. Uma carteira em BRL só inclui na Allocation valores de
    mercado expressos em BRL; posições em outra moeda permanecem no resultado
    de Position, mas ficam fora da Allocation com diagnóstico explícito.
17. Posição zerada não solicita Quote, não cria Market Position aberta e não
    entra no denominador de Allocation.

### Allocation corrente

18. Allocation é somente a composição observada, sem target allocation. Target
    e planejamento de aporte permanecem na fase 011.
19. Para cada Asset valorizado na moeda-base:

   ```text
   assetAllocation = assetMarketValue / portfolioMarketValue
   portfolioMarketValue = Σ assetMarketValue conhecido
   ```

   As razões são decimais canônicas, não `number` nem promessa de soma exata
   após arredondamento.
20. O resultado informa `complete`, `partial` ou `empty`:
    - `empty`: não há posições abertas;
    - `complete`: todas as posições abertas têm valor compatível;
    - `partial`: pelo menos uma posição aberta ficou sem valor por quote,
      moeda ou erro de composição.
    Denominador zero não gera `NaN`, infinito ou distribuição artificial.
21. Assets indisponíveis são listados de forma sanitizada e não entram no
    denominador. Allocation não calcula recomendação, performance, retorno,
    lucro realizado, imposto, caixa ou conversão cambial.

### Read-side e independência do ledger

22. Um leitor de carteira em `src/data/positions/` compõe Portfolio,
    Transactions e Assets pelos repositories existentes, deriva Positions e
    solicita Quotes somente para posições abertas.
23. O leitor usa `fetchQuotes`, nunca `QuoteService`, BRAPI, Firebase Admin ou
    segredo no client. Requests são divididos no limite de 20 Assets da 008;
    falha da consulta de Quotes degrada os resultados para `unavailable` sem
    impedir a leitura das Transactions/Positions.
24. A 009 não cria dashboard, nova rota patrimonial, target editor ou mudança
    visual em `/portfolios/[portfolioId]`. A 010 será dona da experiência do
    dashboard e consumirá o contrato/read-side desta fase.

### Validação

25. Testes puros cobrem compra, venda parcial, zeragem, média ponderada, taxas,
    backfill, empate de ordenação, múltiplos Assets, moeda incompatível,
    precisão/overflow e venda insuficiente.
26. Testes de Market Position/Allocation cobrem Quote fresh, stale,
    unavailable, currency mismatch, carteira vazia, denominator zero e estado
    parcial. Testes do leitor usam repositories/Quote client fake e provam
    chunking, erro sanitizado e ausência de chamada para posição zerada.
27. Regressão dos testes existentes, Rules Emulator, lint, Next typegen,
    TypeScript, build e `git diff --check` permanece verde. Nenhuma alteração
    de Rules elimina a execução de regressão do Emulator.

## Abordagem escolhida

### Camadas

```text
src/data/firestore repositories
        ↓
src/data/positions/portfolio-read.ts
        ↓
src/domain/position-engine.ts
src/domain/market-position.ts
src/domain/allocation.ts
        ↓
read model efêmero para a fase 010
```

O domínio permanece sem Firebase, React, `fetch` ou QuoteService. O leitor é a
única camada que compõe I/O; a matemática fica testável com fixtures puras. Os
tipos derivados não são serializados como documentos nem tratados como
autorização.

### Contratos derivados

Os nomes finais devem ser fechados na subtarefa 009-01, mantendo a intenção:

- `Position` e `reducePosition`/`reducePositions` para ledger + Asset;
- `MarketPosition` e resultado disponível/indisponível para Position + Quote;
- `AllocationResult` com entries, total conhecido, moeda-base, status e IDs
  indisponíveis;
- `PortfolioPositionRead` ou equivalente para a composição client-side.

Erros novos devem estender `DomainError`, possuir código estável e não expor
payload financeiro. O contrato deve distinguir erro de ledger inválido de
indisponibilidade normal de provider.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Persistir `positions` no Firestore | Criaria segunda fonte autoritativa, exigiria sincronização, Rules, migração e tratamento de backfill. |
| Contador de saldo no Portfolio | Quebra com operações retroativas e concorrência; o ADR 006 rejeita contador auxiliar. |
| Calcular tudo em componentes React | Mistura I/O e matemática, duplica regras e torna precisão difícil de testar. |
| Mover a derivação para SSR/Route Handler | Anteciparia migração da autenticação browser-only sem necessidade para 009. |
| FIFO/LIFO | Não há lotes nem semântica tributária no contrato atual; média ponderada atende custo corrente. |
| Usar `number` ou arredondar cada evento | Perde precisão e pode produzir drift em venda parcial e backfill. |
| Tratar stale como fresh ou unavailable como zero | Falsifica atualidade ou distorce o denominador da Allocation. |
| Misturar Allocation com Target Allocation | Target e planejamento pertencem à fase 011. |
| Criar trusted write boundary agora | A garantia forte do ledger é dívida conhecida e pertence à fase 020. |
| Alterar UI de Portfolio como dashboard | Anteciparia a fase 010 e criaria contrato visual antes do read-side estar validado. |

## Arquivos, módulos e contratos afetados

### Alterações prováveis

- `src/domain/decimal-reducer.ts`: operações exatas de multiplicação/divisão,
  arredondamento e diferença assinada, sem quebrar a API de quantidade.
- `src/domain/errors.ts`: códigos/classes de incompatibilidade e cálculo de
  Position, se necessários.
- `src/domain/position-engine.ts`: novo contrato e reducer de Position.
- `src/domain/market-position.ts`: novo contrato de valuation e propagação de
  frescor/indisponibilidade.
- `src/domain/allocation.ts`: novo cálculo de Allocation corrente.
- `src/domain/index.ts`: exports públicos dos módulos novos.
- `src/data/positions/portfolio-read.ts`: composição read-side com repositories
  client-only e `fetchQuotes`.
- `tests/domain.test.mjs` ou novo `tests/positions.test.mjs`, fixtures e
  `scripts/run-positions-tests.mjs`, conforme a decisão do harness em 009-01.
- `package.json`: somente script de teste novo se separar o harness for mais
  claro que ampliar `test:domain`.

### Contratos que não devem mudar

- `src/domain/asset.ts`, identidade e registry;
- `src/domain/transaction.ts`, tipos persistíveis, taxas e append-only;
- `src/domain/quote.ts`, mapping BRAPI, frescor e códigos sanitizados;
- repositories Firestore, paths, `firestore.rules` e `firestore.indexes.json`;
- `src/data/quotes/quote-client.ts`, inclusive limite/boundary da 008.

Não criar GenericRepository, contexto global financeiro, service locator,
Provider registry, coleção de Quotes/Positions ou dependência decimal externa.

## Estratégia de testes e validação

### Domínio

- validar aritmética com frações, carry/borrow, multiplicação com até 18 casas,
  divisão recorrente, half-up, overflow e diferença negativa;
- provar ordenação independente do input, operações retroativas, média ponderada
  e venda proporcional;
- provar fee de compra em moeda compatível, fee de venda sem alteração do custo,
  fee/preço incompatíveis e asset inexistente;
- provar posição zerada, múltiplos Assets e erro de venda acima da quantidade.

### Market Position e Allocation

- usar Quotes sintéticas sem chamada BRAPI real;
- verificar fresh/stale, indisponibilidade, moeda incompatível e zero;
- verificar allocation completa, parcial, vazia, denominator zero e ordem
  determinística dos entries;
- garantir que target allocation, performance histórica e FX não aparecem nos
  contratos.

### Read-side e regressão

- fakes para `getPortfolio`, `listTransactions`, `listAssets` e `fetchQuotes`;
- verificar somente posições abertas solicitam quotes, lotes de no máximo 20,
  falha de provider não perde Position e nenhum segredo entra no bundle client;
- executar, na ordem documentada:

  ```bash
  npm run test:domain
  npm run test:positions
  npm run test:quotes-adapter
  npm run test:quotes-service
  npm run test:quotes-route
  JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
  npm run lint
  npm exec next typegen
  npx tsc --noEmit
  npm run build
  git diff --check
  ```

  Se `/usr/libexec/java_home` não existir no Linux, usar Java 21 disponível e
  registrar o aviso concreto, como no handoff da 008.

## Rollout, checkpoints e rollback

1. Fechar contrato e política de precisão/taxas/moedas antes de escrever o
   reducer.
2. Validar os módulos puros com fixtures sintéticas antes do leitor.
3. Validar composição client-side com fakes, incluindo provider indisponível e
   limite de lote.
4. Fazer checkpoint de revisão para confirmar que não houve schema, Rules,
   persistência ou UI de dashboard.
5. O rollout desta fase é somente de código/read-side; não requer migração,
   secret novo, deploy, seed ou alteração de Console.
6. Rollback remove os módulos de Position/read-side e o script/testes novos;
   como nada é persistido, não há dados para migrar ou desfazer. Transactions,
   Assets, Quotes e Rules permanecem intactos.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Custo médio divergir por arredondamento | Racional/`bigint` interno, sem arredondamento por evento, política half-up testada. |
| Fee em moeda diferente ser ignorada | Falha explícita de Position; sem FX implícito ou fallback silencioso. |
| Venda retroativa invalidar sequência | Recalcular ledger inteiro na ordem total e propagar `INSUFFICIENT_QUANTITY`. |
| Stale ser interpretada como preço atual | Preservar `freshness` no Market Position e no resultado do leitor. |
| Quote indisponível virar zero | Estado unavailable separado; ativo fora do denominador e listado no diagnóstico. |
| Allocation parcial ser tomada como completa | Status e IDs indisponíveis obrigatórios; UI futura deve exibir cobertura. |
| Ledger grande tornar leitura cara | Manter recomputação reversível nesta fase e handoff para read models/021. |
| Rules serem tratadas como garantia do reducer | Não abrir schema; manter limite de SDK direto e handoff para trusted boundary/020. |
| Position ser confundida com histórico | Não calcular performance; 012 deverá materializar snapshots/versionar o modelo. |
| Posição não-BRL desaparecer | Mantê-la em Position/Market Position quando possível e excluí-la da Allocation BRL com motivo. |
| Contrato novo contaminar 010/011 | Exportar tipos puros estáveis, sem target allocation, UI ou recomendação. |

## Ordem das subtarefas

1. [009-01-fechar-contratos-e-politica.md](../tasks/009-positions-allocation/009-01-fechar-contratos-e-politica.md) — fechar tipos, fórmulas, taxas, moedas, precisão, estados e limites.
2. [009-02-estender-aritmetica-decimal.md](../tasks/009-positions-allocation/009-02-estender-aritmetica-decimal.md) — implementar operações exatas reutilizáveis sem quebrar o reducer existente.
3. [009-03-implementar-position-engine.md](../tasks/009-positions-allocation/009-03-implementar-position-engine.md) — derivar Position por Asset e carteira, incluindo backfill e zeragem.
4. [009-04-implementar-market-position-e-allocation.md](../tasks/009-positions-allocation/009-04-implementar-market-position-e-allocation.md) — combinar Quote e calcular Allocation corrente.
5. [009-05-compor-read-side-de-carteira.md](../tasks/009-positions-allocation/009-05-compor-read-side-de-carteira.md) — integrar repositories e Quote client sem criar dashboard.
6. [009-06-validar-gates-e-handoff.md](../tasks/009-positions-allocation/009-06-validar-gates-e-handoff.md) — executar testes, gates, revisão de boundaries e handoff.

As subtarefas são sequenciais porque o contrato matemático precisa estabilizar
antes do reducer e o reducer antes da composição. Nenhuma subtarefa autoriza
implementar a fase 010 ou persistir o read model.

## Premissas explícitas

- `009` é o ticker explícito da solicitação; não será criada numeração
  alternativa.
- O baseline da 008 permanece a referência operacional, mas o código atual da
  `main` prevalece se a documentação histórica divergir.
- Média ponderada é suficiente para custo corrente da V1; FIFO/LIFO e lotes não
  serão introduzidos sem requisito posterior.
- Portfolio base continua BRL. Não há FX nesta fase; outras moedas podem existir
  no ledger, mas não entram na Allocation BRL sem conversão.
- Quote stale é um dado utilizável com marcação explícita; unavailable não tem
  valor numérico.
- Taxa de venda não altera custo remanescente. Resultado realizado, caixa,
  imposto e evento financeiro independente pertencem às fases 015/016.
- Posição zerada permanece no resultado derivado para representar histórico,
  mas não é aberta para valuation/alocação.
- O leitor client-side continua sujeito à autorização das Rules e à autenticação
  browser-only; nenhum AuthGate é tratado como boundary de dados sensíveis.
- O produto ainda não precisa de Position persistida, cache distribuído,
  aggregate confiável ou SSR para cumprir esta fase.

## Handoff para fases seguintes

- **010 — Real Portfolio Dashboard:** consumir o read-side e distinguir total
  conhecido, allocation parcial, quote stale, quote unavailable e posição sem
  moeda-base. A 010 é dona das telas, visualizações e linguagem patrimonial.
- **011 — Contribution Planning:** reutilizar Allocation corrente, mas manter
  target allocation e cálculo de aporte como contratos separados; não tratar a
  Allocation 009 como intenção do usuário.
- **012 — Snapshots & Wealth History:** materializar snapshots com versão do
  algoritmo, momento de captura e referência explícita de Quote; não usar cache
  008 ou Position efêmera como histórico sem versionamento.
- **015/016 — Ledger expandido e Caixa:** decidir efeito de taxas de venda,
  eventos independentes, entradas/saídas e saldo financeiro sem reclassificar o
  custo médio corrente de 009.
- **017 — Currency & FX:** fornecer conversões versionadas para que posições
  fora da moeda-base possam entrar em Allocation sem conversão implícita.
- **020/021 — Trusted Boundary e Read Models:** resolver garantia forte de
  invariantes de escrita e custo de recomputação em ledger grande; qualquer
  read model deverá continuar reconstruível e não autoritativo.

## Referências

- `AGENTS.md`.
- `docs/roadmap/reserva-clara-roadmap.md:505-577` e `:1472-1490`.
- `docs/specs/007-assets-transactions.md:194-243`, `:363-377` e `:547-575`.
- `docs/specs/008-quotes-brapi.md:127-219`, `:221-320` e `:495-508`.
- `docs/tasks/008-quotes-brapi/008-06-validar-gates-e-handoff.md:149-163`.
- `docs/decisions/006-assets-transactions-ledger.md`.
- `src/domain/asset.ts`, `src/domain/transaction.ts`,
  `src/domain/decimal-reducer.ts`, `src/domain/quote.ts` e
  `src/domain/value-objects.ts`.
- `src/data/firestore/asset-repository.ts`,
  `src/data/firestore/transaction-repository.ts`,
  `src/data/quotes/quote-client.ts`.
