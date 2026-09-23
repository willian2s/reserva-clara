# 004-02 — Conectar Vercel e publicar preview

- **Ticker:** `004`
- **Número:** `02`
- **Status:** `completed`

## Objetivo e resultado esperado

Conectar o repositório a um único projeto Vercel e obter deployment acessível no
hostname Vercel antes de alterar DNS público. Registrar configuração efetiva,
branch, ambientes, deploy automático, previews, logs e rollback inicial.

## Requisitos cobertos

- Projeto único Vercel e framework Next.js.
- Branch `main` como produção.
- Framework detection, install/build/output defaults.
- Production, Preview e Development.
- Deploy Git, previews de branch/PR, logs e rollback.
- Ausência de `vercel.json` desnecessário.

## Escopo incluído

- Importar/conectar repositório existente no projeto Vercel autorizado.
- Confirmar que o projeto não cria segundo app ou repositório.
- Registrar valores efetivos exibidos pela Vercel, sem impor defaults
  artificialmente.
- Confirmar deployment inicial e URL `.vercel.app`.
- Confirmar que não há domínio customizado ativo antes do gate de DNS.
- Fazer checkpoint para aprovação humana antes de prosseguir.

## Escopo excluído

- Alteração Cloudflare, DNS, domínios oficiais ou Firebase.
- Environment variables com valores reais; isso é 004-03.
- Criação de `vercel.json`, workflow CI ou configuração customizada sem causa.
- Marcar produção saudável antes do redeploy com env e smoke da task 03.

## Dependências

- 004-01 concluída.
- Usuário com acesso ao repositório e à equipe/projeto Vercel.
- Decisão humana sobre nome do projeto e permissões, sem registrar token.

## Arquivos e símbolos prováveis

- `package.json`, `package-lock.json`, `next.config.ts` para detecção.
- Projeto Vercel, configurações Git/Environments/Domains/Deployments/Logs.
- `docs/tasks/004-production-deployment/004-02-*.md` para evidências não
  sensíveis.

## Passos de implementação

1. Humano autoriza integração do repositório com Vercel.
2. Criar ou selecionar um único projeto para `reserva-clara`.
3. Confirmar framework Next.js e root directory.
4. Manter install, build e output defaults salvo erro comprovado; registrar o
   valor efetivo e não criar `vercel.json`.
5. Definir `main` como Production Branch e confirmar comportamento de push/PR.
6. Criar deployment de validação sem apontar domínios oficiais.
7. Inspecionar build logs e status da deployment; registrar ID/URL pública, não
   tokens.
8. Confirmar procedimento de rollback para deployment anterior.

## Testes e comandos de validação

- Painel Vercel: projeto, framework, branch, environments e deployment.
- Abrir URL `.vercel.app` e verificar resposta básica da landing.
- Conferir build logs sem valores de env.
- Criar, se permitido, preview de branch/PR e confirmar URL gerada.
- Não considerar OAuth funcional sem task 03/05.

## Definição de pronto

- Repositório conectado a exatamente um projeto Vercel.
- `main` configurada como produção ou divergência justificada.
- Deployment Vercel acessível, com build saudável ou bloqueio registrado.
- Previews e auto-deploy documentados.
- Logs e rollback localizados.
- Nenhum domínio público ou DNS foi alterado.

## Riscos e cuidados

- Primeiro deploy pode ser Production por regra atual da Vercel; confirmar na
  documentação e no painel antes de expor domínio.
- Não colar token Vercel em task ou log.
- Um domínio pode já pertencer a outro projeto/equipe; não reassociar à força
  sem autorização humana e snapshot.
- Deployment sem Firebase env não prova login; não transformar essa limitação em
  correção de código.

## Evidências da execução

- **Data da execução:** 2026-09-23.
- **Checkpoint humano:** usuário informou que o projeto já está conectado à
  Vercel e que as configurações de ambiente foram cadastradas. Nenhum valor de
  environment variable foi solicitado, lido ou registrado. A configuração de
  environment variables pertence à 004-03 e não foi revalidada nesta task.
- **Deployment público:** `https://reserva-clara.vercel.app/` respondeu `200`
  via HTTPS com `server: Vercel`, conteúdo HTML `pt-BR`, `x-robots-tag:
  noindex, nofollow` e sem redirect. A resposta é evidência de disponibilidade
  do hostname Vercel, não de produção saudável nem de OAuth.
- **Smoke HTTP:** `/`, `/login` e `/dashboard` responderam `200`, sem redirect,
  no hostname Vercel. `/login` e `/dashboard` retornaram `x-robots-tag:
  noindex, nofollow`.
- **Código local:** `package.json` declara Next.js `16.3.5`; `next.config.ts`
  mantém configuração vazia tipada; `vercel.json` não existe nem está versionado.
- **Build Settings:** print do painel mostra Framework Preset `Next.js`, Root
  Directory `./`, e overrides desligados para Build Command, Output Directory,
  Install Command e Development Command; defaults Vercel permanecem efetivos.
