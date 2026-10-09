# 011 — Registro de ADRs, gates e handoff

- **Ticker:** `011`
- **Estado:** baseline documental concluída; ADRs novas permanecem `proposed` até os gates indicados
- **Escopo:** fechar o discovery sem declarar implementação, cutover ou decisão futura já executada.

## 1. Registro das quinze decisões

As quinze decisões da seção 11 da spec foram numeradas como ADR 007–021, sem
reutilizar ou apagar a numeração histórica 001, 003, 004, 005 e 006.

| # | Decisão | ADR | Estado | Owner de revisão | Próxima evidência/revisão |
| ---: | --- | --- | --- | --- | --- |
| 1 | Topologia e autoridade única | [007](../../decisions/007-topologia-alvo-e-autoridade-dos-dados.md) | proposed | maintainer/release | C2, C7, C10 e C11 |
| 2 | Limites e dependências | [008](../../decisions/008-limites-de-camadas-e-dependencias.md) | proposed | maintainer/architecture | 013/015, analyzers e walkthrough |
| 3 | IDs, ownership e tenancy | [009](../../decisions/009-ids-ownership-e-tenancy.md) | proposed | API/security + data | 014/016, claims e A/B |
| 4 | Modelo relacional e registries | [010](../../decisions/010-modelo-relacional-e-registros-firestore.md) | proposed | data/migration | export, volumetria e 016 |
| 5 | Precisão decimal | [011](../../decisions/011-precisao-decimal-e-representacao.md) | proposed | domain/compatibility | golden master 015/016 |
| 6 | Precisão temporal e ordenação | [012](../../decisions/012-precisao-temporal-e-ordenacao.md) | proposed | domain/data | fixtures PostgreSQL 015/016 |
| 7 | Token, autorização, revogação e CORS | [013](../../decisions/013-identidade-autorizacao-revogacao-e-cors.md) | proposed | API/security | walking skeleton 014 |
| 8 | Concorrência e append-only | [014](../../decisions/014-concorrencia-idempotencia-e-append-only.md) | proposed | API/data | C6/018, duas conexões reais |
| 9 | Frontend e data layer | [015](../../decisions/015-arquitetura-frontend-e-data-layer.md) | proposed | Product/UX + frontend | descoberta e protótipos 012 |
| 10 | HTTP/OpenAPI e compatibilidade | [016](../../decisions/016-contrato-http-openapi-e-compatibilidade.md) | proposed | Product/API | 012 e freeze por slice |
| 11 | BRAPI, cache e quota | [017](../../decisions/017-brapi-cache-quota-e-multiplas-instancias.md) | proposed | integration/API | 014/019/020, quota medida |
| 12 | Supabase, roles e migrations | [018](../../decisions/018-supabase-postgresql-roles-pooling-e-backups.md) | proposed | data/operations | PostgreSQL real 016 e restore 020 |
| 13 | Migração e point of no return | [019](../../decisions/019-migracao-write-fence-reconciliacao-e-retencao.md) | proposed | release/data | C8–C10 e retenção 021 |
| 14 | Hosting, ambientes e CI/CD | [020](../../decisions/020-hosting-ambientes-observabilidade-e-cicd.md) | proposed | release/hosting | 013 e go/no-go 020 |
| 15 | Lifecycle de Asset referenciado | [021](../../decisions/021-lifecycle-de-asset-referenciado.md) | proposed | Product/domain | UX-06/012 e enforcement 018 |

`proposed` é intencional: os documentos registram a direção e o critério de
aceitação, mas não afirmam que API, Vite, .NET, banco, CI, deploy ou migração já
existam.

## 2. Supersession histórico e temporal

| ADR histórica | Estado agora | Transição correta |
| --- | --- | --- |
| [001 — Google popup](../../decisions/001-autenticacao-google-popup.md) | accepted para o login Firebase no browser | permanece válida quanto à identidade client; a validação server-side é a proposta 013 |
| [003 — separação por host](../../decisions/003-separacao-host-publico-app.md) | accepted para a topologia Next em produção | só será `superseded` depois de C10/C11 e da política equivalente no alvo |
| [004 — Cloudflare/Vercel](../../decisions/004-cloudflare-proxied-vercel.md) | accepted para o deploy legado | só será `superseded` depois de hosting/cutover e evidência de C11 |
| [005 — archive Portfolio](../../decisions/005-portfolio-archive-lifecycle.md) | accepted for 007; princípio de archive preservado | mecanismo Firestore é sucedido pelo lifecycle relacional somente após paridade |
| [006 — Asset/ledger](../../decisions/006-assets-transactions-ledger.md) | accepted for 007; princípios preservados | registry/Rules/repository são sucedidos pela API/constraints após C10/C11 |

Nenhuma ADR histórica foi marcada `superseded` nesta fase. “Sucedida” aqui é
planejamento temporal; não descreve uma mudança produtiva já realizada.

## 3. Gates C0–C11

