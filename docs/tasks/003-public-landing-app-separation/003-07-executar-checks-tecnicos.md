# 003-07 — Executar checks técnicos

- **Ticker:** `003`
- **Número:** `07`
- **Status:** `pending`

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
