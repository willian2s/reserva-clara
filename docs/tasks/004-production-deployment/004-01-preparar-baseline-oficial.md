# 004-01 — Preparar baseline oficial

- **Ticker:** `004`
- **Número:** `01`
- **Status:** `completed`

## Objetivo e resultado esperado

Confirmar que checkout, branch, código, gates e documentação oficial estão
prontos para iniciar rollout sem alterar código ou serviços. Entregar baseline
reproduzível, lista de evidências esperadas e bloqueios explícitos.

## Requisitos cobertos

- Estado atual da `main` e conclusão das fases 001–003.
- Contrato `src/proxy.ts`, route groups, metadata e Firebase client.
- Gates locais na ordem do `AGENTS.md`.
- Confirmação oficial atual de Next.js, Vercel, Firebase e Cloudflare.
- Snapshot não secreto necessário para rollback.

## Escopo incluído

- Confirmar `git status`, branch, commit e ausência de mudanças não revisadas.
- Reinspecionar `.env.example`, `.gitignore`, `next.config.ts`, `package.json`,
  `src/proxy.ts`, route groups e auth client.
- Verificar se `node_modules/next/dist/docs/` está disponível; se não estiver,
  registrar a limitação sem instalar dependências nesta task.
- Consultar documentação oficial atual e registrar URL/data, sem congelar
  targets DNS ou comportamento não confirmado.
- Executar gates locais e registrar resultado sem expor env.
- Capturar somente estado público/não sensível que será necessário no rollback.

## Escopo excluído

- Login em Git/Vercel, mudança em Cloudflare/DNS/Firebase ou deploy.
- Alteração em `src/`, `public/`, dependências, lockfile, `.env.local` ou
  `next.config.ts`.
- Solicitação ou registro de secrets, tokens, valores Firebase ou credenciais.

## Dependências

- `main` revisada e fases anteriores concluídas.
- Node/npm e dependências já instaladas para os gates.
- Acesso de leitura à documentação oficial atual.

## Arquivos e símbolos prováveis

- `AGENTS.md`, `package.json`, `package-lock.json`.
- `src/proxy.ts`, `src/app/layout.tsx`, `src/app/(marketing)/*`,
  `src/app/(app)/*`.
- `src/lib/firebase/client.ts`, `.env.example`, `.gitignore`,
  `next.config.ts`.
- `docs/specs/004-production-deployment.md` e esta task para evidências.

## Passos de implementação

1. Registrar branch, commit e `git status` sem incluir conteúdo sensível.
2. Confirmar que `src/proxy.ts` continua único dono de host routing e que o
   dashboard segue não sensível.
3. Confirmar nomes das sete variáveis e que `.env*` permanece ignorado.
4. Ler documentação local do Next se existir; caso contrário, registrar ausência
   e usar somente contratos já documentados e referência oficial atual.
5. Consultar docs atuais de Vercel domains/environments/logs, Firebase Google
   Sign-In/Authorized Domains e Cloudflare DNS/proxy/TLS.
6. Executar lint, typegen, typecheck e build na ordem do repositório.
7. Registrar pontos de checkpoint humano e critérios de parada para tasks 02–05.

## Testes e comandos de validação

```bash
git status --short --branch
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Verificar que comandos não alteraram `package.json`, lockfile, `src/`, `public/`
ou env local. Não registrar saída que contenha valores de ambiente.

## Definição de pronto

- Baseline de branch/commit/working tree registrado.
- Código e contratos 003 conferidos sem alteração.
- Documentação oficial consultada com URLs e data.
- Os quatro gates passam na ordem correta, ou bloqueio concreto fica registrado.
- Snapshot de rollback não contém credenciais.
- Nenhuma configuração externa foi alterada.

## Riscos e cuidados

- Documentação local do Next pode continuar ausente; não preencher lacunas com
  memória nem instalar dependências fora do escopo.
- Build local não prova OAuth, DNS, TLS ou comportamento da Vercel.
- Não marcar task como concluída se working tree divergir sem explicação.
- Se docs atuais conflitarem com o contrato 003, parar antes do deploy e abrir
  revisão da spec/decision.

## Evidências da execução

- **Data da execução:** 2026-09-23.
- **Estrutura SDD:** spec, pasta, overview e nove subtarefas usam ticker `004`.
  Overview contém uma única seção `## Checklist`, com um item para cada
  subtarefa. Esta execução ficou restrita a `004-01`.
