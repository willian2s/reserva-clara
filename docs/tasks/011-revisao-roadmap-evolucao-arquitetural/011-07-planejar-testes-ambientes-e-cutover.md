# 011-07 — Planejar testes, ambientes, deploy e cutover

- **Ticker:** `011`
- **Número:** `07`
- **Status:** `pending`

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
