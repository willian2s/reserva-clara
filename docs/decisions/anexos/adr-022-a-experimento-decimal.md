# ADR 022 — Anexo A: experimento de representação decimal em Go

- **Status:** proposta de experimento; **não executado**
- **Vinculado a:** [ADR 022 §3](../022-backend-go-substitui-dotnet.md#3-precisão-decimal-em-go-trechos-net-da-adr-011)
  e [ADR 011](../011-precisao-decimal-e-representacao.md)
- **Execução prevista:** fases 015/016. Este anexo não cria task.

## Objetivo

Cumprir o experimento obrigatório da ADR 011 / `relational-model.md` em Go,
antes de aceitar a representação proposta: `math/big` no Domain, `text` +
`CHECK` no PostgreSQL e string canônica no HTTP.

## Contexto técnico

- **Materialização TS** (`src/domain/decimal-reducer.ts`, `materialize`): 18
  casas, metade arredondada para longe do zero, sem `-0`.
- **`big.Rat.FloatString(18)`:** arredonda da mesma forma, mas devolve
  `-0.000000000000000000` para valores negativos que arredondam para zero
  (verificado localmente com Go 1.27.2). O formatter precisa normalizar.
- **`pgtype.Numeric`** (`pgx/v5`): `{Int *big.Int, Exp int32, NaN,
  InfinityModifier, Valid}`; é o padrão do `sqlc` para `numeric`.
- **`numeric(48,18)`:** o PostgreSQL arredonda para a escala do typmod valores
  com mais de 18 casas e devolve texto preenchido até 18 casas.

## Ambiente

- PostgreSQL local real (Docker Compose), mesma major do projeto Supabase.
- Schema descartável criado por migration goose; queries `sqlc`.
- `pgx/v5` em dois modos: `QueryExecModeCacheStatement` (padrão, binário) e
  `QueryExecModeSimpleProtocol` (texto).
- Uma rodada no Supabase dev via Session pooler.
- Registrar versões de Go, `pgx`, `sqlc`, `goose` e PostgreSQL, além do commit.
- Tabela de teste com uma coluna `text` + `CHECK` (candidata) e uma
  `numeric(48,18)` (alternativa), gravadas com o mesmo valor.

`CHECK` candidato: `^(0|[1-9][0-9]{0,29})(\.[0-9]{0,17}[1-9])?$`, mais `<> '0'`
onde o valor deve ser positivo.

## Oráculo

Conforme a ADR 022 §3.4, os resultados esperados de aritmética, materialização e
reducer vêm de fixtures geradas a partir do reducer TS atual e congeladas no
repositório. Os casos de gramática (1–5) também alimentam o contrato permanente
de fixtures do parser, válido para o parser TS e o parser Go.

## Casos

| # | Caso | Esperado |
| --- | --- | --- |
| 1 | 30 inteiros + 18 fracionários | parser Go aceita; `text` volta byte a byte; `numeric` volta com o mesmo `Int`/`Exp` e, após canonicalização, a mesma string |
| 2 | 30 + 19 fracionários | parser Go e `CHECK` rejeitam; `numeric` **arredonda** (evidência contra `numeric` autoritativo) |
| 3 | 31 inteiros | rejeitado pelo parser e pelo `CHECK`; `numeric` dá overflow |
| 4 | `0`, `0.1`, fee nula, fee `0` | `0` só onde o domínio permite; fee `0` → `NULL`; quantity `0` rejeitada |
| 5 | `1.0`, `01`, `.5`, `1.`, `+1`, `-0`, `1e3`, `1/3`, `0x10`, `1_000`, espaços, dígitos não ASCII | rejeitados pelo parser Go e pelo `CHECK` |
| 6 | soma/subtração nos limites, inclusive resultado com mais de 30 inteiros | igual ao oráculo; divergência exige decisão registrada |
| 7 | materialização de `1/3`, `2/3`, `5e-19`, `-5e-19`, `15e-19`, `-1e-19` | igual ao oráculo, inclusive `-1e-19` → `0` |
| 8 | reducer/custo médio com fixtures buy/sell | posições e custos byte-iguais ao oráculo |
| 9 | JSON: decimal como number, string não canônica, string válida | `400`, `400`, aceito; resposta sempre canônica |
| 10 | fuzz `parse(format(x)) == x` e `format(parse(s)) == s` | sem divergência no orçamento de fuzz definido |
| 11 | lint | `forbidigo`/`depguard` falham ao introduzir `float64`, `ParseFloat`, `big.Float` ou `shopspring` no Domain |

## Aceite

- Zero divergência nos casos 1, 4–11.
- Os casos 2–3 documentam o comportamento do PostgreSQL.
- O resultado é registrado com versões, ambiente e commit.

Sem esse resultado, a representação da ADR 022 §3.1 não é aceita, nenhuma
coluna muda para `numeric` e nenhum conversor é tratado como lossless.
