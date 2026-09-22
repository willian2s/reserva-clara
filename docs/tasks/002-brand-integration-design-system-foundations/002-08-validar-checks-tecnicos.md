# 002-08 — Validar checks técnicos

- **Ticker:** `002`
- **Número:** `08`
- **Status:** `pending`

## Objetivo e resultado esperado

Executar gates técnicos do repositório após a implementação das foundations e
registrar prova reproduzível sem inventar test runner ou ocultar falhas.

## Requisitos cobertos

- Lint.
- Type generation antes do typecheck.
- Typecheck TypeScript.
- Build Next.js.
- Regressão estrutural de Server/Client, assets, metadata e auth.

## Escopo incluído

- Executar comandos na ordem exigida por `AGENTS.md`.
- Registrar comandos, resultado e qualquer warning relevante na própria task.
- Conferir rotas `/login` e `/dashboard` no build.
- Conferir presença de metadata/assets e ausência de import Firebase em layout/pages.
- Conferir ausência de alteração em package.json, lockfile, public assets ou
  configuração de dependência.

## Escopo excluído

- Instalar dependências, criar test runner ou alterar lockfile para fazer check
  passar.
- Corrigir falha não relacionada sem abrir task/registro próprio.
- Declarar validação E2E Firebase completa apenas por build.
- Alterar código nesta task sem retornar à subtarefa responsável.

## Dependências

- `002-01` a `002-07` concluídas, com bloqueios resolvidos.
- Node/npm e lockfile existentes.
- Ambiente capaz de executar Next/font no build.

## Arquivos e símbolos prováveis

- Todos os arquivos futuros da fase 002.
- `.next` e artefatos gerados, sem versionamento.
- `src/app/layout.tsx`, `globals.css`, UI e rotas para inspeção.

## Passos de implementação

1. Executar `npm run lint`.
2. Executar `npm exec next typegen`.
3. Executar `npx tsc --noEmit`.
4. Executar `npm run build`.
5. Se falhar, identificar arquivo/regra, devolver à task responsável e registrar
   status sem marcar overview.
6. Inspecionar output para rotas, fonte e metadata sem registrar segredos.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
```

Também validar que nenhuma alteração fora de `docs/` desta execução de
planejamento foi feita e que a futura implementação não modificou package,
lockfile ou assets.

## Definição de pronto

- Os quatro comandos passam na ordem correta.
- Type generation ocorreu antes do typecheck.
- Build produz `/login` e `/dashboard` sem erro de fonte, metadata ou asset.
- Nenhum warning material foi omitido.
- Evidências e bloqueios estão registrados.

## Riscos e cuidados

- Build pode falhar por acesso/cache da fonte; registrar causa, não trocar para
  `<link>` externo como atalho.
- Não usar `--no-check`, ignorar lint ou apagar erro gerado.
- Não confundir sucesso de build com aprovação visual ou E2E Firebase.
- Não expor variáveis, tokens, credenciais ou conteúdo de `.env.local`.
