# 009-02 — Estender aritmética decimal

- **Ticker:** `009`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Disponibilizar operações decimais exatas para custo, venda proporcional, valor
de mercado, diferença nominal e razão de Allocation, preservando o reducer de
quantidade existente e o limite canônico do domínio.

## Requisitos cobertos

- Critérios 9–13 e 25 da spec 009.
- Compatibilidade com os contratos de `DecimalString`, `PositiveDecimalString`
  e `bigint` estabelecidos na 007.

## Escopo incluído

- Multiplicação e divisão exatas em memória.
- Representação racional/intermediária sem arredondamento por evento.
- Arredondamento half-up na materialização com até 18 casas fracionárias.
- Subtração assinada para diferença nominal.
- Testes de limites, precisão, carry/borrow e overflow.

## Escopo excluído

- Position Engine, Quote, Allocation ou composição de repositories.
- Mudança da gramática persistida ou da precisão de Transaction.
- Dependência decimal externa, `number` financeiro ou alteração de Rules.

## Dependências

- 009-01 concluída.
- `src/domain/decimal-reducer.ts` e `src/domain/value-objects.ts`.
- Testes de domínio existentes em `tests/domain.test.mjs`.

## Arquivos e símbolos prováveis

- `src/domain/decimal-reducer.ts`.
- `DecimalRational` e helpers exatos exportados pelo próprio módulo, sem criar
  uma abstração decimal genérica ou dependência externa.
- `src/domain/errors.ts` para overflow/resultado inválido, se necessário.
- `tests/domain.test.mjs` ou `tests/positions.test.mjs` e script de compilação.

## Passos de implementação

1. Reutilizar parsing/limites existentes e separar valor canônico de estado
   intermediário.
2. Implementar produto, quociente e diferença assinada com `bigint`/racional.
3. Aplicar half-up somente na saída e rejeitar resultado fora de 30/18 dígitos.
4. Manter `subtractDecimalStrings` não negativa para invariantes de quantidade.
5. Cobrir valores positivos, zero, negativos somente onde permitido, dízimas,
   divisões não exatas, carry/borrow e overflow.
6. Verificar que o reducer de quantidade e todos os testes da 007 permanecem
   inalterados semanticamente.

## Testes e comandos de validação

- `npm run test:domain`.
- Teste específico de posições, se o harness for separado: `npm run test:positions`.
- `npm run lint`.
- `npm exec next typegen && npx tsc --noEmit`.
- `git diff --check`.

## Definição de pronto

- Nenhuma operação financeira usa `number` ou arredonda por evento.
- Produto, divisão, diferença assinada e half-up têm casos determinísticos.
- API de quantidade existente continua verde.
- Position Engine pode usar os helpers sem duplicar matemática.

## Riscos e cuidados

- Divisão por zero deve ser erro de domínio, não `Infinity`.
- Não ampliar silenciosamente a gramática persistida.
- Não permitir resultado negativo em quantidade/custo remanescente.
- Evitar exportar um utilitário genérico que antecipe um framework financeiro.

## Execução

- **Arquivos alterados:** `src/domain/decimal-reducer.ts`,
  `src/domain/errors.ts`, `tests/domain.test.mjs`, este arquivo e
  `docs/tasks/009-positions-allocation/009-00-overview.md`.
- **Decisões e desvios:** foi exportado o racional mínimo
  `DecimalRational` com numerador/denominador `bigint` reduzidos por MDC, para
  que o Position Engine preserve intermediários sem arredondar por evento.
  Produto e divisão expõem helpers racionais e wrappers materializados; a
  materialização usa half-up por magnitude em 18 casas. A subtração assinada
  foi separada da subtração não negativa existente. Overflow agora usa
  `POSITION_ARITHMETIC_OVERFLOW`; divisão por zero permanece erro de domínio
  `INVALID_DOMAIN_VALUE`. Nenhuma gramática persistida, Transaction, Rule,
  dependência ou API do reducer de quantidade foi alterada semanticamente.
- **Comandos executados:** `npm run test:domain`, `npm run lint`,
  `npm exec next typegen`, `npx tsc --noEmit`, `npm run build` e
  `git diff --check`.
- **Resultados e evidências:** 9 testes de domínio passaram, incluindo produto,
  divisão exata e não exata, racional intermediário, half-up assinado,
  diferença negativa, limites 30/18, divisão por zero, overflow em produto,
  divisão e subtração assinada, além da regressão do reducer.
  Lint, geração de tipos, TypeScript, build e diff check passaram sem erros.
  Revisão independente final retornou **APROVADO**, sem bloqueadores; confirmou
  o status `in_progress` da spec, progresso `2/6` e o checklist SDD consistente.
- **Riscos residuais:** o limite de crescimento do racional é mitigado por
  redução por MDC, mas não há limite artificial de tamanho do ledger nesta
  fase. O Position Engine ainda precisa consumir os helpers sem materializar
  custo entre eventos.
