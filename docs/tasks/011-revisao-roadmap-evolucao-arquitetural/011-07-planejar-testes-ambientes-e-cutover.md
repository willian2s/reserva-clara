# 011-07 — Planejar testes, ambientes, deploy e cutover

- **Ticker:** `011`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Consolidar uma estratégia operacional que valide cada slice, prepare ambientes
independentes e execute a migração sem big-bang. O resultado deve conter gates,
evidências, runbooks e rollback realista.

## Requisitos cobertos

- Testes frontend, backend, banco e E2E como requisito de primeira classe.
- Ambientes local/test/staging/prod e Firebase por ambiente.
- Frontend/API deployáveis independentemente da Vercel.
- CI/CD, previews, CORS, domínios, observabilidade, backup e restore.
- Migração incremental, rehearsals, write fence, reconciliação e soak.

## Escopo

### Incluído

- Pirâmide/matriz de testes por fase e comandos alvo.
- PostgreSQL real para integração e concorrência.
- Pipeline CI, artefatos e migration job.
- Topologia lógica de ambientes sem escolher fornecedor prematuramente.
- Checkpoints C0–C11, go/no-go, cutover e rollback.
- SLO/telemetria/runbooks mínimos e sanitização.

### Excluído

- Configurar CI, hosting, Supabase, Firebase ou DNS.
- Escolher vendor final sem levantamento de requisitos/custo.
- Executar export, rehearsal ou deploy.

## Dependências

- 011-03, 011-04, 011-05 e 011-06.

## Arquivos e símbolos prováveis

- Leitura: scripts/testes atuais, package scripts, deploy docs 003/004,
  `.env.example`, `firebase.json` e artefatos anteriores da 011.
- Saída provável: `docs/architecture/011/quality-environments-cutover.md`.

## Passos de implementação

1. Criar matriz requisito → nível de teste → ambiente → evidência.
2. Definir harness de golden master TS/C# e contract tests.
3. Definir component/E2E e acessibilidade por slice.
4. Definir PostgreSQL de integração, migration/restore/lock tests.
5. Definir pipelines frontend/API/migration e compatibilidade de release.
6. Definir dev/test/staging/prod, secrets, CORS e Firebase por ambiente.
7. Definir observabilidade, redaction, SLO e alertas mínimos.
8. Detalhar rehearsals, pre-copy, freeze/fence, read-only e enable-writes.
9. Definir rollback antes e depois do point of no return.
10. Executar tabletop de falhas e revisar gates C0–C11.

## Testes e comandos de validação

- Tabletop: token provider falha, BRAPI falha, migration falha, reconciliação
  diverge, DNS falha e write após point of no return.
- Revisão de cada critério de aceite das fases 013–021 contra uma evidência.
- Verificação de que compilar não é o único gate de nenhuma slice.
- Checklist de backup/restore, RTO/RPO e secret rotation.
- `git diff --check`.

## Definição de pronto

- Cada fase tem estratégia de teste e evidência observável.
- Ambientes e deploy não dependem de recurso exclusivo Vercel.
- Migration job, backups, restore e secrets têm responsáveis.
- Cutover mantém uma autoridade por owner e proíbe dual-write/tabela parcial.
- Rollback pós-write PostgreSQL não promete retorno ao Firestore.

## Riscos e cuidados

- Preview não pode acessar dados produtivos por conveniência.
- Cache/processo não deve ser reportado como proteção global de quota.
- Logs de migration/telemetria não podem conter payload financeiro.
- Não adiar CI/E2E/observabilidade para a 020.

## Registro da execução

### Status

`completed`

A estratégia operacional foi consolidada sem configurar CI, hosting, Firebase,
PostgreSQL, migration, DNS ou deploy. O artefato separa evidência já disponível
no checkout de gates futuros, para não confundir baseline histórica com prova da
arquitetura alvo.

### Arquivos alterados

- `docs/architecture/011/quality-environments-cutover.md` — matriz de testes,
  harness de compatibilidade, PostgreSQL, pipelines, ambientes, observabilidade,
  runbooks, C0–C11, rehearsal, cutover e rollback.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-07-planejar-testes-ambientes-e-cutover.md` — status e registro desta execução.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md` — checklist e progresso da fase.

Nenhum arquivo de produção, banco, migration, deploy, segredo, configuração
externa ou dependência foi alterado.

### Decisões e desvios

- A matriz requisito → nível → ambiente → evidência foi organizada por fase
  013–021 e inclui unit/property/application/contract/component/integration/E2E
  e gates operacionais proporcionais ao risco.
- O baseline atual foi descrito com precisão: há scripts `node:test`, mas não há
  runner/framework agregado, CI, component/E2E, PostgreSQL ou migration. Os
  comandos futuros aparecem como alvo e não como execução concluída.
- O harness TS↔C# preserva decimal como string, timestamps em
  `seconds`/`nanoseconds`, IDs opacos, moedas, erros e idempotência, sem
  congelar contratos antes da 012.
