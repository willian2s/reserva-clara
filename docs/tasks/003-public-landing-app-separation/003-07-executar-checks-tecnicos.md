# 003-07 — Executar checks técnicos

- **Ticker:** `003`
- **Número:** `07`
- **Status:** `completed`

## Objetivo e resultado esperado

Executar os gates técnicos do repositório depois da implementação da fase 003,
registrando prova reproduzível sem inventar test runner, ignorar falhas ou
alterar dependências para mascarar problemas.

## Requisitos cobertos

- ESLint.
- Type generation antes de TypeScript.
- Typecheck strict.
- Build Next.js.
- Regressão estrutural de route groups, proxy, metadata, assets e auth.

## Escopo incluído

- Executar comandos na ordem exigida por `AGENTS.md`.
- Registrar resultados, warnings e bloqueios concretos nesta task.
- Conferir que `/`, `/login` e `/dashboard` aparecem no build conforme o
  contrato, sem assumir que build prova OAuth ou topologia HTTP.
- Conferir ausência de alteração em package, lockfile e assets nesta fase de
  execução futura, salvo mudança explicitamente aprovada.

## Escopo excluído

- Instalar dependências, criar test runner, formatter ou CI.
- Corrigir falha não relacionada sem voltar à subtarefa responsável.
- Declarar E2E Firebase, acessibilidade ou host routing aprovado somente pelo
  build.
- Configurar Vercel, DNS, Firebase Console ou produção.

## Dependências

- 003-01 a 003-06 concluídas ou com bloqueios resolvidos.
- Node/npm e `package-lock.json` disponíveis.
- Ambiente com as dependências instaladas; nenhum `.env.local` será versionado.

## Arquivos e símbolos prováveis

- `src/proxy.ts`, `src/app/(marketing)/*`, `src/app/(app)/*`.
- `src/app/layout.tsx`, `src/app/globals.css` e componentes UI/auth.
- `next.config.ts`, `package.json`, `package-lock.json` para inspeção de não
  regressão.
- `.next` como artefato gerado e não versionado.

## Passos de implementação

1. Confirmar status/diff e escopo antes dos comandos; não incluir segredos.
2. Executar `npm run lint`.
3. Executar `npm exec next typegen`.
4. Executar `npx tsc --noEmit` somente após typegen.
5. Executar `npm run build`.
6. Inspecionar output para erros, warnings materiais, rotas e metadata.
7. Se algum gate falhar, registrar arquivo, causa provável, comando e retorno à
   task responsável; manter status `pending`/`blocked`, nunca esconder o erro.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também verificar que os comandos não alteraram `package.json`, lockfile, assets
ou arquivos fora do escopo permitido.

## Definição de pronto

- Os quatro comandos passam na ordem correta.
- Type generation ocorreu antes do typecheck.
- Build reconhece a landing e as rotas de app sem erro de Proxy, metadata,
  asset ou import Client/Server.
- Nenhum warning material foi omitido.
- O registro distingue gate técnico de validação manual de auth, a11y e hosts.

## Riscos e cuidados

- Não usar `--no-check`, ignorar lint ou apagar artefato gerado para forçar
  sucesso.
- Build não prova que Host header, redirect, OAuth ou browser funcionam.
- Não expor valores de `.env.local`, tokens ou credenciais.
- Typegen deve rodar antes de `tsc`, conforme instrução do repositório.

## Registro de execução

### Status

`completed`

### Arquivos alterados

- `docs/tasks/003-public-landing-app-separation/003-07-executar-checks-tecnicos.md`:
  registro dos gates e evidências desta subtarefa.
- `docs/tasks/003-public-landing-app-separation/003-00-overview.md`: checklist e
  progresso atualizados.

Nenhum arquivo de código, `package.json`, `package-lock.json` ou asset foi
alterado. `.next` permaneceu somente como artefato gerado e ignorado.

### Decisões e desvios

- Os quatro gates foram executados na ordem definida pelo repositório, sem
  instalar dependências, criar test runner ou mascarar falhas.
- A inspeção do build foi usada somente para confirmar reconhecimento das rotas
  e do Proxy. OAuth, autorização, acessibilidade visual e topologia HTTP
  permanecem validações específicas das subtarefas correspondentes.
- Não houve warning material ou bloqueio nesta execução.

### Comandos executados

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

Também foram feitas inspeções estruturais da landing, do `src/proxy.ts` e do
diff de `package.json`, `package-lock.json` e `public/`.

### Resultados e evidências

- `npm run lint` — passou, sem saída de erro.
- `npm exec next typegen` — passou; tipos de rotas gerados com sucesso.
- `npx tsc --noEmit` — passou, sem saída de erro, após o typegen.
- `npm run build` — passou com Next.js `16.3.5`/Turbopack; compilação,
  TypeScript, coleta de dados e geração estática concluídas.
- O build reconheceu `○ /`, `○ /login`, `○ /dashboard`, `○ /_not-found` e
  `ƒ Proxy (Middleware)`.
- `git diff --check` — passou.
- `src/app/(marketing)/page.tsx` permanece Server Component e não importa
  Firebase, Firestore ou componentes de auth; `src/proxy.ts` permanece único
  ponto de classificação de host.
- Status/diff e inspeção direcionada confirmaram ausência de alterações em
  `package.json`, `package-lock.json` e `public/`.

### Riscos residuais

- Build não prova OAuth Google, autorização server-side, acessibilidade visual
  em browser nem DNS/TLS/Vercel; essas limitações permanecem registradas nas
  subtarefas 003-05, 003-06 e 003-08.
- A matriz HTTP de hosts, redirects e assets ainda depende da validação da
  subtarefa 003-08.