| Gate | Evidência consolidada | Estado documental | Bloqueia |
| --- | --- | --- | --- |
| C0 — risco atual contido | Aceitação A somente em dev/testes, dados sintéticos/descartáveis, owner maintainer e saída antes de usuário, dado real, staging/produção ou cutover | decidido e ativo | writes fora do escopo e qualquer backend que replique a fragilidade |
| C1 — discovery fechado | inventários, ERD, threat model, ADRs, testes, ambientes, migração e handoff desta fase; aceite independente registrado em 2026-10-07 | aceito com condições de C0 | avanço sem arquitetura revisada e sem respeitar C0 |
| C2 — fundação reproduzível | CI, Vite/API, PostgreSQL real, migration job separado, health e staging skeleton | pendente de 013 | feature no alvo |
| C3 — auth E2E | token válido, claims negativas, A/B, CORS, refresh e logs sanitizados | pendente de 014 | dados privados na API |
| C4 — compatibilidade | golden master de IDs, decimal, data, nanos, Portfolio e erros | pendente de 015 | primeira slice |
| C5 — Portfolio | jornada completa, archive, owner A/B, a11y, E2E e reconciliação | pendente de 017 | ledger |
| C6 — ledger confiável | SELL concorrente, lock, idempotência e append-only | pendente de 018 | cutover funcional |
| C7 — paridade | BRAPI, posições, dashboards, UX, a11y, performance e telemetria | pendente de 019 | migração produtiva |
| C8 — rehearsal | import repetível, backup/restore, digest e zero divergência inexplicada | pendente de 020 | go/no-go |
| C9 — read-only | fence, delta, reconciliação, smoke no novo stack sem writes | pendente de 020 | primeiro write |
| C10 — PostgreSQL writes | primeiro write registrado, hosts/origens e observabilidade aprovados | pendente de 020 | retorno ao Firestore |
| C11 — retirement | soak sem tráfego legado, retenção/restore e scans aprovados | pendente de 021 | remoção e supersession final |

O C1 foi aceito operacionalmente em 2026-10-07 após revisão independente
registrada na documentação da fase 012. A execução de `UX-01` e dos demais
experimentos está elegível somente dentro das condições de C0. C2–C11 não são
declarados executados por este artefato.

## 4. Riscos residuais e bloqueios

### C0

O cliente legado ainda pode gravar `SELL` schema-válido acima do saldo se um SDK
ignorar o repository. Como não há usuários ativos, o risco é aceito somente em
dev/testes com dados sintéticos/descartáveis. Não são permitidos writes
patrimoniais em staging/produção ou dados reais. A saída é anterior ao primeiro
usuário ativo, dado real, avanço para staging/produção ou cutover; o backend novo
não pode copiar a fragilidade.

### 012–016

- O planejamento da 012 é a atividade elegível. Com o aceite independente de
  C1, seu primeiro trabalho de execução é `UX-01`, seguido de `UX-02`–`UX-05` e
  `A11Y-01`; a 012 pode alterar requisitos, DTOs e capacidades provisórias.
- A 013 pode preparar tooling e ambientes sem congelar capacidades da 012, mas
  não pode promover feature patrimonial nem migration no startup.
- A 014 está bloqueada até a fundação reproduzível da 013 e deve provar
  identidade, CORS e autorização antes de dados privados.
- A 015 depende de fixtures e das decisões estruturais da 011/013; qualquer
  divergência TS↔C# precisa de evidência e decisão explícita.
- A 016 depende do harness de precisão/tempo e de PostgreSQL real; volumetria,
  export autorizado, locks, RLS, pooling e restore continuam não executados.

Riscos transversais permanecem: perda de nanos ou precisão, dados legados
inválidos, colisões de identidade, cache/quota BRAPI, CORS/secrets, pooling/RLS,
janela de cutover e rollback após C10. Nenhum é ocultado como resolvido.

## 5. Handoff por fase

| Destino | Recebe agora | Não deve assumir | Próximo passo elegível |
| --- | --- | --- | --- |
| 012 | baseline frontend, jornadas 001–010, gaps, restrições React/Vite, backlog UX/API e capacidades provisórias | UX final, IA atual aprovada, router/state/cache escolhido ou DTO congelado | UX-01 → UX-05, A11Y-01 e protótipos correspondentes |
| 013 | limites de camadas, pipelines, ambientes, secrets/CORS, observabilidade e gates | hosting final, contrato global fechado ou migration no startup | estruturar builds/testes/health e PostgreSQL local real sem feature |
| 014 | fluxo ID Token → CurrentOwner, matriz de claims, 401/403/404, refresh, CORS e threat model | AuthGate como autorização ou token/access token Google aceito | walking skeleton autenticado após C2 |
| 015 | invariantes, strings decimais, datas, nanos, IDs, errors e harness TS↔C# | `System.Decimal`, `Date` ou tradução mecânica de entidades | fixtures/golden masters e primeiro caso de uso |
| 016 | ERD, FKs, unique, roles, pipeline, quarentena, reconcile e PONR | DDL final, volumetria observada, RLS aceita ou schema exposto ao browser | provar tipos, locks, migrations, import repetido e restore |

