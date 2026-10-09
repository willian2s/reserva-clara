# 012 — Matriz de gate, escopo e evidências

- **Ticker:** `012`
- **Subtarefa de origem:** `012-01`
- **Estado:** C1 aceito; C0 permanece ativo e limitado
- **Escopo:** discovery documental e prototipação progressiva; nenhum dado real,
  write patrimonial fora de C0 ou contrato HTTP definitivo

## 1. Resultado do gate de entrada

| Gate | Estado nesta subtarefa | Evidência disponível | Owner | Condição de saída/bloqueio |
| --- | --- | --- | --- | --- |
| C0 — risco atual contido | **ativo e limitado** | Aceitação A em dev/testes, somente com dados sintéticos/descartáveis; sem writes patrimoniais em staging/produção ou dados reais | maintainer do projeto | Sair antes do primeiro usuário ativo, dado real, avanço para staging/produção ou cutover; o backend novo não pode copiar a fragilidade do SDK |
| C1 — discovery fechado | **aceito formalmente em 2026-10-07** | Revisão independente do subagente `review` confirmou o handoff 011 e a coerência entre spec, ADRs, gates, riscos e roadmap | subagente independente `review` | C1 liberado; manter C0 restrito, não promover ADRs `proposed` e não declarar C2–C11 executados |

O baseline documental da 011 foi revisado independentemente para a entrada da
012. O aceite libera o planejamento experimental da fase, sempre dentro de C0;
nenhuma ADR `proposed`, contrato final ou gate posterior é promovido por este
registro.

### Evidência mínima para aceitar C1

1. Revisor independente confirma o handoff da 011 e a coerência entre spec,
   ADRs, gates, riscos e roadmap.
2. C0 permanece restrito ao escopo acima, sem dados reais ou writes fora de
   dev/testes.
3. O aceite identifica revisor, data, evidência consultada e eventuais
   condições; não promove ADR `proposed` nem declara C2–C11 executados.

### Registro do aceite independente

- **Revisor:** subagente independente `review`.
- **Data:** 2026-10-07.
- **Escopo:** gate C1 da fase 012, incluindo handoff 011, spec, ADRs, gates,
  riscos, roadmap e limites de C0.
- **Evidências consultadas:** `adr-register-and-handoff.md`,
  `frontend-ux-contract-discovery.md`, spec 012, esta matriz, overview 012 e
  roadmap canônico.
- **Condições:** somente fixtures sintéticas e dados descartáveis em dev/testes;
  sem dados reais, writes fora de C0, migração, deploy ou cutover; ADRs
  `proposed` permanecem propostas; C2–C11 permanecem pendentes.

## 2. Dados permitidos e limites operacionais

| Permitido após C1 | Proibido nesta fase |
| --- | --- |
| Fixtures sintéticas, placeholders e dados descartáveis em dev/testes | Dados patrimoniais reais, credenciais, payloads financeiros ou identificadores reais |
| Walkthroughs, testes heurísticos e spikes contra API falsa | Writes em staging/produção, cutover, migração ou dual-write |
| Exemplos sanitizados de estados `partial`, `stale` e `unavailable` | Vite, .NET, banco, migration, endpoint ou deploy produtivo |
| Decisões conceituais e capabilities provisórias rastreáveis a jornadas | Freeze global de URL, DTO, OpenAPI, schema ou persistência por inércia da UI |

O owner operacional de C0 é o maintainer. Qualquer necessidade de ampliar dados,
ambiente ou operação exige nova decisão de gate antes da atividade.

## 3. Matriz de decisões da 012