- **Fases anteriores:** overviews `001-00`, `002-00` e `003-00` estão em
  `completed`, respectivamente `4/4`, `9/9` e `8/8`; spec `003` também está
  `completed`.
- **Git baseline:** branch `main`, alinhada a `origin/main`; HEAD
  `bdf7bed23007b778539a3923230ae97cbb651bc6` (`docs(sdd): planejar deploy de
  produção`); working tree estava limpo antes desta atualização. O SHA difere
  do valor histórico registrado no contexto da spec (`bddcfcd`), por isso o
  baseline atual foi registrado sem tratar o valor antigo como vigente.
- **Node/npm/dependências:** Node `v24.20.0`, npm `11.19.0`, Next instalado
  `16.3.5`. `.env.local` e `node_modules` existem somente como ignorados; nenhum
  valor foi lido ou registrado.
- **Next local:** `node_modules/next/dist/docs/` ausente. Nenhuma dependência foi
  instalada. A referência pública atual de Proxy consultada confirma
  `proxy.ts`, matcher estático e possibilidade de resposta/redirect; a de
  Metadata confirma exports em Server Components.
- **Contrato 003:** `src/proxy.ts` continua único dono de classificação de host,
  redirects e `X-Robots-Tag`; route groups seguem organizacionais/metadata;
  landing não importa Firebase; Firebase permanece browser-only; `DashboardGate`
  segue guard de UX e dashboard não sensível; `next.config.ts` permanece sem
  redirects/headers customizados.
- **Environment:** `.env.example` contém exatamente as sete variáveis
  `NEXT_PUBLIC_FIREBASE_*`; `.gitignore` ignora `.env*` e preserva somente
  `.env.example`. Nenhum secret, token ou valor de ambiente foi exposto.
- **Snapshot público para rollback:** lookup DNS em 2026-09-23 observou apex
  com respostas A/AAAA atualmente servidas por endereços Cloudflare, TTL
  observado de `300`; `www` respondeu com os mesmos A e TTL; `app` não retornou
  A/CNAME. Isso é fotografia pública, não target recomendado nem decisão de
  proxy status; snapshot completo de MX/TXT/CAA/DNSSEC permanece pendente de
  acesso ao painel Cloudflare na task 004-04. Qualquer alteração DNS permanece
  bloqueada até esse snapshot registrar RRsets, TTL, DNSSEC, proxy status,
  timestamp e fonte de consulta.

## Documentação oficial consultada

Consultada em 2026-09-23. URLs e conclusões, sem congelar valores de plataforma:

- Next.js Proxy: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
  — `proxy.ts` é convenção vigente em Next 16; matcher limita interceptação e
  Proxy pode redirecionar, responder e definir headers.
- Next.js Metadata: <https://nextjs.org/docs/app/api-reference/functions/generate-metadata>
  — metadata estática pertence a `layout`/`page` Server Components e é resolvida
  pelo App Router.
- Vercel domains: <https://vercel.com/docs/domains/working-with-domains> e
  <https://vercel.com/docs/domains/set-up-custom-domain> — domínio é associado
  em Settings → Domains; `inspect` fornece records efetivos por projeto; SSL é
  provisionado após verificação; DNS externo deve ser alterado no provedor
  externo.
- Vercel environments/Git: <https://vercel.com/docs/deployments/environments> e
  <https://vercel.com/docs/git> — Local/Preview/Production são ambientes
  padrão; branches fora da produção geram previews; `main` é default quando
  existe; primeiro deployment de projeto novo é Production.