O primeiro item elegível do roadmap é o planejamento da fase 012. O experimento
`UX-01` está elegível após o aceite independente de C1, mas ainda depende da
seleção explícita da subtarefa correspondente. Nenhuma fase futura é tratada
como executada.

## 6. Conferência das 19 perguntas do pedido original

| # | Resposta consolidada | Evidência |
| ---: | --- | --- |
| 1 | Até 010 foram entregues autenticação, identidade, hosts, deploy, Firestore, Portfolios, Assets/Transactions, Quotes, Positions/Allocation e dashboards. | [spec 011 §1](../../specs/011-revisao-roadmap-evolucao-arquitetural.md#1-histórico-preservado-fases-001010) |
| 2 | Preservam-se regras de domínio, IDs, ownership, ledger, precisão, archive, Quote states, Firebase Auth e BRAPI. | [spec 011 §2.1](../../specs/011-revisao-roadmap-evolucao-arquitetural.md#21-preservadas-como-contratos-de-produto-e-domínio) |
| 3 | Next runtime, Firestore patrimonial, acesso direto e dependência Vercel só saem após cutover/soak. | [spec 011 §2.2](../../specs/011-revisao-roadmap-evolucao-arquitetural.md#22-sucedidas-pela-nova-arquitetura) |
| 4 | A mudança cria boundary confiável, persistência relacional e separação frontend/backend. | [ADR 007](../../decisions/007-topologia-alvo-e-autoridade-dos-dados.md) |
| 5 | A arquitetura alvo é React/Vite → ASP.NET Core em camadas → EF Core → PostgreSQL/Supabase. | [ADR 007](../../decisions/007-topologia-alvo-e-autoridade-dos-dados.md) |
| 6 | Firebase Auth permanece no frontend; Supabase Auth não entra. | [ADR 013](../../decisions/013-identidade-autorizacao-revogacao-e-cors.md) |
| 7 | Firebase ID Token tem claims estritas e owner vem somente de `sub`. | [ADR 013](../../decisions/013-identidade-autorizacao-revogacao-e-cors.md) |
| 8 | Firestore será substituído por export, staging, reconciliação, fence e cutover sem dual-write. | [ADR 019](../../decisions/019-migracao-write-fence-reconciliacao-e-retencao.md) |
| 9 | EF Core fica em Infrastructure, com migrations controladas e PostgreSQL real. | [ADR 018](../../decisions/018-supabase-postgresql-roles-pooling-e-backups.md) |
| 10 | Next sai por slices e retirement posterior; não há remoção nesta fase. | [ADR 007](../../decisions/007-topologia-alvo-e-autoridade-dos-dados.md) |
| 11 | 011 fornece baseline; 012 decide arquitetura frontend por feature. | [ADR 015](../../decisions/015-arquitetura-frontend-e-data-layer.md) |
| 12 | UX/UI será auditada e prototipada antes de freezes. | [handoff frontend](frontend-ux-contract-discovery.md) |
| 13 | API é capacidade provisória, congela por slice com Problem Details e N/N-1. | [ADR 016](../../decisions/016-contrato-http-openapi-e-compatibilidade.md) |
| 14 | Big-bang é evitado por walking skeleton, slices, C0–C11 e autoridade única. | [ADR 007](../../decisions/007-topologia-alvo-e-autoridade-dos-dados.md) |
| 15 | Testes cobrem domínio, aplicação, API, componentes, PostgreSQL, migração, a11y e E2E proporcionalmente. | [qualidade 011](quality-environments-cutover.md#3-pirâmide-e-matriz-de-testes) |
| 16 | Deploy separa frontend, API e migration job, com ambientes e secrets explícitos. | [ADR 020](../../decisions/020-hosting-ambientes-observabilidade-e-cicd.md) |
| 17 | Riscos principais estão registrados: precisão, tempo, cross-user, SELL, legado, quota, pooling, cutover e rollback. | [gates e riscos](quality-environments-cutover.md#9-checkpoints-c0c11-e-gono-go) |
| 18 | As quinze decisões têm ADR 007–021, com estado e gatilho de revisão. | [registro acima](#1-registro-das-quinze-decisões) |
| 19 | Features normais só reabrem após 011–021 e o gate 021; a candidata posterior é Contribution Planning. | [roadmap §8](../../roadmap/reserva-clara-roadmap.md#8-rebaseline-pós-migração--sequência-oficial) |

## 7. Critério de encerramento documental

Spec, overview, oito subtarefas, ADRs, artefatos de discovery, handoff e roadmap
estão ligados pelo ticker `011`. Nenhuma ADR afirma que mudança produtiva foi
executada; não houve código, deploy, banco, migration, segredo ou configuração
externa alterados.
