# 005 — Domain Model & Firestore Foundation

- **Status geral:** pending
- **Spec:** [005-domain-model-firestore-foundation.md](../../specs/005-domain-model-firestore-foundation.md)
- **Progresso:** 8/10 subtarefas concluídas

## Objetivo

Criar, em execução futura, fundação Firestore owner-scoped, com contrato de
Portfolio, value objects precisos, acesso orientado ao domínio, runtime
validation, Rules default deny, testes no Emulator Suite e rollout produtivo
condicionado a checkpoint humano de região.

## Checklist

- [x] [005-01-baseline-e-decisoes-dominio.md](005-01-baseline-e-decisoes-dominio.md)
- [x] [005-02-definir-contratos-e-invariantes.md](005-02-definir-contratos-e-invariantes.md)
- [x] [005-03-integrar-firestore-web.md](005-03-integrar-firestore-web.md)
- [x] [005-04-criar-converters-e-validacao-runtime.md](005-04-criar-converters-e-validacao-runtime.md)
- [x] [005-05-criar-acesso-de-dados-de-portfolio.md](005-05-criar-acesso-de-dados-de-portfolio.md)
- [x] [005-06-versionar-security-rules.md](005-06-versionar-security-rules.md)
- [x] [005-07-configurar-emulator-e-testes-de-rules.md](005-07-configurar-emulator-e-testes-de-rules.md)
- [x] [005-08-ativar-firestore-com-checkpoint-humano.md](005-08-ativar-firestore-com-checkpoint-humano.md)
- [ ] [005-09-publicar-rules-e-validar-producao.md](005-09-publicar-rules-e-validar-producao.md)
- [ ] [005-10-fechar-gates-e-documentacao.md](005-10-fechar-gates-e-documentacao.md)

## Observações

- Fase 005 permanece sem collections, documentos, Rule publicada, env produtivo
  ou deploy nesta execução; o database default foi ativado em `005-08` sem
  conteúdo. `005-02` implementa somente contratos puros de domínio, sem
  persistência. `005-07` adiciona apenas dependências de desenvolvimento para
  Emulator Suite e Rules Unit Testing.
- Dependência central: Firebase Web existente em `src/lib/firebase/client.ts`;
  `DashboardGate` continua UX, não autorização.
- Documento `users/{uid}` não será criado em 005. Namespace e Rules expressam
  ownership; perfil Google não é duplicado.
- `Portfolio` é única entidade persistida da fundação. Asset, Transaction,
  allocation, Snapshot, Goal e Emergency Reserve ficam em contratos/limites
  futuros, sem collections abertas por wildcard.
- Região do Firestore exige checkpoint humano. Uma task externa permanece
  pending/blocked até decisão; `[x]` só depois da definição de pronto própria.
- `005-08` concluiu checkpoint humano e criação do database `(default)` no
  projeto Auth/Web: Native/Standard em `southamerica-east1`, modo produtivo,
  backups desativados e realtime ativado. Motivos registrados: residência no
  Brasil e latência para usuários. Estado é `configurado`, não `validado`; não
  há collections/documentos e Rules não foram publicadas.
- Não criar `firestore.indexes.json` sem query composta real.
- `005-03` concluiu singleton Firestore Web no boundary client, sem nova env,
  dependência ou conexão automática com emulator; gates técnicos passaram.
- `005-04` concluiu parser/converter de Portfolio com validação runtime,
  timestamps explícitos, writes parciais via `merge` e smoke sintético;
  testes no Emulator foram concluídos em `005-07`.
- `005-05` concluiu repository owner-scoped com paths derivados do Auth,
  create/list/get/update/delete, validação antes do SDK, server timestamps,
  update sem upsert e erros SDK sanitizados; acesso foi coberto no Emulator em
  `005-07`.
- `005-06` concluiu Rules versionadas com default deny, schema mínimo de
  Portfolio, timestamps server-side, ownership por path e negação explícita de
  namespace/profile e entidades futuras; matriz comportamental foi comprovada
  em 005-07.
- `005-07` concluiu Emulator Suite local com projeto demo, fixtures sintéticas,
  testes `node:test` e cobertura de ownership, schema, anônimo e paths futuros;
  `npm run test:rules` passou sem acesso produtivo.
- Depois de 005-07 verde, primeira subtarefa elegível para avanço externo é
  `005-08-ativar-firestore-com-checkpoint-humano.md`; antes disso, a execução
  deve concluir contratos, acesso, Rules e testes locais.
