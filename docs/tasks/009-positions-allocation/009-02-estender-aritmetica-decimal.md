# 009-02 — Estender aritmética decimal

- **Ticker:** `009`
- **Número:** `02`
- **Status:** `pending`

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
- Possível helper interno de cálculo no próprio módulo, sem exportar abstração
  genérica desnecessária.
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
