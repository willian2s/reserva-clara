# 005-02 — Definir contratos e invariantes

- **Ticker:** `005`
- **Número:** `02`
- **Status:** `pending`

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