- Ambientes local/test/staging/prod e previews foram definidos por isolamento,
  Firebase, CORS, secrets e política de dados, sem escolher fornecedor de
  hosting prematuramente.
- SLO, RTO, RPO, retenção, soak, quota e limiares finais permanecem calibráveis
  na 020; foram registrados alvos iniciais apenas para tornar o gate observável.
- O rollback foi separado antes/depois do primeiro write PostgreSQL; depois do
  point of no return não há promessa de reabrir Firestore.
- Desvio controlado: nenhum runbook executável ou workflow foi criado porque a
  subtarefa é exclusivamente de planejamento e a spec exclui configuração.

### Comandos executados e resultados

- `functions.glob`/`functions.read` — passaram na conferência da spec, overview,
  oito subtarefas, `AGENTS.md`, ticker `011`, checklist único e dependências
  concluídas.
- Revisão read-only por agente `explore` — passou; confirmou scripts atuais,
  testes, `firebase.json`, `.env.example`, lacunas de CI/PostgreSQL/E2E e
  restrições dos documentos de deploy 003/004.
- `npm run test:domain` — passou, 14 testes.
- `npm run test:positions` — passou, 4 testes.
- `npm run test:positions-read` — passou, 9 testes.
- `npm run test:dashboard-read` — passou, 8 testes.
- `npm run test:financial-presentation` — passou, 6 testes.
- `npm run test:quotes-adapter` — passou, 7 testes.
- `npm run test:quotes-service` — passou, 8 testes.
- `npm run test:quotes-route` — passou, 8 testes.
- `npm run test:rules` — passou, 19 testes no Firestore Emulator; mensagens
  `PERMISSION_DENIED` são os casos negativos esperados.
- `npm run lint` — passou.
- `npm exec next typegen && npx tsc --noEmit` — passou; typegen e typecheck sem
  erros.
- `npm run build` — passou; Next.js 16.3.5 compilou as rotas atuais.
- `git diff --check` — passou após a documentação final.
- Tabletop documental — passou; os cenários de token provider, BRAPI,
  migration, reconciliação, DNS/CORS/TLS, write pós-PONR, pool/lock e secret
  rotation receberam decisão, owner por papel e evidência esperada. Não houve
  injeção real, pois configuração e execução externa estão fora do escopo.
- Revisão independente `review` — **APROVADO** após correções; confirmou
  coerência dos resultados, owners explícitos na matriz/gates, tabletop
  documental e runbooks acionáveis.
- Validação documental — passou; a saída cobre testes, ambientes, pipeline,
  observabilidade, SLO/runbooks, C0–C11, rehearsal, fence, cutover e rollback,
  distinguindo baseline executada de gates futuros.

### Resultados e evidências

- `docs/architecture/011/quality-environments-cutover.md` contém a matriz
  requisito → teste → ambiente → evidência para as fases 013–021.
- Os testes atuais e seus limites estão discriminados; a estratégia exige
  PostgreSQL real, locks, pooling, restore, contract/component/E2E e a11y onde
  aplicável.
- Frontend, API e migration job têm pipelines independentes, artefatos,
  compatibilidade N/N-1 e proibição de migration no startup.
- A topologia lógica separa local/test/staging/prod, Firebase por ambiente,
  CORS allowlist, secrets server-side, previews isolados e backend como único
  acesso ao PostgreSQL/BRAPI.
- Sinais, redaction, SLO inicial, alertas e dez runbooks operacionais foram
  registrados, incluindo falha de token, BRAPI, migration, restore, DNS/TLS e
  write pós-PONR.
- C0–C11, dois rehearsals mínimos, sequência de freeze/fence/read-only/first
  write e rollback honesto estão ligados a evidências e bloqueios de avanço.

### Riscos residuais

- Não existe ainda CI/CD, API .NET, PostgreSQL, migrador, E2E React/Vite,
  component runner ou observabilidade implementada; são gates das fases
  posteriores, não lacunas ocultadas por este documento.
- SLO/RTO/RPO, retenção, duração do soak, rate limits, quota BRAPI, RLS,
  hosting e estratégia global/cohort dependem de volumetria, custo e testes
  reais na 013–020.
- O Firebase Emulator atual cobre somente Firestore; Auth por ambiente, CORS e
  integração API exigem configuração futura e isolamento comprovado.
- O risco histórico de `SELL` acima do saldo permanece permitido somente no
  escopo C0 de dev/testes sintéticos, até a boundary confiável e C6.

### Handoff

- `011-08` deve revisar este artefato contra as quinze ADRs, gates, roadmap e
  handoff, sem marcar decisões abertas como aceitas.
- `013` recebe a matriz de pipelines e ambientes; `014–016` recebem os gates de
  auth, golden master e PostgreSQL; `017–019` recebem a exigência de E2E/a11y e
  telemetria por slice.
- `020` deve fechar os valores operacionais, executar os rehearsals e registrar
  go/no-go; `021` só remove legado após soak, restore e zero tráfego antigo.
