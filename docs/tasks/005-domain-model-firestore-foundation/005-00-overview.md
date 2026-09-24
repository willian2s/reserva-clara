# 005 — Domain Model & Firestore Foundation

- **Status geral:** completed
- **Spec:** [005-domain-model-firestore-foundation.md](../../specs/005-domain-model-firestore-foundation.md)
- **Progresso:** 10/10 subtarefas concluídas

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
- [x] [005-09-publicar-rules-e-validar-producao.md](005-09-publicar-rules-e-validar-producao.md)
- [x] [005-10-fechar-gates-e-documentacao.md](005-10-fechar-gates-e-documentacao.md)

## Observações

- Fase 005 não cria seed pessoal nem conteúdo patrimonial versionado. Database
  default foi ativado em `005-08`; Rules foram publicadas e smoke sintético foi
  concluído em `005-09`, com fixture removida.
- Dependência central: Firebase Web existente em `src/lib/firebase/client.ts`;
  `DashboardGate` continua UX, não autorização.
- Documento `users/{uid}` não será criado em 005. Namespace e Rules expressam
  ownership; perfil Google não é duplicado.
- `Portfolio` é única entidade persistida da fundação. Asset, Transaction,
  allocation, Snapshot, Goal e Emergency Reserve ficam em contratos/limites
  futuros, sem collections abertas por wildcard.
- Região do Firestore foi decidida em checkpoint humano e registrada em `005-08`.
  Configuração produtiva e validação por smoke permanecem evidências distintas.
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
- `005-09` foi concluída: Rules publicadas após autenticação CLI; smoke Web
  owner/anônimo/cross-user passou com uma conta e namespace sintético diferente;
  fixture foi removida. Segunda identidade real não foi usada.
- Se aceite operacional exigir duas sessões autenticadas para A→B, repetir
  smoke com segunda conta antes de ampliar evidência; checklist atual cobre
  negação por `request.auth.uid` versus `userId` do path.
- Fase 005 concluída. Fase 006 deve começar pela experiência Portfolio usando
  contratos e repository existentes; delete/cascade deve ser decidido antes de
  abrir subcoleções patrimoniais.
