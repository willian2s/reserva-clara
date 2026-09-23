# 004-01 — Preparar baseline oficial

- **Ticker:** `004`
- **Número:** `01`
- **Status:** `pending`

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