| ID | Tema | Classificação nesta entrada | O que é preservado agora | Evidência que falta / owner |
| --- | --- | --- | --- | --- |
| D-01 | Invariantes patrimoniais | **Preservar** | `Transaction` é fato; posições, valuation, allocation e dashboards são derivados; ledger append-only; archive/restore; IDs opacos e estáveis | Golden masters e enforcement pertencem a 015–019 / domain-data |
| D-02 | Identidade e ownership | **Preservar** | Firebase permanece identidade; owner deriva do token verificado; browser não escolhe `uid`/`ownerId`; recurso de outro owner pode ser indistinguível de inexistente | Walking skeleton, claims, CORS e testes A/B em 014 / API-security |
| D-03 | Representação financeira e temporal | **Preservar** | Decimais como strings, moeda explícita, data civil, precisão temporal e desempate determinístico | Harness TS↔C# e PostgreSQL real em 015/016 / domain-compatibility |
| D-04 | Estados patrimoniais | **Preservar como hipótese semântica** | `partial`, `stale`, `unavailable`, valor conhecido e ausência de performance histórica não viram zero nem promessa de rentabilidade | Testes de copy e protótipos em 012-05/10 / Product-UX |
| D-05 | Browser e integrações | **Preservar** | Firebase Web somente para Auth; browser sem Firestore, PostgreSQL, Admin ou BRAPI; API como boundary futuro | Spike e walking skeleton em 012-11/013/014 / frontend-platform |
| D-06 | Entrada e arquitetura da informação | **Experimentar** | O dashboard global e a lista de carteiras são alternativas; nenhuma é aprovada por existir hoje | Walkthrough comparativo UX-01/UX-02 com fixtures sintéticas / Product-UX |
| D-07 | Jornadas, shell e navegação | **Decidir na 012** | Login/sessão, shell, Portfolio, Asset, Transaction, Quotes, detalhe e consolidado devem ser cobertos | Mapa de jornadas, IA, estados, a11y e protótipos 012-02 a 012-07 / Product-UX |
| D-08 | Design system e componentes | **Decidir na 012** | Identidade útil, tokens e primitives atuais são baseline, não aprovação final | Auditoria de densidade, a11y e inventário 012-05/06 / Product-UX + frontend |
| D-09 | Lifecycle de Asset usado | **Decidir na 012** | `assetId` estável, sem cascade, sem reescrita silenciosa e sem hard delete de fato referenciado | Walkthrough UX-06 e revisão da ADR 021 em 012-08; enforcement em 018 / Product-domain |
| D-10 | Capabilities e contratos provisórios | **Experimentar** | API deve representar intenção/capability, não coleção Firestore ou entidade EF; erros sanitizados e retry explícito | Prototótipos, estados críticos e catálogo em 012-07 a 012-12 / Product-API |
| D-11 | Router, cache e estado frontend | **Decidir na 012; validar no spike** | Estado de formulário/interação fica local até evidência; store global de negócio não é requisito | Spike comparável em 012-11 e fundação em 013 / frontend-platform |
| D-12 | URLs, DTOs, OpenAPI e schema finais | **Deferir** | Compatibilidade N/N-1 e freeze por slice continuam como regra | Freeze somente após protótipo, estados críticos e aceite a11y/responsivo em 017–019 / API + release |
| D-13 | Vite, .NET, banco, migração e deploy | **Deferir** | Somente limites e dependências são handoff; não há implementação nesta fase | 013–021, cada qual com seu gate / engineering + release |

As classificações acima não são aceite de produto nem de implementação. Elas
definem o que pode ser usado como restrição, hipótese ou pergunta durante a
descoberta sem congelar decisões dependentes de evidência posterior.

## 4. Matriz de evidências e freeze

| Evidência | Quando pode ocorrer | Critério observável | Owner de revisão | Destino |
| --- | --- | --- | --- | --- |
| Aceite formal de C1 | Antes de qualquer experimento | Registro independente com escopo, evidências, data e condições | revisor independente + maintainer/release | Liberar execução de 012 |
| UX-01/UX-02 — jornadas e entrada | Após C1 | Tarefas observáveis, comparação dashboard/lista de carteiras e decisão justificada | Product-UX | 012-02/03 |
| Estados, sessão e recovery | Após jornadas preliminares | Tabletop de 401 em read, write idempotente e write não idempotente; um refresh; sem retry cego | Product-UX + API-security | 012-04/014 |
| A11Y-01, densidade e linguagem | Com protótipos representativos | Teclado, foco, leitor de tela, contraste, 320 px, zoom 200%, copy sem confundir custo/patrimônio/performance | Product-UX + accessibility | 012-05/06 |
| Freeze de uma slice | Somente após protótipo da slice | Intenção, dados, estados, erros, retry, a11y, dependências, owner e decisões abertas registrados | owner da slice + Product/API | 017–019 |
| Handoff final da 012 | Depois de 012-01 a 012-12 e C1 | Pacotes rastreáveis, riscos residuais, owners e critérios para 013–019; nenhuma hipótese descrita como execução | Product/architecture | 012-13 |

### Regra de freeze

Até que uma slice satisfaça sua linha de evidência, nomes de endpoint, verbos,
envelopes, DTOs completos, paginação física, OpenAPI final e schema de
persistência permanecem provisórios. A aprovação de uma slice não congela as
demais e não transforma ADRs `proposed` em decisões implementadas.

## 5. Dependências, bloqueios e handoff

| Item | Dependência | Estado | Ação necessária |
| --- | --- | --- | --- |
| Entrada operacional da 012 | Aceite independente de C1 | **Liberado com condições** | Manter C0 restrito e iniciar UX-01 pela `012-02` |
| Preparação documental desta subtarefa | Spec 012, handoff 011 e roadmap canônico | Disponível | Manter a matriz vinculada a esses documentos |
| Execução de UX-01 | C1 aceito e C0 respeitado | **Elegível** | Executar `012-02` somente quando selecionada; não congelar API por inércia |
| 013 em paralelo | Apenas tooling que não congele decisões da 012 | Permitido com limite | Não criar feature patrimonial nem promover contrato provisório |
| 012-13 | Evidências das 012-01 a 012-12 e C1 aceito | Futuro | Consolidar somente após todas as dependências |

Referências normativas:

- [spec 012](../../specs/012-product-ux-ui-ia-api-discovery.md)
- [overview 012](../../tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md)
- [registro e handoff 011](../011/adr-register-and-handoff.md)
- [handoff frontend 011](../011/frontend-ux-contract-discovery.md)
- [roadmap canônico](../../roadmap/reserva-clara-roadmap.md)
- [ADR 015](../../decisions/015-arquitetura-frontend-e-data-layer.md), [ADR 016](../../decisions/016-contrato-http-openapi-e-compatibilidade.md) e [ADR 021](../../decisions/021-lifecycle-de-asset-referenciado.md)
