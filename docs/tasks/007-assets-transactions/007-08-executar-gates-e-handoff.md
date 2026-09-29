# 007-08 — Executar gates e handoff

- **Ticker:** `007`
- **Número:** `08`
- **Status:** `completed`

## Objetivo

Fechar fase 007 com evidência técnica, Rules, UX e documentação, sem avançar
automaticamente para 008 ou 009.

## Dependências

- 007-01 a 007-07 e 007-09 concluídas e revisadas.
- Revisão independente do diff e dos artefatos SDD disponível.
- Checkpoint humano para qualquer smoke produtivo.

## Escopo

- Executar Rules Emulator, lint, typegen, TypeScript, build e diff check na
  ordem documentada.
- Inspecionar imports, paths, schema, ausência de hard delete e ausência de
  dados/segredos pessoais.
- Validar manualmente archive/restore, Asset, buy/sell, erros, ownership,
  responsividade e acessibilidade em ambiente autorizado.
- Registrar comandos, contagens, evidências sanitizadas, riscos residuais e
  rollback de código/Rules.
- Atualizar spec, overview e subtarefa com status final e handoff explícito.

## Fora de escopo

- Começar fase seguinte, alterar roadmap, criar snapshots/positions ou fazer
  deploy sem aprovação humana.

## Critérios de aceite

- Todos os gates pertinentes passam ou falhas ficam explicitamente registradas.
- Overview chega a 9/9 somente se esta subtarefa e todas anteriores estiverem
  concluídas.
- Nenhuma subtarefa seguinte é iniciada automaticamente.
- Handoff para 008 preserva Asset como identidade e para 009 preserva ledger
  como fonte da verdade.

## Arquivos prováveis

- este arquivo e `007-00-overview.md`
- `docs/specs/007-assets-transactions.md`
- evidências sanitizadas sob `docs/tasks/007-assets-transactions/evidences/`,
  se realmente necessárias

## Validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Registro de execução

### Arquivos alterados

- `src/components/transaction/transaction-form.tsx` — máscara decimal preserva
  sinal negativo para rejeição explícita pelo domínio e aceita as 18 casas
  fracionárias previstas no contrato.
- `docs/specs/007-assets-transactions.md` — status da fase e restrições
  operacionais dos handoffs 008/009.
- `docs/tasks/007-assets-transactions/007-00-overview.md` — observação do
  checkpoint manual; checklist foi concluído em 9/9.
- este arquivo — execução, evidências, riscos e handoff.

### Decisões e desvios

- A subtarefa foi selecionada explicitamente pelo caminho informado pelo usuário;
  as dependências 007-01 a 007-07 e 007-09 estavam concluídas e revisadas.
- O comando documentado de Rules foi executado literalmente. Neste Linux,
  `/usr/libexec/java_home` não existe; a atribuição de `JAVA_HOME` emitiu esse
  aviso, mas o `npm run test:rules` executou normalmente com o Java disponível.
- A revisão independente encontrou uma falha de alta prioridade na máscara da
  UI (sinal negativo descartado e 18ª casa truncada). A menor correção coerente
  foi aplicada e os gates de lint/typegen/TypeScript/build/diff foram repetidos.
- O agente não executou browser nesta sessão, mas o usuário confirmou que o
  smoke manual autenticado em ambiente autorizado funciona como esperado. Esse
  checkpoint humano foi aceito como evidência sanitizada; nenhum dado pessoal,
  UID, token ou patrimônio foi registrado.
- O handoff para 008 preserva Asset como identidade: provider fica fora do Asset,
  a identidade não muda e preço não usa `number`. O handoff para 009 preserva
  Transaction como ledger fonte da verdade: posições derivam de
  `Transaction + Asset + Quotes`, sem Position mutável autoritativo.

### Comandos, resultados e evidências

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
npm run test:domain
```

- Rules Emulator: **13 testes aprovados, 0 falhas**; cobriu ownership,
  isolamento, schema/identity/registry de Asset, referências, archive gate,
  append-only, caminhos futuros e taxa V2. As mensagens `PERMISSION_DENIED`
  pertencem aos casos negativos esperados.
- Lint: passou sem erros ou warnings.
- Next typegen: concluído com sucesso.
- TypeScript strict: passou sem erros.
- Build de produção: passou; confirmou `/assets` e
  `/portfolios/[portfolioId]/transactions` no App Router e o Proxy.
- `git diff --check`: passou sem erros.
- Testes de domínio: **5 testes aprovados, 0 falhas**.
- Inspeção estrutural: nenhum `deletePortfolio` em `src`, nenhuma Rule `allow
  delete` em `firestore.rules` e nenhum import de `collection`, `doc`, `query` ou
  `runTransaction` nos componentes Asset/Transaction.
- Inspeção de documentação: spec, overview e 9 subtarefas usam ticker `007`; o
  overview contém uma única seção `## Checklist` com exatamente 9 itens; não
  foram encontrados segredos, tokens, UIDs ou patrimônio nas evidências.
- Validação manual de archive/restore, catálogo, buy/sell, taxa, refresh,
  backfill, venda inválida, cross-user, teclado e viewport: **confirmada pelo
  usuário** em ambiente autorizado, sem evidência sensível registrada.

### Riscos residuais e rollback

- O ledger completo continua sendo lido em carteiras grandes; aggregate/snapshot
  permanece handoff posterior e não foi introduzido.
- Rules não agregam o ledger; um `sell` schema-válido via SDK direto continua
  sendo o risco deliberado documentado na spec.
- Não há runner automatizado de UI; a cobertura de browser depende do checkpoint
  humano e de ambiente autorizado.
- Não houve deploy, seed, Console ou operação produtiva. Rollback de código usa
  o commit/deployment anterior; rollback de Rules usa o arquivo anterior. Isso
  não remove nem restaura dados.

### Handoff

- **Estado:** concluído após smoke manual autenticado confirmado pelo usuário e
  revisão independente do diff/artefatos SDD.
- **008 — Quotes/BRAPI:** pode adicionar mapeamento de provider fora de Asset,
  sem alterar `identityKey` e sem converter preço para floating point.
- **009 — Positions/Allocation:** deve derivar posições do ledger de
  `Transaction + Asset + Quotes`; não deve criar Position mutável como fonte da
  verdade.
