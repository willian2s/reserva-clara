# 002-08 — Validar checks técnicos

- **Ticker:** `002`
- **Número:** `08`
- **Status:** `completed`

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

## Registro de execução

- **Arquivos alterados:** esta subtarefa e o overview `002-00-overview.md`.
  Nenhum arquivo de implementação, `package.json`, lockfile ou asset foi
  alterado; `.next` permaneceu apenas como artefato ignorado de build.
- **Decisões e desvios:** nenhum desvio. Os gates foram executados na ordem
  exigida, sem instalar dependências, criar test runner ou alterar código fora
  da documentação de planejamento.
- **Comandos executados e resultados:**
  - `npm run lint` — aprovado, sem diagnóstico do ESLint.
  - `npm exec next typegen` — aprovado; `Types generated successfully`.
  - `npx tsc --noEmit` — aprovado, sem diagnóstico TypeScript.
  - `npm run build` — aprovado; compilação concluída, páginas estáticas
    geradas e rotas `/dashboard` e `/login` presentes no output.
- **Inspeções estruturais:** `src/app/layout.tsx` exporta `Metadata` com
  título `Reserva Clara` e descrição `Seu patrimônio, com clareza.`; não há
  import Firebase em arquivos de `src/app`; assets oficiais permanecem em
  `public/brand/`; `git status` ficou limpo após os comandos e não houve diff
  em `package.json`, `package-lock.json` ou `public/`.
- **Warnings e evidências:** a varredura do log do build não encontrou
  `warning`, `error`, `failed` ou `fatal`. Esta validação cobre gates de build
  e estrutura, não aprovação visual nem E2E Firebase.
- **Riscos residuais:** nenhum bloqueio técnico identificado. A validação E2E
  Firebase e a revisão visual continuam fora do escopo desta subtarefa.
