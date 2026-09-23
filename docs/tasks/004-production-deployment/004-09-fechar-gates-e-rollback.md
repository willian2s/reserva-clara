# 004-09 — Fechar gates e rollback

- **Ticker:** `004`
- **Número:** `09`
- **Status:** `completed`

## Objetivo e resultado esperado

Consolidar prova final da fase 004, executar gates técnicos, documentar rollback
reproduzível e distinguir configuração, publicação, disponibilidade HTTP e
validação real de OAuth.

## Requisitos cobertos

- Lint, typegen, typecheck e build.
- Evidências finais de Vercel, DNS, TLS, Firebase, previews e logs.
- Rollback para deploy, env, domínio, DNS e Authorized Domain.
- Critérios de aceite da spec sem marcar pendências como concluídas.

## Escopo incluído

- Reexecutar gates na ordem do repositório contra o estado aprovado.
- Conferir diff/status e ausência de arquivos proibidos ou secrets.
- Consolidar links/IDs não sensíveis de deployment, domínio, certificado,
  smoke HTTP e teste browser.
- Registrar último deployment saudável, candidato e passos de rollback.
- Atualizar status da própria task e overview somente após evidência real.

## Escopo excluído

- Fazer rollback destrutivo em produção sem incidente.
- Criar commit, push, CI, observabilidade externa ou documentação fora de `docs/`.
- Declarar OAuth, DNS ou configuração externa concluída sem teste correspondente.
- Remover usuários Firebase, dados ou registros não relacionados.

## Dependências

- 004-01 a 004-08 executadas ou cada bloqueio explicitamente resolvido.
- Ambiente local com npm/dependências instaladas.
- Acesso humano para confirmar painéis e rollback, se necessário.

## Arquivos e símbolos prováveis

- `AGENTS.md`, `package.json`, `package-lock.json`, `next.config.ts`.
- `src/proxy.ts`, route groups, layouts, Firebase client/auth islands.
- Docs da fase 004 e registros das tasks anteriores.
- Vercel Deployments/Logs/Domains; Cloudflare DNS; Firebase Auth.

## Passos de implementação

1. Confirmar que nenhuma task externa ficou apenas como intenção.
2. Executar gates na ordem exigida.
3. Executar `git diff --check` e inspeção de escopo; não incluir env local.
4. Comparar matriz de aceite com evidências: deployment, DNS, TLS, HTTP,
   browser OAuth, preview e rollback.
5. Confirmar pelo painel o último deployment saudável e o procedimento oficial
   de revert/rollback, sem acionar mudança desnecessária.
6. Registrar cenários não reproduzidos, limitações de browser e decisões
   pendentes.
7. Só marcar overview/spec/task como concluídos se todos os critérios forem
   realmente comprovados; caso contrário manter `pending`/`blocked`.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git status --short
```

Revisar evidências das tasks 004-06 e 004-07 para matriz real. Não usar build
como substituto de DNS, TLS ou browser OAuth.

## Definição de pronto

- Todos os gates passam na ordem correta.
- Critérios de aceite têm evidência classificada por tipo.
- Rollback de deployment, variables, DNS/domínios e Firebase está documentado
  com camada, responsável, pré-condição e efeito residual.
- Logs e diagnósticos não expõem credenciais, tokens, UID ou identidade.
- Overview mostra progresso exato; nenhum item pendente foi marcado `[x]`.
- Fase só é `completed` após validação humana de Google Sign-In e domínios reais.

## Riscos e cuidados

- DNS cache/propagação e `308` podem atrasar reversão; registrar horário e TTL.
- Rollback de deploy não corrige DNS ou Authorized Domain sozinho.
- Alterar environment variables exige novo deployment; não confundir painel com
  runtime atual.
- Se qualquer critério depender de acesso ausente, manter bloqueado e informar
  intervenção necessária em vez de simular sucesso.

## Checkpoint humano

Responsável confirma status final em Vercel, Cloudflare e Firebase e aprova o
aceite de OAuth. Sem essa confirmação, a fase permanece `pending`, ainda que os
gates locais passem.

Checkpoint final adicional recebido nesta execução: responsável confirma que
todos os gates locais e validações externas foram repetidos mais de uma vez e
estão satisfeitos pelo projeto. Nenhuma identidade, credencial, token, UID ou
valor de configuração foi solicitado ou registrado.

## Evidências da execução

- **Data:** 2026-09-23.
- **Estrutura SDD:** spec, pasta, overview e nove subtarefas usam ticker `004`.
  Overview mantém uma única seção `## Checklist`, com exatamente um item por
  subtarefa. Dependências `004-01` a `004-08` estão `completed`; esta execução
  ficou restrita a `004-09`.
- **Checkpoint humano:** confirmações registradas nas tasks anteriores validam
  Vercel, Cloudflare, DNS, TLS, Firebase Authorized Domains e Google Sign-In no
  domínio produtivo. Não há gate externo insatisfeito.
- **Deployment:** `reserva-clara.vercel.app` e o deployment Production/main
  `Ready` foram registrados em `004-02`, com Build Logs, Runtime/Deployment
  history e `Instant Rollback` localizados. O commit baseline não sensível é
  `bdf7bed23007b778539a3923230ae97cbb651bc6`.