- Vercel variables/logs/rollback:
  <https://vercel.com/docs/environment-variables>,
  <https://vercel.com/docs/deployments/logs>,
  <https://vercel.com/docs/logs/runtime> e
  <https://vercel.com/docs/deployments/rollback-production-deployment> —
  alteração de env só afeta novos deployments; build/runtime logs são
  consultáveis na plataforma; rollback aponta tráfego para deployment anterior
  sem rebuild e possui status verificável.
- Firebase Google Web Sign-In:
  <https://firebase.google.com/docs/auth/web/google-signin> e
  <https://firebase.google.com/docs/auth/web/redirect-best-practices> —
  `signInWithPopup` é fluxo documentado e erros devem ser tratados; `authDomain`
  customizado e domínio autorizado exigem configuração explícita, não inferência.
- Cloudflare DNS/TLS:
  <https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/>
  e <https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/> —
  criação deve preservar tipo, TTL e proxy status; modos TLS controlam conexões
  visitante/Cloudflare/origem e Cloudflare recomenda Full ou Full (strict).
  Nenhuma escolha de proxy/TLS foi aplicada nesta task.

## Gates executados

Executados na ordem exigida por `AGENTS.md`:

1. `npm run lint` — passou, ESLint sem saída de erro.
2. `npm exec next typegen` — passou, `Types generated successfully`.
3. `npx tsc --noEmit` — passou, sem saída de erro.
4. `npm run build` — passou; Next `16.3.5`, rotas `/`, `/login`, `/dashboard`
   e `ƒ Proxy (Middleware)` geradas.
5. `git diff --check` — passou.

Após os gates, `git status --short --branch` mostrou somente alterações de
documentação desta subtarefa e do overview; nenhum arquivo de `src/`, `public/`,
package, lockfile ou env local foi alterado.

## Checkpoints e critérios de parada para 004-02–004-05

- **004-02:** checkpoint humano para conectar exatamente um projeto Vercel;
  parar sem acesso Git/Vercel ou se houver segundo projeto/domínio já atribuído.
- **004-03:** checkpoint humano para confirmar projeto Firebase correto e
  cadastrar somente nomes/escopos; nunca registrar valores; novo deployment
  obrigatório após env.
- **004-04:** antes de DNS, capturar snapshot de MX/TXT/CAA/DNSSEC, verificar
  targets exibidos pelo projeto Vercel e modo Cloudflare; parar diante de
  conflito de `Host`, TLS, redirect ou registro não relacionado. Alteração DNS
  fica bloqueada até snapshot completo com RRsets, TTL, DNSSEC, proxy status,
  timestamp e fonte.
- **004-05:** checkpoint humano no Firebase Console para provider Google e
  Authorized Domains; não usar wildcard `.vercel.app`; parar em
  `auth/unauthorized-domain` ou conflito de `authDomain`.

## Arquivos alterados

- `docs/tasks/004-production-deployment/004-01-preparar-baseline-oficial.md`
- `docs/tasks/004-production-deployment/004-00-overview.md`

## Decisões e desvios

- Nenhum código, serviço, dependência, lockfile ou configuração externa foi
  alterado.
- O SHA atual substitui somente a expectativa histórica da spec para fins de
  baseline; divergência foi registrada, sem reescrever a spec.
- O resultado é baseline local/documental concluído, não confirmação de deploy,
  DNS, TLS, OAuth, Vercel, Cloudflare ou Firebase em produção.

## Riscos residuais

- Projeto Vercel, deployment, domínio, TLS, env remoto, provider Google e
  Authorized Domains ainda exigem intervenção humana nas subtarefas seguintes.
- `app.reservaclara.com.br` não possui resposta pública A/CNAME observada no
  snapshot; não assumir disponibilidade antes de 004-04.
- Build local não prova comportamento de edge, DNS, certificado, logs remotos ou
  Google Sign-In em origem produtiva.
