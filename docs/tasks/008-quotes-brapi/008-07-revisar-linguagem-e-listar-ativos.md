# 008-07 — Revisar linguagem e listar ativos

- **Ticker:** `008`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Remover termos técnicos expostos na interface e tornar o catálogo de ativos uma
lista escaneável, em vez de uma grade de widgets. Resultado: a pessoa entende
ativos, carteiras, operações e cotações sem conhecer nomes de domínio, campos
internos ou detalhes de implementação.

## Requisitos cobertos

- Experiência e acessibilidade dos critérios 20 e 23 da Spec 008.
- Consistência de linguagem dos padrões das fases 006 e 007.

## Escopo incluído

- Textos visíveis em `src/app` e `src/components` de autenticação, início,
  ativos, carteiras, transações e cotações.
- Substituição de `Asset`/`Assets`, `Dashboard`, `provider`, `ledger`,
  `append-only`, `archive` e outras expressões internas por linguagem clara em
  português, sem alterar símbolos TypeScript, rotas, contratos ou persistência.
- Ocultar `identityKey` e outros identificadores internos sem utilidade para a
  pessoa usuária; manter apenas informações necessárias para o uso do produto.
- Em cotações, preservar a transparência de `symbolChanged` com mensagem
  compreensível, sem exibir o nome `provider`.
- `src/components/asset/asset-catalog.tsx`: trocar a grade de cards por uma
  lista responsiva, mantendo identidade do ativo, cotação independente,
  loading, stale, indisponibilidade, retry, foco, teclado e leitura por
  tecnologia assistiva.

## Escopo excluído

- Renomear tipos, símbolos, campos Firestore, rotas, endpoints ou contratos de
  domínio.
- Alterar cálculo patrimonial, Transaction, Position, Quotes, autenticação,
  regras, persistência ou chamadas de rede.
- Redesign amplo fora da lista de ativos e da revisão textual.

## Dependências

- `008-05` concluída e revisada.
- `008-06` deve validar os gates e o smoke final após esta revisão.

## Arquivos e símbolos prováveis

- `src/app/(app)/(protected)/layout.tsx` e páginas de início.
- `src/components/auth/*`.
- `src/components/asset/asset-catalog.tsx`, `asset-create-form.tsx` e
  `asset-quote.tsx`.
- `src/components/portfolio/*`.
- `src/components/transaction/*`.
- `docs/tasks/008-quotes-brapi/008-00-overview.md` e esta subtarefa.

## Passos de implementação

1. Inventariar e substituir somente textos visíveis técnicos, preservando
   contratos e nomes de código.
2. Remover da tela o `identityKey` e revisar mensagens de moeda, sessão,
   arquivamento, histórico e correção de operações.
3. Transformar o catálogo de ativos em lista de uma coluna, com agrupamento
   semântico por ativo e cotação, sem esconder estados de Quotes.
4. Revisar labels, live regions, foco, teclado, mobile e contraste.
5. Confirmar que nenhuma lógica de Quote, ledger, autenticação ou domínio foi
   alterada.

## Testes e comandos de validação

- Inspeção de conteúdo visível para termos técnicos e identificadores internos.
- Inspeção estrutural para confirmar preservação de imports, rotas, contratos e
  chamadas de rede.
- Executar:

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Definição de pronto

- A UI usa linguagem consistente em português, sem expor nomes internos sem
  finalidade para a pessoa usuária.
- `/assets` apresenta ativos em lista responsiva, mantendo cotação, frescor,
  indisponibilidade e retry independentes.
- `identityKey`, `provider`, `ledger`, `append-only` e `archive` não aparecem
  como termos técnicos na interface.
- Nenhum contrato, símbolo de código, rota ou comportamento de negócio foi
  alterado.

## Riscos e cuidados

- Não traduzir identificadores de mercado como ETF, FII, BRL, USD ou B3 quando
  forem necessários para precisão; oferecer contexto em vez de inventar nomes.
- Não remover a indicação de cotação desatualizada nem transformar falha de
  Quotes em erro do catálogo.
- Não incluir `identityKey`, UID, token ou payload técnico em novos textos.

## Execução

- **Status:** `completed`.
- **Arquivos alterados:** `src/app/(app)/(protected)/layout.tsx`,
  `src/app/(app)/(protected)/dashboard/page.tsx`, `src/app/not-found.tsx`,
  `src/components/auth/auth-gate.tsx`, `src/components/auth/google-sign-in.tsx`,
  `src/components/asset/asset-catalog.tsx`,
  `src/components/asset/asset-create-form.tsx`,
  `src/components/asset/asset-quote.tsx`,
  `src/components/portfolio/portfolio-detail.tsx`,
  `src/components/portfolio/portfolio-list.tsx`,
  `src/components/portfolio/portfolio-settings.tsx`,
  `src/components/transaction/transaction-form.tsx` e
  `src/components/transaction/transaction-ledger.tsx`.
- **Decisões e desvios:** os nomes internos de código, rotas, contratos e
  persistência foram preservados; somente textos visíveis e a apresentação do
  catálogo foram ajustados. O `identityKey` deixou de ser exibido, mensagens
  técnicas foram traduzidas para português e os ativos passaram de cards em
  grade para uma lista responsiva. A cotação continua em componente separado,
  com loading, frescor, indisponibilidade e atualização manual preservados.
- **Comandos executados:** `npm run lint`, `npm exec next typegen`,
  `npx tsc --noEmit`, `npm run build`, `npm run test:domain`,
  `npm run test:quotes-adapter`, `npm run test:quotes-service`,
  `npm run test:quotes-route` e `git diff --check`.
- **Resultados e evidências:** lint, geração de tipos, TypeScript, build e diff
  check concluíram sem erros. Passaram 6 testes de domínio, 7 do adapter, 8 do
  serviço e 8 da rota. A inspeção de conteúdo não encontrou os termos técnicos
  removidos em textos visíveis de `src/app` e `src/components`; símbolos de
  domínio e imports internos permanecem somente no código.
- **Riscos residuais:** não há runner de UI nem smoke visual autenticado neste
  ambiente. A validação final de foco, viewport e fluxo autenticado permanece na
  008-06; não houve alteração no `.gitignore` preexistente nem chamada real à
  BRAPI.