- **Build Logs:** print mostra 66 linhas, duração de 36s, páginas estáticas,
  `ƒ Proxy (Middleware)`, `Build completed`, `Deployment completed` e cache
  criado. O painel exibe dois warnings; nenhum erro aparece no trecho capturado.
- **Deployment `.vercel.app` protegido:** URL informada foi
  `https://reserva-clara-loo9amz7d-willian-silvas-projects-de9e4638.vercel.app`.
  O print do deployment classifica a origem como `Production`/`main`; não há
  evidência específica de deployment criado a partir de branch/PR Preview.
  Requests HTTP para `/`, `/login` e `/dashboard` retornaram `302` para
  Vercel SSO/Deployment Protection. URL existe, mas conteúdo da aplicação não
  ficou publicamente acessível sem sessão; validação de proteção fica registrada
  para 004-08.
- **Gates locais:** `npm run lint`, `npm exec next typegen`, `npx tsc --noEmit`,
  `npm run build` e `git diff --check` passaram. Build gerou `/`, `/login`,
  `/dashboard` e `ƒ Proxy (Middleware)`.
- **Documentação oficial consultada em 2026-09-23:**
  [Git deployments](https://vercel.com/docs/git) confirma deploy automático por
  push/merge e previews por branch/PR; [Environments](https://vercel.com/docs/deployments/environments)
  confirma Local/Preview/Production e primeiro deploy como Production;
  [build logs](https://vercel.com/docs/deployments/logs) e
  [rollback](https://vercel.com/docs/deployments/rollback-production-deployment)
  registram localização e procedimento padrão.

## Limitações registradas

- Deployment `.vercel.app` está protegido por Vercel SSO; não confundir URL
  gerada com landing publicamente validada. 004-08 deve validar política de
  proteção, noindex e acesso autorizado sem ampliar Firebase Authorized Domains.
- Dois warnings aparecem no print de Build Logs; deployment concluiu com
  sucesso. Investigar somente se 004-08 ou smoke posterior demonstrar impacto.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-02-conectar-vercel-e-publicar-preview.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

Arquivos de evidência visual recebidos, não editados pelo agente:

- `docs/tasks/004-production-deployment/evidences/004-02-vercel-git.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-deply.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-domains.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-environments.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-rollback.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-build-settings.png`
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-build-log.png`

## Decisões e desvios

- Nenhum código, dependência, lockfile, environment variable, domínio público,
  DNS ou configuração Vercel foi alterado pelo agente.
- Não foi criado `vercel.json`.
- Painel classifica deployment como `Production`, `Ready`, origem `main`; Preview
  está configurado para branches não atribuídas, mas não há deployment Preview
  específico evidenciado.
- Painel expõe `Logs` e `Instant Rollback`; procedimento foi localizado, mas
  rollback não foi executado por não haver incidente.
- Task concluída no escopo de conexão/publicação inicial; validação pública de
  preview protegido foi encaminhada para 004-08.

## Comandos executados e resultados

- `git status --short --branch` — `main...origin/main`, sem alterações antes
  desta atualização.
- `git diff --check` — passou.
- `curl -sS -I --max-time 20 https://reserva-clara.vercel.app/` — `200`,
  resposta Vercel, `noindex`.
- `curl` sem seguir redirects para `/`, `/login` e `/dashboard` — `200` em
  todos; sem `Location`.
- `curl` sem seguir redirects para a URL de preview nos mesmos três paths —
  `302` para Vercel SSO/Deployment Protection em todos.
- `npm run lint` — passou.
- `npm exec next typegen` — passou.
- `npx tsc --noEmit` — passou.
- `npm run build` — passou.

## Riscos residuais

- Prints confirmam branch `main`, Production/Preview/Development, repositório
  `willian2s/reserva-clara`, domínio Vercel válido, deployment `Ready`, Build
  Settings, Build Logs e menu de `Instant Rollback`; rollback não foi executado
  por não haver incidente.
- Configuração declarada pelo usuário e deployment público não provam escopos
  de environment variables; isso permanece na 004-03.
- Preview exige sessão SSO para smoke da aplicação; sem teste de domínio
  customizado, DNS, TLS de produção ou OAuth. Itens permanecem nas tasks próprias.

## Evidências visuais recebidas

- `docs/tasks/004-production-deployment/evidences/004-02-vercel-git.png` —
  repositório `willian2s/reserva-clara` conectado; eventos de deployment e
  repository dispatch ativos.
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-environments.png` —
  Production rastreia `main`; Preview cobre branches Git não atribuídas e não
  possui domínio customizado; Development acessível via CLI; sem custom
  environments.
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-domains.png` —
  `reserva-clara.vercel.app` em Production com `Valid Configuration`.
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-deply.png` — deployment
  `Ready`, `Latest`, Production, origem `main`, commit `0bc325e` e controles
  `Logs`/`Visit`.
- `docs/tasks/004-production-deployment/evidences/004-02-vercel-rollback.png` — menu do
  deployment expõe `Instant Rollback`, `Promote` e `Inspect Deployment`.