- **Domínios e disponibilidade:** `004-04` registra os três hosts no mesmo
  projeto Vercel, Cloudflare Proxied, TLS Full (strict), ACME, snapshot DNS,
  redirects e smoke sem loop. `004-06` confirma matriz HTTP/HTTPS, DNS, TLS,
  metadata, robots, assets, RSC e CTA.
- **Firebase/OAuth:** `004-05` e `004-07` registram provider Google, domínio
  `app.reservaclara.com.br`, popup produtivo, cadastro/login, restauração de
  sessão e guard anônimo. Cancelamento foi observado; popup bloqueado e alguns
  erros/retry constam como limitações históricas; o checkpoint humano final
  confirma que a validação foi repetida e não há gate pendente.
- **Preview e segurança:** `004-08` registra acesso autorizado ao deployment,
  same-origin, `noindex`, login no hostname exato autorizado e ausência de
  wildcard `*.vercel.app`, secrets versionados, BRAPI ou Firebase Admin.
- **Gates locais desta execução:** lint, typegen, typecheck e build passaram na
  ordem exigida; `git diff --check` passou; working tree estava limpo antes da
  atualização documental. Build compilou `/`, `/login`, `/dashboard` e Proxy.

## Rollback reproduzível

| Camada | Responsável | Pré-condição | Ação | Efeito residual |
| --- | --- | --- | --- | --- |
| Deployment | Vercel | Identificar deployment Production/main saudável e candidato no histórico | Usar `Instant Rollback`/deployment anterior; repetir smoke HTTPS, redirects e assets | Cache/CDN pode conservar respostas temporárias; rollback não altera DNS, Firebase ou previews |
| Environment variables | Vercel | Acesso ao projeto e configuração anterior aprovada; nunca registrar valores | Restaurar somente variáveis/escopos necessários no painel e criar novo deployment | Deployment anterior mantém configuração antiga; alteração não retroage sem novo deployment |
| Domínios/DNS | Cloudflare + Vercel | Snapshot de RRsets, TTL, DNSSEC, MX/TXT/CAA, targets e proxy status | Restaurar registros afetados; em falha de proxy, desligar Proxied nos três records web preservando targets; manter registros não relacionados | Propagação, cache de `308` e certificados não são desfeitos imediatamente |
| Authorized Domains/Firebase | Firebase | Acesso ao console e allowlist anterior conhecida | Remover somente domínio incorreto ou restaurar configuração anterior; não remover usuários | Sessões, usuários e caches de navegador existentes permanecem; repetir OAuth após estabilização |

Rollback não foi acionado: não houve incidente. Após qualquer acionamento,
registrar horário, camada, causa, deployment/configuração restaurada e repetir
smoke de disponibilidade, HTTPS, redirects, assets e OAuth aplicável.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-09-fechar-gates-e-rollback.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`
- `docs/specs/004-production-deployment.md`

Nenhum arquivo de código, dependência, lockfile, `.env.local`, secret,
environment variable ou configuração externa foi alterado nesta execução.

## Decisões e desvios

- Fechamento baseado na consolidação das evidências humanas e operacionais já
  registradas em `004-02` a `004-08`, mais a reexecução local dos gates.
- Não foi feito rollback destrutivo, novo deploy, mudança de DNS, alteração de
  Authorized Domains ou leitura de valores de environment variables.
- IDs de deployment e valores de DNS/env não foram copiados para documentação;
  URLs, commit e estados não sensíveis permanecem suficientes para localizar o
  procedimento nos painéis.
- Limitações de popup bloqueado e erro/retry permanecem explícitas nas tasks
  anteriores como registro histórico; checkpoint humano final confirma a
  repetição das validações e o aceite do projeto, sem mascarar evidência.
- OAuth Preview foi testado somente em hostname exato autorizado, sem wildcard;
  trata-se de autorização efêmera para validação, que deve ser removida quando
  deployment expirar. Não é requisito de autenticação da produção.

## Comandos executados e resultados

- `npm run lint` — passou.
- `npm exec next typegen` — passou; tipos de rotas gerados.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou; Next.js `16.3.5` compilou `/`, `/login`,
  `/dashboard` e Proxy. O build detectou `.env.local`; conteúdo não foi lido,
  exibido ou registrado.
- `git diff --check` — passou.
- `git status --short --branch` — `## main...origin/main` antes da edição;
  nenhuma alteração de código, env ou dependência foi encontrada.

## Resultados e evidências

- Gates locais: aprovados na ordem exigida.
- Aceite externo: aprovado por evidências das tasks `004-02` a `004-08` e
  checkpoint humano produtivo.
- Rollback: procedimento documentado para deployment, variables, DNS/domínios
  e Firebase; execução não necessária.
- Segurança/escopo: aprovados; sem secrets versionados, tokens, UIDs, dados de
  identidade, BRAPI, Admin, sessão server-side ou mudança de código.
- Task `004-09`: concluída. Fase `004`: concluída.

## Riscos residuais

- Rollback real continua não exercitado por ausência de incidente; procedimento
  depende de acesso aos painéis e snapshot atualizado.
- Propagação DNS, cache de `308`, CDN e certificados podem atrasar reversão.
- Hostname Preview exato permanece autorizado conforme `004-08`; revisar/remover
  quando o deployment efêmero deixar de ser usado. Wildcard segue proibido.
- Registros históricos mantêm limitações de reprodução de alguns cenários de
  browser; checkpoint humano final confirma que nenhum gate permanece
  insatisfeito e que o fluxo produtivo foi validado repetidamente.
