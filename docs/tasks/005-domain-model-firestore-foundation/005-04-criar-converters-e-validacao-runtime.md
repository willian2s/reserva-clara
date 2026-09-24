# 005-04 — Criar converters e validação runtime

- **Ticker:** `005`
- **Número:** `04`
- **Status:** `completed`

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

## Execução e evidências

- **Data:** 2026-09-24.
- **Implementado:** `InvalidFirestoreDocumentError`, parser de Portfolio com
  lista fechada de campos, validação de document ID, tipos, limites, moeda BRL e
  `Timestamp`; `Timestamp` resolvido é convertido para `Date` de domínio.
- **Converter:** `portfolioConverter` valida leituras via parser e serializa
  domínio para DTO Firestore. `createPortfolioFirestoreData` e
  `updatePortfolioFirestoreData` validam inputs e usam `serverTimestamp()` nos
  campos técnicos aplicáveis; writes parciais passam pelo converter com
  `merge`/`mergeFields`, sem exigir ID ou timestamps resolvidos. Writes de
  substituição (`merge: false`) continuam exigindo todos os campos persistidos.
- **Snapshot:** `SnapshotOptions` é propagado ao `snapshot.data()` antes do
  parser, preservando política explícita para server timestamps pendentes.
- **Falhas cobertas:** documento ausente, objeto inválido, campo extra ou
  ausente, tipo incorreto, moeda diferente de BRL, ID inválido e Timestamp
  inválido geram erro sanitizado sem incluir valores do documento.
- **Smoke runtime:** fixtures sintéticas cobriram documento válido, rejeições
  acima, preservação de ID, conversão Timestamp/Date, mapeadores de create/update
  com server timestamp, write parcial via converter, rejeição de overwrite
  incompleto e propagação de options. Nenhum dado pessoal foi usado.
- **Comandos executados:** `npm run lint`; `npm exec next typegen`; `npx tsc
  --noEmit`; `npm run build`; smoke temporário compilado com `tsc` e executado
  com Node; `git diff --check`.
- **Resultados:** todos os gates passaram; build Next.js 16.3.5 compilou e
  gerou `/`, `/dashboard`, `/login` e `/_not-found`; lint terminou sem erros ou
  warnings.

## Arquivos alterados

- `src/data/firestore/errors.ts`
- `src/data/firestore/parsers/portfolio-parser.ts`
- `src/data/firestore/converters/portfolio-converter.ts`
- `docs/tasks/005-domain-model-firestore-foundation/005-00-overview.md`
- `docs/tasks/005-domain-model-firestore-foundation/005-04-criar-converters-e-validacao-runtime.md`

## Decisões e desvios

- Parser permanece separado do `FirestoreDataConverter`; a tipagem do SDK não é
  tratada como validação runtime.
- Conversão de um `Portfolio` completo preserva `Timestamp`; writes de create e
  update usam mapeadores explícitos com server timestamps e `merge`, evitando
  confundir sentinel pendente com timestamp resolvido de leitura.
- Nenhuma dependência, Rule, query, UI ou configuração de emulator foi criada.

## Riscos residuais e bloqueios

- Sem Emulator Suite nesta subtarefa, comportamento de server timestamp e schema
  equivalente nas Rules aguardam 005-06/005-07.
- `fromFirestore` recebe snapshots existentes por contrato do SDK; ausência é
  rejeitada pelo parser de snapshot antes de produzir Portfolio.
