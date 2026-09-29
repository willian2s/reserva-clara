# 007-09 — Persistir taxas em Transactions

- **Ticker:** `007`
- **Número:** `09`
- **Status:** `completed`

## Objetivo

Estender o contrato de Transaction para persistir uma taxa monetária fixa
opcional e oferecer essa opção no formulário de operações, sem calcular total,
posição, saldo, FX ou rentabilidade.

## Dependências

- 007-02 contratos e decimais concluídos.
- 007-04 repository append-only concluído.
- 007-05 Rules e Emulator concluídos.
- 007-07 rota e UX de operações concluídas.
- Decisão explícita: taxa é valor fixo absoluto, não percentual.

## Escopo

- Adicionar `fee: null | { currency, decimal }` ao modelo V2 de Transaction.
- Aceitar ausência de taxa no input e normalizar para `null`; normalizar taxa
  zero para `null`; aceitar somente decimal não negativo e moeda ISO 4217.
- Ler documento legado V1 sem `fee` como `fee: null` e sempre persistir `fee`
  em novas escritas.
- Incluir `fee` na comparação de idempotência e conflito, sem compará-la em
  `createdAt` ou alterar ordenação/reducer de quantidade.
- Atualizar parser, converter, repository, Rules e testes puros/Emulator.
- Exibir no formulário uma opção acessível de taxa fixa e mostrar taxa real no
  histórico, sem apresentar total ou valor derivado.

## Fora de escopo

- Taxa percentual, base de cálculo, total, arredondamento ou conversão cambial.
- Taxas como evento separado, `tax`, custos implícitos, caixa, posição,
  rentabilidade, edição ou exclusão de Transaction.
- Migração destrutiva ou backfill produtivo de documentos V1.

## Critérios de aceite

- Operação sem taxa persiste `fee: null` e continua compatível com o fluxo atual.
- Taxa fixa válida persiste moeda e decimal canônico; taxa zero vira `null`.
- Taxa negativa, percentual, exponencial, `number`, moeda inválida ou estrutura
  extra são rejeitados pelo domínio, converter/parser e Rules.
- Documento legado sem `fee` é lido como `null`.
- Retry com mesma taxa é idempotente; taxa diferente gera conflito sem
  overwrite.
- Taxa não altera ordenação, validação de sell ou quantidade reduzida.
- A UI mantém intenção/ID e taxa durante reconciliação e não repete write
  automaticamente.

## Arquivos prováveis

- `docs/specs/007-assets-transactions.md`
- `src/domain/transaction.ts`
- `src/domain/value-objects.ts`
- `src/data/firestore/parsers/transaction-parser.ts`
- `src/data/firestore/converters/transaction-converter.ts`
- `src/data/firestore/transaction-repository.ts`
- `firestore.rules`
- `tests/domain.test.mjs`
- `tests/firestore.rules.test.mjs`
- `src/components/transaction/transaction-form.tsx`
- `src/components/transaction/transaction-ledger.tsx`

## Validação

Executar testes de domínio e Rules Emulator para compatibilidade, schema,
ownership e append-only; depois lint, typegen, TypeScript, build e
`git diff --check`. Repetir revisão independente e registrar validação manual
de taxa, zero, erro, refresh, archive e acessibilidade.

## Registro de execução

- **Arquivos alterados:**
  - `docs/specs/007-assets-transactions.md`, `007-00-overview.md` e
    `007-08-executar-gates-e-handoff.md` — Transaction V2, dependências e
    ordem do handoff normalizadas.
  - `src/domain/value-objects.ts` e `src/domain/transaction.ts` — tipo/parsers
    de taxa fixa, compatibilidade V1 sem `fee`, normalização de zero e
    comparação de payload.
  - `src/data/firestore/parsers/transaction-parser.ts`,
    `src/data/firestore/converters/transaction-converter.ts` e
    `src/data/firestore/transaction-repository.ts` — schema escrito com `fee`,
    leitura legada e idempotência incluindo taxa.
  - `firestore.rules` — schema fechado de taxa não negativa e rejeição de zero
    como objeto não normalizado.
  - `tests/domain.test.mjs` e `tests/firestore.rules.test.mjs` — normalização,
    compatibilidade, comparação de payload e casos válidos/inválidos no
    Emulator.
  - `src/components/transaction/transaction-form.tsx` e
    `transaction-ledger.tsx` — opção acessível de taxa fixa e exibição sem
    cálculos derivados.

- **Decisões/desvios:**
  - Taxa é valor monetário fixo absoluto opcional: `{ currency, decimal }`.
    Ausência e zero são normalizados para `null`; percentual, total, FX e
    arredondamento permanecem fora de escopo.
  - Documentos V1 sem `fee` são lidos como `null`; novas escritas sempre
    incluem `fee`, inclusive quando nulo.
  - O repository compara taxa no payload imutável por meio de
    `transactionPayloadEquals`; taxa diferente não pode sobrescrever evento.
  - O Firebase foi validado pelo `firebase emulators:exec` do Rules Emulator;
    não houve deploy nem publicação de Rules.
  - A interface segue a convenção brasileira: data `dd/mm/aaaa`, decimal com
    vírgula (`1.234,56` também é aceito) e valores exibidos com vírgula.
  - Pontos entre grupos de três dígitos sem vírgula também são tratados como
    separador de milhar (`1.234` vira `1234`), enquanto o contrato persistido
    continua usando decimal canônico com ponto.
  - Os campos de quantidade, preço e taxa aplicam máscara de decimal brasileiro
    durante a digitação; data aplica máscara `dd/mm/aaaa` e moedas aceitam
    somente três letras.

- **Comandos/resultados/evidências:**
  - `npm run test:domain` — 5 testes aprovados, 0 falhas.
  - `npm run test:rules` — 13 testes do Firebase Rules Emulator aprovados, 0
    falhas; mensagens `PERMISSION_DENIED` correspondem aos casos negativos.
  - `npm run lint` — concluído sem erros.
  - `npm exec next typegen && npx tsc --noEmit` — concluído sem erros.
  - `npm run build` — concluído; rota de operações e Proxy confirmados.
  - `git diff --check` — concluído sem erros.
  - Uma execução paralela de build/typegen encontrou uma ausência transitória
    de `.next/types/routes.d.ts`; typegen + TypeScript foram repetidos
    sequencialmente após o build e passaram.
  - Revisão independente — achados de zero não normalizado e ordem documental
    corrigidos; comparação de payload passou a ser coberta pelo domínio.
  - Revisão independente de localização — agrupamento brasileiro sem fração
    corrigido e gates repetidos sequencialmente.
  - Revisão independente da máscara — confirmou `1.234` como milhar,
    `1.234,56` como decimal agrupado e `1.2300` como decimal sem novos
    blockers.

- **Riscos residuais:**
  - A leitura completa do ledger continua sendo o limite operacional para
    carteiras grandes.
  - A taxa é armazenada e exibida, mas não participa de saldo, posição, total,
    rentabilidade ou conversão cambial.
  - Não há runner automatizado de UI; teste manual autenticado de taxa,
    refresh, archive, teclado e viewport permanece no handoff 007-08.
