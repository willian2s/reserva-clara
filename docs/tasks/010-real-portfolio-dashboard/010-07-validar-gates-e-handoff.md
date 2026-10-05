# 010-07 — Validar gates e handoff

- **Ticker:** `010`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Fechar a fase 010 com evidência dos testes, gates técnicos, smoke funcional,
boundaries preservados e handoff explícito para planejamento, histórico, FX,
trusted boundary e performance.

## Requisitos cobertos

- Critérios 47–50 e todos os invariantes/boundaries da spec 010.
- Checkpoints, rollout, rollback, riscos residuais e handoffs.

## Escopo incluído

- Executar testes novos de summary/read-side e regressões existentes.
- Executar Rules Emulator mesmo sem mudança de Rules.
- Executar lint, typegen, TypeScript, build e diff check.
- Fazer smoke manual estruturado dos dois dashboards.
- Inspecionar imports client/server, bundle, schema, Rules, índices e secrets.
- Confirmar ausência de logs com dados financeiros e persistência derivada.
- Registrar resultados concretos e atualizar spec/overview após evidência.

## Escopo excluído

- Deploy, smoke produtivo, seed, migration, Console ou mudança de Rules.
- Corrigir problemas criando cache persistido, FX ou funcionalidade de fase
  posterior.
- Marcar conclusão sem testes e smoke executados.

## Dependências

- 010-01 a 010-06 concluídas e revisadas.
- Java compatível para Firestore Emulator.
- Environment local somente se o smoke autenticado exigir; nunca versionar
  `.env.local` nem registrar seus valores.

## Arquivos e símbolos prováveis

- `docs/specs/010-real-portfolio-dashboard.md`.
- `docs/tasks/010-real-portfolio-dashboard/010-00-overview.md` e subtarefas.
- `tests/dashboard-read.test.mjs`, testes de Position/Quotes/Rules.
- `package.json`, scripts novos e módulos `src/data/positions/*`.
- componentes/rotas dos dashboards para inspeção final.

## Passos de implementação/validação

1. Executar testes novos e regressões com fixtures sintéticas.
2. Executar Rules Emulator e gates técnicos na ordem documentada.
3. Fazer smoke da matriz de empty/complete/partial/stale/error/archive/refresh.
4. Validar teclado, foco, anúncios, zoom 200%, 320 px e desktop.
5. Inspecionar que componentes não recalculam valores e client não importa
   Admin SDK, BRAPI server adapter ou segredo.
6. Confirmar nenhuma coleção/index/migration/Rule/secret/dependência pesada.
7. Confirmar que arquivadas ficam fora do global e unavailable nunca vira zero.
8. Registrar comandos, resultados, desvios e riscos residuais sanitizados.
9. Atualizar checklist para `7/7` e status `completed` somente com evidência.

## Testes e comandos de validação

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run test:dashboard-read
npm run test:quotes-adapter
npm run test:quotes-service
npm run test:quotes-route
npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

## Definição de pronto

- Testes novos, regressões e gates passam ou têm bloqueio concreto registrado.
- Smoke dos dois dashboards cobre os estados e viewport definidos.
- Ledger, Quotes, archive, auth e Rules permanecem compatíveis.
- Não há persistência derivada, FX, target, histórico ou segredo no client.
- Overview possui exatamente sete itens `[x]` e progresso `7/7` somente após a
  conclusão real das sete subtarefas.
- Handoff e riscos residuais para 011/012/017/020/021 estão registrados.

## Riscos e cuidados

- Não registrar UID, token, patrimônio, quantidade, preço ou payload de ledger.
- Não tratar build como teste de acessibilidade/interação.
- Não tratar AuthGate como autorização ou testes de domínio como prova de Rules.
- Se custo de leitura bloquear, encaminhar para 021 sem persistir atalho.
- Se documentação Next local continuar ausente, registrar o fato e não inferir
  APIs novas sem verificar a versão instalada por fonte confiável.

## Registro de execução

- **Status:** `completed`
- **Arquivos alterados:** este arquivo,
  `docs/specs/010-real-portfolio-dashboard.md`,
  `docs/tasks/010-real-portfolio-dashboard/010-00-overview.md`,
  `docs/tasks/010-real-portfolio-dashboard/010-05-entregar-dashboard-da-carteira.md`,
  `src/app/(app)/(protected)/layout.tsx`,
  `src/components/dashboard/global-dashboard.tsx`,
  `src/components/portfolio/portfolio-detail.tsx` e
  `src/components/transaction/transaction-ledger.tsx`. Nenhum arquivo de
  Rules, schema, índice, migration, secret ou persistência foi alterado.
