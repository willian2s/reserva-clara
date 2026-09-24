# 005 — Domain Model & Firestore Foundation

- **Status geral:** pending
- **Spec:** [005-domain-model-firestore-foundation.md](../../specs/005-domain-model-firestore-foundation.md)
- **Progresso:** 2/10 subtarefas concluídas

## Objetivo

Criar, em execução futura, fundação Firestore owner-scoped, com contrato de
Portfolio, value objects precisos, acesso orientado ao domínio, runtime
validation, Rules default deny, testes no Emulator Suite e rollout produtivo
condicionado a checkpoint humano de região.

## Checklist

- [x] [005-01-baseline-e-decisoes-dominio.md](005-01-baseline-e-decisoes-dominio.md)
- [x] [005-02-definir-contratos-e-invariantes.md](005-02-definir-contratos-e-invariantes.md)
- [ ] [005-03-integrar-firestore-web.md](005-03-integrar-firestore-web.md)
- [ ] [005-04-criar-converters-e-validacao-runtime.md](005-04-criar-converters-e-validacao-runtime.md)
- [ ] [005-05-criar-acesso-de-dados-de-portfolio.md](005-05-criar-acesso-de-dados-de-portfolio.md)
- [ ] [005-06-versionar-security-rules.md](005-06-versionar-security-rules.md)
- [ ] [005-07-configurar-emulator-e-testes-de-rules.md](005-07-configurar-emulator-e-testes-de-rules.md)
- [ ] [005-08-ativar-firestore-com-checkpoint-humano.md](005-08-ativar-firestore-com-checkpoint-humano.md)
- [ ] [005-09-publicar-rules-e-validar-producao.md](005-09-publicar-rules-e-validar-producao.md)
- [ ] [005-10-fechar-gates-e-documentacao.md](005-10-fechar-gates-e-documentacao.md)

## Observações

- Fase 005 permanece sem banco, collection, documento, Rule publicada, env,
  dependência ou deploy nesta execução; `005-02` implementa somente contratos
  puros de domínio, sem persistência.
- Dependência central: Firebase Web existente em `src/lib/firebase/client.ts`;
  `DashboardGate` continua UX, não autorização.
- Documento `users/{uid}` não será criado em 005. Namespace e Rules expressam
  ownership; perfil Google não é duplicado.
- `Portfolio` é única entidade persistida da fundação. Asset, Transaction,
  allocation, Snapshot, Goal e Emergency Reserve ficam em contratos/limites
  futuros, sem collections abertas por wildcard.
- Região do Firestore exige checkpoint humano. Uma task externa permanece
  pending/blocked até decisão; `[x]` só depois da definição de pronto própria.
- Não criar `firestore.indexes.json` sem query composta real.
- Depois de 005-07 verde, primeira subtarefa elegível para avanço externo é
  `005-08-ativar-firestore-com-checkpoint-humano.md`; antes disso, a execução
  deve concluir contratos, acesso, Rules e testes locais.
