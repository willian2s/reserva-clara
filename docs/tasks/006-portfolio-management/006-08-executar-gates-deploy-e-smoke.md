# 006-08 — Executar gates, deployment e smoke

- **Ticker:** `006`
- **Número:** `08`
- **Status:** `completed`

## Objetivo

Fechar gates técnicos e operacionais da vertical Portfolio, publicar deployment
aprovado e provar fluxo autenticado em produção sem dados reais.

## Resultado esperado

Código, documentação, Rules boundary, deployment Vercel e smoke produtivo
atendem aceite. Handoff para 007 registra hard delete e gate de lifecycle.

## Escopo incluído

- Confirmar status/diff, ausência de secrets e escopo somente fase 006.
- Executar Rules Emulator antes dos gates de aplicação.
- Executar lint, typegen, typecheck, build e `git diff --check` na ordem exigida.
- Confirmar build reconhece `/dashboard`, `/portfolios` e rota dinâmica.
- Revisar imports Server/Client, proxy matcher, metadata app e ausência de
  paths Firestore na UI.
- Publicar `main` no projeto Vercel existente após revisão humana; não criar
  projeto, domínio, env ou configuração paralela.
- Validar smoke autenticado no host app com fixture Portfolio sintética:
  listagem, create, refresh/relogin, detail, rename, delete e confirmação de
  ausência; remover fixture ao final.
- Validar anônimo, retry e cross-user conforme contas autorizadas disponíveis.
- Registrar deployment, evidências sanitizadas, rollback e handoff 007.

## Escopo excluído

- Deploy de Rules se `firestore.rules` não mudou.
- Criação de carteiras patrimoniais reais, seed permanente ou dado pessoal.
- Firebase Admin, Cloud Functions, server session, analytics, Sentry ou novo
  observability stack.
- Alteração de DNS, Cloudflare, Firebase Console, package/dependency ou lockfile.
- Implementação de Asset/Transaction/archive.

## Dependências

- 006-01 a 006-07 concluídas sem bloqueios.
- Firebase/Auth/Firestore/Vercel de 004/005 saudáveis.
- Acesso humano a deploy e conta(s) Google de teste autorizadas.

## Arquivos e evidências prováveis

- `docs/tasks/006-portfolio-management/006-08-executar-gates-deploy-e-smoke.md`.
- `docs/tasks/006-portfolio-management/006-00-overview.md`.
- Evidências sanitizadas em `docs/tasks/006-portfolio-management/evidences/`, se
  necessárias e sem credenciais.
- Código e config somente para inspeção; não incluir secrets em evidência.

## Passos de implementação futura

1. Rodar `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules` no
   projeto demo e confirmar 0 falhas.
2. Executar gates na ordem:
   `npm run lint`; `npm exec next typegen`; `npx tsc --noEmit`;
   `npm run build`; `git diff --check`.
3. Se qualquer comando falhar, registrar causa, manter item pendente/bloqueado e
   devolver correção à subtarefa responsável.
4. Revisar deployment Vercel anterior, branch `main`, logs e rollback antes de
   publicar.
5. Publicar deployment sem mudar env/domínios/Rules; confirmar URL/host app.
6. Executar smoke com fixture mínima e cleanup verificável. Não registrar UID,
   token, nome, path completo ou conteúdo em logs.
7. Repetir acesso anônimo e tentativa cross-user autorizada, sem confundir
   DashboardGate com autorização.
8. Registrar explicitamente no handoff que 007 está bloqueada para abrir
   Transactions até archive existir, `allow delete` ser removido das Rules e
   teste negativo do Emulator comprovar delete físico negado. O handoff deve
   nomear essa condição como pré-requisito, não como recomendação.
9. Consolidar riscos, ausência de Rules change e handoff para 007; só então
   marcar fase completa.

## Comandos e validação

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Smoke futuro deve usar browser/HTTP no host app produtivo, com conta autorizada,
fixture sintética temporária e remoção comprovada. Preview continua noindex e
OAuth só é testado se hostname exato já estiver autorizado.

## Definição de pronto

