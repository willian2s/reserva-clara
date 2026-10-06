# 011 — Revisão do Roadmap e Evolução Arquitetural

- **Status geral:** in_progress
- **Spec:** [011-revisao-roadmap-evolucao-arquitetural.md](../../specs/011-revisao-roadmap-evolucao-arquitetural.md)
- **Progresso:** 7/8 subtarefas concluídas

## Objetivo

Executar o discovery que prepara a transformação incremental do Reserva Clara de
Next.js + Firestore para React/TypeScript/Vite → ASP.NET Core/.NET → EF Core →
PostgreSQL/Supabase, mantendo Firebase Authentication e isolando BRAPI no
backend, sem iniciar a implementação da nova stack.

## Checklist

- [x] [011-01-inventariar-frontend-e-next.md](011-01-inventariar-frontend-e-next.md)
- [x] [011-02-mapear-dominio-dados-e-riscos.md](011-02-mapear-dominio-dados-e-riscos.md)
- [x] [011-03-desenhar-arquitetura-alvo-e-camadas.md](011-03-desenhar-arquitetura-alvo-e-camadas.md)
- [x] [011-04-modelar-postgresql-e-migracao.md](011-04-modelar-postgresql-e-migracao.md)
- [x] [011-05-definir-identidade-e-seguranca.md](011-05-definir-identidade-e-seguranca.md)
- [x] [011-06-revisar-ux-frontend-e-contratos.md](011-06-revisar-ux-frontend-e-contratos.md)
- [x] [011-07-planejar-testes-ambientes-e-cutover.md](011-07-planejar-testes-ambientes-e-cutover.md)
- [ ] [011-08-registrar-adrs-e-handoff.md](011-08-registrar-adrs-e-handoff.md)

## Observações

- Dependências: fases 001–010 concluídas; a arquitetura alvo e a permanência de
  Firebase Authentication/BRAPI já estão decididas.
- 011 é uma fase de discovery e documentação. Não cria Vite, .NET, schema,
  migration, endpoint, infraestrutura ou deploy.
- As tarefas 01 e 02 podem ser investigadas em paralelo; as demais fecham
  progressivamente arquitetura, dados, segurança, baseline de produto/UX,
  handoff e operação. A descoberta substantiva de Produto/UX/UI pertence à 012.
- O risco de `SELL` acima do saldo via SDK Firestore direto deve receber uma
  decisão de contenção em C0, sem introduzir dual-write.
- O roadmap canônico foi sincronizado com a revisão em
  `docs/roadmap/reserva-clara-roadmap.md`; a spec detalha os critérios e o
  roadmap mantém a sequência oficial 011–021.
- 011-01 concluída com inventário de rotas, layouts, hosts, acoplamentos Next,
  auth/dados, UX/a11y, testabilidade, matriz de destino e riscos residuais.
- A baseline técnica permaneceu verde; não houve alteração de código. A próxima
-  subtarefa 011-02 concluiu o inventário de domínio, dados, ownership, queries,
  Quotes/BRAPI, legado, riscos e opções para C0; nenhum código foi alterado.
- C0 continua sendo gate operacional: foi escolhida a aceitação temporária
  restrita a dev/testes. Não houve dual-write nem implementação de bridge; a
  condição de saída deve ser respeitada antes de usuários, dados reais,
  staging/produção ou cutover.
- A 011 foi explicitamente limitada a discovery e redução de incertezas; não
  exige endpoints, DTOs, componentes ou contratos definitivos completos.
- A 011-03 registrou a sequência Produto/UX/UI → casos de uso → API Contract →
  Application → Domain → Persistence e os boundaries contra CRUD orientado ao
  banco.
- O roadmap canônico preserva 001–010 como histórico e usa 011–021 como única
  sequência oficial pós-migração; as propostas antigas estão marcadas apenas
  como rebaseline histórico.
- A revisão confirmou que 012 pode alterar os requisitos da API e que o gate
  021 valida o sistema em funcionamento antes do retorno às features.
- A 011-06 foi delimitada como handoff: consolida o baseline técnico frontend,
  acoplamentos Next.js, problemas conhecidos, restrições React/Vite, jornadas a
  revisitar, dependências UX/API e perguntas abertas para a 012. Ela não executa
  redesign, nova IA, protótipos finais, decisões definitivas de design system,
  avaliação completa de UX, redesign de dashboards, fechamento de DTOs,
  congelamento de endpoints, arquitetura completa de estado/cache/frontend ou
  validação definitiva de acessibilidade.
- A fronteira oficial é `011-01 → 011-06 handoff → 012 Product/UX/UI/IA/
  Frontend Discovery → capacidades/contratos provisórios da API → 013+`.
- A 011-07 concluiu a estratégia operacional em
  `docs/architecture/011/quality-environments-cutover.md`: matriz de testes por
  fase, harness TS↔C#, PostgreSQL real, pipelines independentes, ambientes,
  secrets/CORS, observabilidade, SLO/runbooks, rehearsals, C0–C11, cutover e
  rollback honesto. Nenhuma configuração, deploy, banco ou migration foi
  executado.
- C0 decidido como **A — aceitação temporária restrita a dev/testes**: o projeto
  não possui usuários ativos, portanto só são permitidos dados
  sintéticos/descartáveis; não são permitidos writes patrimoniais em
  staging/produção nem dados reais. O owner operacional é o maintainer do
  projeto, e a saída ocorre antes do primeiro usuário ativo, dado real,
  staging/produção ou cutover.
- A 011-04 concluiu o modelo relacional lógico e a matriz completa
  Firestore→PostgreSQL em `docs/architecture/011/relational-model.md`, além do
  pipeline de migração/reconciliação em
  `docs/architecture/011/data-migration-strategy.md`. Não houve DDL, migration,
  export ou carga real; os experimentos PostgreSQL ficaram como evidência
  obrigatória para 015/016.
- A revisão independente da 011-04 corrigiu a preservação das moedas de
  `UnitPrice`/`Fee`, distinguiu `null` explícito de campo ausente e detalhou o
  lock transacional do lifecycle Portfolio→Transaction; não há bloqueio
  pendente nesta subtarefa.
- A 011-05 concluiu o baseline de identidade e segurança em
  `docs/architecture/011/identity-security.md`: fluxo Firebase ID Token → API,
  `CurrentOwner` derivado de `sub`, matriz de claims/erros, revogação, CORS,
  headers, rate limits, secrets, logs, RLS candidata e threat model. A validação
  ASP.NET Core e os testes reais permanecem gates da 014/016.
- A 011-06 concluiu o handoff técnico em
  `docs/architecture/011/frontend-ux-contract-discovery.md`: inventário
  descritivo das jornadas 001–010, baseline frontend, acoplamentos Next, gaps,
  perguntas para a 012, capacidades e estados HTTP deliberadamente provisórios,
  regra de freeze por slice/N/N-1 e backlog verificável. A descoberta substantiva
  de Produto/UX/UI/IA/frontend continua pertencendo à 012.