- **Decisões e desvios:** os testes automatizados e gates técnicos foram
  executados com fixtures sintéticas e sem registrar dados financeiros. A
  tentativa de smoke HTTP iniciou o servidor de desenvolvimento e confirmou
  `200` em `/login`, `/dashboard` e `/portfolios/synthetic`; as duas rotas
  protegidas renderizaram apenas o estado de verificação de sessão quando
  acessadas sem autenticação. Posteriormente, o smoke manual foi confirmado
  pelo usuário nos modos autenticado e anônimo, cobrindo os dois dashboards,
  estados empty/complete/partial/stale/error/archive/refresh, teclado, foco,
  zoom 200%, 320 px e desktop, sem registro de dados financeiros sensíveis.
- **Correção aplicada após a inspeção:** o detalhe agora segue o cabeçalho de
  conteúdo usado nas demais telas, sem repetir o nome da carteira em um card.
  Carteiras ativas exibem sempre `Cadastrar posição`, tanto com quanto sem
  posições abertas, no topo da carteira e acima das métricas/tabela, apontando
  para o formulário de novo lançamento; o histórico permanece separado e
  carteiras arquivadas não recebem CTA de cadastro. O alvo
  `#novo-lancamento` faz scroll e foco explícitos depois que as leituras
  assíncronas terminam, e o nome da carteira quebra corretamente em telas
  estreitas.
- **Correção adicional de layout:** o botão `Atualizar dados` deixou de ser
  injetado condicionalmente no header global do shell, que alterava a geometria
  da navegação somente em `/dashboard` e no detalhe da carteira. Ele agora fica
  dentro do header de conteúdo de cada dashboard, mantendo o shell idêntico em
  todo o restante do sistema.
- **Simplificação do dashboard global:** removidos os cards redundantes de
  quantidade de carteiras e posições abertas e o bloco recolhível de cobertura
  de cotações/indisponibilidades. A quantidade de carteiras ativas agora fica no
  cabeçalho de `Distribuição das carteiras`; cobertura e ativos indisponíveis
  continuam apresentados diretamente, sem o bloco `Detalhes das cotações`, e a
  quantidade de posições fica no header do resumo de posições.
- **Ajuste complementar:** as tabelas de posições renderizadas no dashboard
  global também ocultam `Detalhes das cotações`; o diagnóstico continua
  disponível no detalhe individual da carteira.
- **Copy ajustada:** o rótulo de apresentação passou a ser `Valor investido`,
  mantendo na descrição o significado de custo de aquisição remanescente.
- **Comandos executados:** `npm run test:domain`, `npm run test:positions`,
  `npm run test:positions-read`, `npm run test:dashboard-read`,
  `npm run test:financial-presentation`, `npm run test:quotes-adapter`,
  `npm run test:quotes-service`, `npm run test:quotes-route`, `npm run
  test:rules`, `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`,
  `npm run build`, `git diff --check`, `java -version` e smoke local com
  `npm run dev -- --hostname 127.0.0.1` seguido de requisições HTTP às três
  rotas. Também foram inspecionados os imports client/server, chunks client
  gerados, `firebase.json`, `.gitignore`, paths Firestore e logs da aplicação.
- **Resultados e evidências:** domínio `14/14`; Position `4/4`; Positions
  read-side `9/9`; dashboard read-side `8/8`; apresentação financeira `6/6`;
  Quotes adapter `7/7`; Quotes service `8/8`; Quotes route `8/8`; Rules
  Emulator `19/19` com OpenJDK `21.0.12.1`. Lint, typegen, TypeScript, build
  Next.js `16.3.5` e `git diff --check` passaram. O scan dos chunks client não
  encontrou `firebase-admin`, `firebase-adminsdk`, BRAPI, `QuoteService`,
  `FIREBASE_PRIVATE_KEY` ou secrets; o arquivo local de credenciais é ignorado
  e não é tracked. `firebase.json` referencia somente `firestore.rules`, não há
  `firestore.indexes.json`, migration ou coleção derivada de Position/summary,
  e não foram encontrados `console.*` em `src`. A revisão independente
  confirmou ticker/checklist/dependências, boundaries e testes. A segunda revisão
  independente do ajuste visual confirmou o escopo e os CTAs, e levou à correção
   do scroll/foco após carregamento assíncrono e da quebra do título em 320 px.
  O smoke manual autenticado e anônimo foi confirmado como aprovado pelo
  usuário na matriz completa de estados, interação e viewports descrita acima.
- **Handoff:** 011 deve criar target allocation separado da Allocation corrente;
  012 deve tratar snapshots como histórico versionado, sem usar Quote/refresh
  como snapshot; 017 deve introduzir conversão explícita para posições fora da
  moeda-base; 020 continua responsável pelo trusted write boundary; 021 deve
  tratar a releitura integral de ledgers como oportunidade de read model/performance.
- **Riscos residuais:** não há bloqueio residual identificado nesta subtarefa.
  Rules Emulator continua sendo evidência complementar, não substituto do
  smoke manual, que foi executado e confirmado nos modos autenticado e anônimo.