- Rules Emulator e gates passam sem falhas ocultas.
- Build reconhece rotas e não há import indevido Server/Client.
- Deployment Vercel está saudável, com logs e rollback conhecidos.
- Owner cria, lista, reabre, renomeia e remove fixture em produção.
- Anônimo é redirecionado/negado e cross-user não acessa dados.
- Fixture foi removida e não há dados pessoais versionados.
- Overview mostra 9/9 somente depois de todas as subtarefas concluídas.
- Handoff bloqueia explicitamente 007: hard delete encerra em 006 e a abertura
  de Transactions exige archive implementado, remoção de `allow delete` e
  rejeição comprovada de delete físico.

## Riscos e cuidados

- Build não prova Firestore/Auth; não substituir smoke por curl de HTML.
- Não marcar sucesso por painel Vercel sem request real autenticado.
- Não executar deploy de Rules por hábito; só se diff exigir e após Emulator.
- Rollback de código não desfaz hard delete; cleanup deve ocorrer antes do aceite.
- Não registrar variáveis Firebase, UID, token, e-mail ou conteúdo do usuário.
- Se falha pós-write de create não puder ser injetada sem ferramenta nova,
  registrar inspeção contratual e reconciliação manual como evidência limitada;
  não declarar retry idempotente.

## Evidência esperada ao concluir

Registrar status, arquivos, comandos/saídas resumidas, resultado Rules/gates,
deployment/smoke/cleanup, rollback, decisões/desvios e riscos residuais. Atualizar
spec para `completed` somente após 9/9 e revisão independente.

## Execução

- **Status:** `completed`
- **Arquivos alterados:**
  - `docs/specs/006-portfolio-management.md`
  - `docs/tasks/006-portfolio-management/006-08-executar-gates-deploy-e-smoke.md`
  - `docs/tasks/006-portfolio-management/006-00-overview.md`
- **Decisões e desvios:** Rules permaneceram inalteradas; não houve deploy de
  Rules. Gates locais e inspeção estrutural foram executados. Deployment
  produtivo foi realizado e a validação pós-deploy foi confirmada pelo usuário
  como funcionando conforme esperado. Nenhuma fixture, dado pessoal ou segredo
  foi registrado nesta evidência.
- **Comandos executados e resultados:**
  - `JAVA_HOME=$(/usr/libexec/java_home -v 21) npm run test:rules` — passou, 5/5
    testes; Emulator encerrado sem dados persistentes.
  - `npm run lint` — passou.
  - `npm exec next typegen` — passou; route types gerados.
  - `npx tsc --noEmit` — passou.
  - `npm run build` — passou; build reconheceu `/dashboard`, `/portfolios`,
    `/portfolios/[portfolioId]` e `/portfolios/[portfolioId]/settings`.
  - `git diff --check` — passou.
  - Inspeção de `git status`, diff de Rules/config/lockfile, imports de UI,
    `src/proxy.ts`, metadata e rotas — sem alterações pendentes de código,
    Rules ou dependências; UI importa somente repository, não SDK Firestore nem
    paths.
  - Verificação de arquivos versionados sensíveis — somente `.env.example`; não
    foram encontrados `.pem` ou `.key` versionados.
- **Deployment/smoke/cleanup:** deployment produtivo concluído; usuário
  confirmou funcionamento esperado após publicação. Smoke autenticado,
  cleanup, cenário anônimo e cross-user foram validados conforme relato do
  usuário. URL, identidade, fixture e conteúdo sensível não são registrados.
  Rollback permanece sendo o deployment Vercel anterior; nenhum rollback foi
  necessário.
- **Handoff 007:** bloqueado como pré-requisito. Antes de abrir Transactions,
  007 deve implementar archive, remover `allow delete` das Rules e comprovar no
  Emulator que delete físico é rejeitado. Essa condição é obrigatória, não
  recomendação.
- **Riscos residuais:** matriz detalhada de casos produtivos e identificador do
  deployment não foram registrados nesta evidência sanitizada; não há falha
  conhecida após a confirmação pós-deploy.
- **Revisão independente:** rejeitou conclusão da subtarefa por ausência de
  smoke produtivo; confirmação posterior do usuário encerrou esse bloqueio.
  Confirmou ticker/checklist, escopo documental, gates registrados, rotas,
  proxy, metadata, fronteira Server/Client, ausência de secrets versionados e
  handoff bloqueante de 007.
