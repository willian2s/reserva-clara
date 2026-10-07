# 011-08 — Registrar ADRs, gates e handoff

- **Ticker:** `011`
- **Número:** `08`
- **Status:** `completed`

## Objetivo e resultado esperado

Converter os achados das subtarefas anteriores em decisões arquiteturais
rastreáveis, reconciliar o roadmap canônico e entregar um handoff sem lacunas
para as fases 012–016.

## Requisitos cobertos

- ADRs para decisões relevantes e supersession explícita do legado.
- Dependências, riscos, premissas, gates e decisões abertas visíveis.
- Preservação do histórico 001–010.
- Roadmap executável antes de voltar a features normais.
- Coerência entre spec, overview, subtarefas e roadmap.

## Escopo

### Incluído

- Criar/revisar ADRs listadas na spec 011.
- Marcar cada decisão como proposed/accepted/superseded com evidência.
- Conferir e manter o roadmap canônico sincronizado com as fases 011–021 e o
  histórico 001–010; a sincronização inicial foi antecipada nesta revisão.
- Consolidar gates C0–C11, riscos residuais e primeiras tarefas elegíveis.
- Produzir handoff para 012/013/014/015/016, distinguindo o baseline técnico e
  as perguntas abertas da 011 das decisões de Produto/UX/UI/frontend que cabem
  à 012.

### Excluído

- Implementar qualquer decisão.
- Marcar ADR histórica como superseded antes do cutover quando ela ainda
  descreve produção.
- Fingir que decisão aberta foi resolvida sem dados/experimento.

## Dependências

- 011-01 a 011-07 concluídas.
- Roadmap canônico já sincronizado; a subtarefa deve validar coerência final,
  não aguardar uma permissão de edição.

## Arquivos e símbolos prováveis

- `docs/decisions/**` para novas ADRs.
- `docs/roadmap/reserva-clara-roadmap.md` para sincronização autorizada.
- Spec/overview/subtarefas 011 e artefatos em `docs/architecture/011/**`.

## Passos de implementação

1. Revisar inventários, decisões e experimentos das tarefas anteriores.
2. Criar as ADRs 1–15 listadas na spec, agrupando apenas quando a decisão e
   consequências forem realmente inseparáveis.
3. Registrar alternativas, evidências, consequências e gatilho de revisão.
4. Distinguir decisões aceitas de hipóteses/experimentos pendentes.
5. Conferir o roadmap sincronizado, preservando fases 001–010 e mapeando o
   planejamento antigo como superseded.
6. Conferir fases 011–021, dependências, gates e ordem crítica.
7. Registrar risco residual C0 e blockers para 012–016.
8. Consolidar para a 012 o baseline frontend, gaps, jornadas a revisitar,
   restrições React/Vite, dependências UX/API e capacidades provisórias; deixar
   explícito que requisitos, DTOs e contratos podem mudar antes do freeze.
9. Atualizar status/checklist apenas para subtarefas realmente concluídas.
10. Produzir handoff com primeira fase/task elegível e decisões pendentes.

## Testes e comandos de validação

- Conferência bidirecional ADR ↔ spec ↔ roadmap ↔ artefato de discovery.
- Validar links, ticker, numeração, estados e termos superseded/accepted.
- Checklist das 19 perguntas do pedido original contra documentação final.
- Confirmar que nenhum ADR afirma mudança produtiva ainda não executada.
- `git diff --check` e inspeção do diff documental.

## Definição de pronto

- Decisões estruturais têm ADR e owner/gatilho de revisão.
- Histórico não foi reescrito e supersession é temporalmente correta.
- Roadmap canônico está sincronizado com spec, overview e handoff.
- Gates e handoffs indicam o que pode começar em paralelo e o que bloqueia; o
  handoff para a 012 não exige UX final, protótipos, design system final,
  arquitetura frontend completa ou contratos HTTP definitivos na 011.
- Nenhum código, deploy, banco, segredo ou configuração externa foi alterado.

## Riscos e cuidados

- Não aceitar ADR genérica que esconda decisões distintas.
- Não marcar Vercel/Firestore como removidos antes da 021.
- Não usar número de fase futura como se já estivesse executada.
- Não reabrir a sequência antiga nem executar novamente a sincronização já
  realizada; registrar qualquer divergência concreta entre os documentos.

## Registro da execução

### Status

`completed`

A subtarefa consolidou as quinze decisões da spec em ADRs `007`–`021`, revisou
as ADRs históricas sem antecipar `superseded`, reconciliou o roadmap canônico e
produziu o handoff para 012–016. A 011 continua exclusivamente documental: C0
tem aceitação restrita a dev/testes, C1 foi aceito formalmente em 2026-10-07 e
C2–C11 permanecem gates futuros. O planejamento e a execução documental da 012
são elegíveis sob as condições de C0; nenhuma execução de subtarefa foi
avançada automaticamente.

### Arquivos alterados

- `docs/decisions/007-topologia-alvo-e-autoridade-dos-dados.md` até
  `docs/decisions/021-lifecycle-de-asset-referenciado.md` — quinze ADRs novas,
  uma por decisão da spec.
- `docs/decisions/005-portfolio-archive-lifecycle.md` e
  `docs/decisions/006-assets-transactions-ledger.md` — separação entre
  princípios preservados e mecanismos Firestore a suceder.
- `docs/architecture/011/adr-register-and-handoff.md` — registro, gates,
  respostas às 19 perguntas e handoff 012–016.
- `docs/specs/011-revisao-roadmap-evolucao-arquitetural.md` — status concluído e
  link do registro de ADRs.
