# 005-02 — Definir contratos e invariantes

- **Ticker:** `005`
- **Número:** `02`
- **Status:** `completed`

## Objetivo

Implementar os tipos de domínio mínimos de Portfolio e value objects de precisão,
deixando Asset/Transaction futuros compatíveis sem construir suas features.

## Resultado esperado

Contratos TypeScript sem dependência de React/Firestore para domínio, com
invariantes testáveis e documentação de campos persistidos.

## Requisitos cobertos

- Portfolio mínimo e múltiplas carteiras;
- representação de dinheiro, preço, quantidade, basis points e datas;
- IDs por document ID;
- Transactions como ledger futuro e posições/snapshots como derivados.

## Escopo incluído

- `Portfolio`, `CreatePortfolioInput` e `UpdatePortfolioInput`;
- `CurrencyCode` V1 e base `BRL`;
- `MoneyMinor`, `DecimalString`, `UnitPrice`, `BasisPoints` e data civil;
- limites de nome, inteiros seguros, decimal sem expoente e datas reais;
- tipos/uniões futuras documentais para Asset/Transaction sem persistência;
- erros de domínio explícitos.

## Escopo excluído

- cálculo de posição, preço médio, FX, quote, rentabilidade ou alocação;
- biblioteca decimal externa sem caso concreto;
- tipos Firestore vazando para componentes/UI;
- CRUD visual ou criação automática de carteira.

## Dependências

- 005-01 concluída;
- TypeScript strict e aliases atuais;
- nenhum Firestore real necessário.

## Arquivos e símbolos prováveis

- `src/domain/portfolio.ts`;
- `src/domain/value-objects.ts`;
- possivelmente `src/domain/transaction.ts` e `src/domain/asset.ts` somente se
  contratos futuros forem necessários;
- `tsconfig.json` e `src/types/`, se a organização atual exigir.

## Passos de implementação futura

1. Definir tipos de domínio sem importar SDK Firebase.
2. Implementar parsers/constructors puros para valores canônicos.
3. Exigir `BRL` no Portfolio V1 e impedir campos financeiros extras.
4. Documentar tipos Transaction iniciais (`buy`, `sell`, `contribution`,
   `withdrawal`) e extensões futuras sem abrir enum incompatível.
5. Escrever testes unitários mínimos apenas se mecanismo de teste já aprovado;
   caso contrário, cobrir invariantes no parser da subtarefa 04.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
```

Validar exemplos fictícios: BRL 12345, quantidade `"0.125"`, percentual 1250,
datas válidas/inválidas, expoente/float/overflow rejeitados.

## Definição de pronto

- domínio compila em strict mode;
- Portfolio não aceita campos não previstos no input;
- dinheiro não usa decimal `number` persistido;
- decimal/percentual/data têm invariantes explícitos;
- contratos futuros não implicam collections/features em 005;
- testes/gates passam sem tocar Firebase.

## Riscos e cuidados

- Não converter string decimal para `number` durante normalização.
- Não confundir base currency com moeda/preço de Asset.
- Não fixar ticker ou ativo pessoal como exemplo de domínio.
- Antes de mudar precisão, revisar impacto em Rules e fases 007/009.

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** contratos puros de Portfolio, inputs fechados, ID de
  documento, erros explícitos e value objects para moeda ISO, dinheiro em
  minor units, decimais canônicos, preço unitário, quantidade, basis points,
  data civil e instantes.
- **Contratos futuros:** Asset e Transaction foram documentados como tipos, com
  Transaction limitada ao ledger inicial (`buy`, `sell`, `contribution`,
  `withdrawal`) e sem persistência, Rules ou cálculo derivado.
- **Validação runtime:** smoke compilado temporariamente com `tsc` e executado
  com Node para BRL `12345`, USD, quantidade `"0.125"`, basis points `1250`,
  data bissexta válida, expoente/float/overflow/data inválida, moeda inválida,
  quantidade zero, BRL obrigatório e campo extra rejeitados.
- **Comandos executados:** `npm run lint`; `npm exec next typegen`; `npx tsc
  --noEmit`; `npm run build`; `git diff --check`; compilação isolada de
  `src/domain/*.ts` e smoke Node temporário.
- **Resultados:** todos os gates passaram; build Next.js 16.3.5 gerou as rotas
  existentes; nenhum Firebase/Firestore foi inicializado ou acessado.
- **Testes unitários:** não adicionados, pois repositório não possui runner
  aprovado; invariantes foram cobertas pelo smoke do parser e ficam prontas para
  os testes de parser da subtarefa 005-04.

## Arquivos alterados

- `src/domain/errors.ts`
- `src/domain/value-objects.ts`
- `src/domain/portfolio.ts`
- `src/domain/asset.ts`
- `src/domain/transaction.ts`
- `src/domain/index.ts`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-02-definir-contratos-e-invariantes.md`

## Decisões e desvios

- `CurrencyCode` valida códigos ISO 4217 conhecidos e não fica limitado a BRL,
  enquanto `BaseCurrencyCode` mantém Portfolio V1 fixo em BRL; isso preserva
  compatibilidade futura de moeda de Asset/preço sem abrir FX.
- Quantidade e preço unitário exigem decimal positivo; MoneyMinor exige inteiro
  seguro não negativo, e valores de contribuição/retirada exigem minor units
  positivas. Nenhum valor decimal é convertido para `number`.
- `createdAt`/`updatedAt` usam `Date` no domínio; conversão para Firestore
  Timestamp fica exclusivamente na subtarefa 005-04.

## Riscos residuais e bloqueios

- A lista ISO 4217 é mantida localmente e deverá ser revisada se o contrato de
  moedas crescer; não há FX, arredondamento ou cálculo financeiro nesta fase.
- Persistência, parser de DTO Firestore, Rules e testes Emulator continuam nas
  subtarefas seguintes.
