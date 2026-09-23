# 005-04 — Criar converters e validação runtime

- **Ticker:** `005`
- **Número:** `04`
- **Status:** `pending`

## Objetivo

Separar DTO Firestore de domínio e rejeitar documentos ausentes, corrompidos ou
incompatíveis antes que cheguem a componentes React.

## Resultado esperado

Converter de Portfolio, parser explícito e erros sanitizados cobrindo schema,
document ID, Timestamp e value objects.

## Requisitos cobertos

- runtime validation;
- `FirestoreDataConverter` sem confiança cega em TypeScript;
- timestamps server-side;
- ausência de fallback silencioso e de logs com patrimônio.

## Escopo incluído

- DTO persistido com `name`, `baseCurrency`, `createdAt`, `updatedAt`;
- `toFirestore` para inputs aprovados, incluindo server timestamp quando
  aplicável;
- `fromFirestore` com parser de keys, tipos, limites e ID;
- conversão Timestamp → instant de domínio;
- erros `InvalidFirestoreDocument`/equivalente sem dados sensíveis;
- testes de documento válido, campo extra, campo faltante e tipo inválido.

## Escopo excluído

- converter de Transaction/Asset/Snapshot;
- Zod ou biblioteca externa sem justificativa;
- recuperação automática, coerção de string/número ou defaults;
- queries, Rules ou UI.

## Dependências

- 005-02 contratos;
- 005-03 instância `db`;
- Firestore real não necessário; emulator pode vir em 005-07.

## Arquivos e símbolos prováveis

- `src/data/firestore/converters/portfolio-converter.ts`;
- `src/data/firestore/parsers/portfolio-parser.ts` ou módulo equivalente;
- `src/domain/portfolio.ts` e `src/domain/value-objects.ts`;
- `Timestamp`, `FirestoreDataConverter`, `DocumentSnapshot` do SDK.

## Passos de implementação futura

1. Definir DTO e lista fechada de keys permitidas.
2. Implementar parser puro que falha com erro sanitizado.
3. Encapsular parser em `FirestoreDataConverter`.
4. Mapear document ID separadamente de fields.
5. Confirmar tratamento de `serverTimestamp` em writes e leitura resolvida.
6. Comparar parser com schema que será validado nas Rules.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
```

Executar testes de parser com fixtures fictícias; documento inválido nunca deve
produzir Portfolio parcial.

## Definição de pronto

- converter não mascara tipo inválido;
- parser rejeita keys extras/missing, moeda diferente de BRL e Timestamp
  incorreto;
- document ID é preservado como `id` de domínio;
- nenhum valor de fixture contém dado pessoal;
- contrato parser/Rules está documentado para 005-06.

## Riscos e cuidados

- `FirestoreDataConverter` é tipagem/serialização, não validação completa.
- Não usar `as Portfolio` sem parser.
- Não logar documento inteiro em erro.
- Testar comportamento real de server timestamp no emulator antes de relaxar
  invariantes.