- `docs/roadmap/reserva-clara-roadmap.md` — data, prontidão documental, C1 e
  primeira atividade elegível sincronizados.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md` —
  status, checklist, progresso e observação final.
- este arquivo.

Nenhum código, banco, migration, deploy, segredo, dependência ou configuração
externa foi alterado.

### Decisões e desvios

- As quinze ADRs novas usam a sequência documental `007`–`021`, preservando as
  ADRs históricas existentes e deixando explícita a correspondência ordinal com
  a spec.
- Todas as ADRs novas são `proposed`, conforme a regra da spec, com evidência e
  gatilho de revisão. Não foram promovidas artificialmente a `accepted` sem
  PostgreSQL, API, protótipos, cutover ou testes futuros.
- ADRs 003/004 não foram marcadas `superseded`; 005/006 foram aditadas somente
  para separar princípios preservados de mecanismos sucedidos após cutover.
- O handoff declara o planejamento da 012 elegível, com `UX-01` como primeiro
  trabalho após o aceite de C1, e permite apenas tooling não acoplado em
  paralelo na 013. Não foi criada spec/task da 012, pois isso não pertence a
  esta subtarefa.
- O roadmap já estava sincronizado estruturalmente; a alteração foi limitada a
  registrar a prontidão documental, links, estado temporal e primeira atividade,
  sem reabrir a sequência antiga.

### Comandos executados e resultados

- `functions.glob`/`functions.read` — passaram na conferência do ticker `011`,
  spec, overview, oito subtarefas, AGENTS.md, roadmap, ADRs históricas e cinco
  artefatos de architecture/discovery.
- `functions.grep` — passou na conferência de links, estados, headings e
  ausência de arquivos ADR `007`–`021` anteriores.
- `git diff --check` — passou.
- Validador documental inline em Python — passou; verificou arquivos-alvo,
  links relativos e âncoras Markdown, incluindo os quinze ADRs e o handoff.
- Validação bidirecional ADR ↔ spec ↔ roadmap ↔ discovery — registrada no
  `adr-register-and-handoff.md`, incluindo correspondência das 15 decisões,
  gates C0–C11 e checklist das 19 perguntas.
- `npm run lint` — passou.
- `npm exec next typegen && npx tsc --noEmit` — passou; typegen e typecheck sem
  erros.
- `npm run build` — passou; Next.js 16.3.5 compilou as rotas atuais.
- `npm run test:domain` — passou, 14 testes.
- `npm run test:positions` — passou, 4 testes.
- `npm run test:positions-read` — passou, 9 testes.
- `npm run test:dashboard-read` — passou, 8 testes.
- `npm run test:financial-presentation` — passou, 6 testes.
- `npm run test:quotes-adapter` — passou, 7 testes.
- `npm run test:quotes-service` — passou, 8 testes.
- `npm run test:quotes-route` — passou, 8 testes.
- `npm run test:rules` — passou, 19 testes no Firestore Emulator; mensagens
  `PERMISSION_DENIED` são os casos negativos esperados.

### Resultados e evidências

- Cada uma das quinze decisões tem ADR própria com `proposed`, alternativas,
  consequências, evidência e gatilho de revisão.
- O handoff documenta a autoridade temporal Firestore → PostgreSQL, C0–C11,
  riscos residuais, primeira atividade elegível e condições para 012/013/014/
  015/016.
- A 012 recebe baseline técnico de frontend, gaps, jornadas, restrições,
  dependências UX/API e a liberdade explícita de alterar requisitos, DTOs e
  contratos antes do freeze.
- A tabela das 19 perguntas fecha a conferência solicitada sem afirmar execução
  futura. Nenhuma ADR declara Vite, .NET, banco, migração, deploy ou retirement
  já implementado.
- Histórico 001–010 e ADRs legadas foram preservados; `superseded` ficou
  condicionado a cutover/retirement conforme a spec.
- Revisão independente `review` — **APROVADO**, após corrigir a âncora de
  referência do modelo relacional, separar planejamento da 012 da execução
  pós-C1 e registrar a validação explícita de links/âncoras.

### Riscos residuais

- A revisão independente do pacote documental foi concluída e aprovada; o C1
  operacional ainda depende de sua aceitação formal no processo de gate.
- C0 continua limitado a dados sintéticos/descartáveis em dev/testes, sem
  staging/produção ou dados reais; a fragilidade histórica de `SELL` não foi
  implementada nem corrigida nesta fase.
- Decisões `proposed` dependem de evidências nas fases 012–021: protótipos,
  claims/CORS, golden masters, PostgreSQL real, volumetria, quota, restore,
  rehearsals e cutover.
- Não há spec/task formal da 012 neste checkout; o handoff aponta o backlog
  verificável de `frontend-ux-contract-discovery.md` como entrada.

### Handoff

- **012:** após o aceite independente de C1, começar por UX-01, UX-02, UX-03,
  UX-04, UX-05 e A11Y-01; revisar capacidades API-01–API-04 somente após os
  protótipos. Nenhum contrato está congelado.
- **013:** estruturar builds independentes, PostgreSQL real, CI, health,
  migration job separado e observabilidade, sem escolher hosting final ou
  congelar decisões que a 012 pode mudar.
- **014:** implementar walking skeleton com ID Token, CurrentOwner, CORS,
  Problem Details, rate limits, headers, traces e testes A/B/token.
- **015:** criar fixtures/golden masters TS↔C# para IDs, decimais, moedas,
  data, nanos, erros e idempotência, sem tradução mecânica.
- **016:** provar ERD, roles, constraints, precisão, locks, pooling/RLS se
  adotada, migration/reconcile, quarentena e restore em PostgreSQL real.
- Após a entrega desta subtarefa, não avançar automaticamente para outra
  subtarefa da 011; a próxima unidade de planejamento é a fase 012, sujeita à
  revisão independente deste pacote.
