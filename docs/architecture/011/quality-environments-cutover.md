# 011 — Qualidade, ambientes, deploy e cutover

- **Ticker:** `011`
- **Estado:** baseline operacional proposta; não é configuração nem execução
- **Escopo:** testes, ambientes, entrega independente, observabilidade e
  migração controlada do Firestore para PostgreSQL

Este documento transforma as decisões da 011-03 a 011-06 em gates observáveis
para as fases 013–021. Ele descreve o que deverá ser provado, onde a prova
ocorre e qual evidência permite avançar. Não cria CI, banco, migration, hosting,
DNS, Firebase project, deploy ou dado real.

## 1. Princípios e autoridade operacional

1. Cada slice precisa de evidência de comportamento, integração, contrato,
   acessibilidade e operação proporcional ao risco. Compilar não é um gate
   suficiente.
2. O browser conhece somente o frontend estático, Firebase Authentication e a
   API. PostgreSQL/Supabase, migration job, Firebase Admin e BRAPI ficam no
   backend ou em jobs protegidos.
3. Firestore permanece a autoridade até o write fence do cutover. Durante
   desenvolvimento e rehearsal, PostgreSQL recebe cópias sintéticas,
   sanitizadas ou explicitamente autorizadas, nunca dual-write normal.
4. Portfolio, Asset e Transaction são uma unidade de promoção. Cutover por
   tabela é proibido porque as referências e os derivados atravessam essas
   tabelas.
5. Após o primeiro write patrimonial aceito no PostgreSQL, PostgreSQL é a única
   autoridade. Rollback de aplicação significa versão compatível com
   PostgreSQL, restore/PITR ou forward fix; não significa reabrir Firestore.
6. Toda evidência é sanitizada: sem token, UID bruto, e-mail, segredo, payload
   financeiro, preço, quantidade, taxa, SQL com parâmetros ou dados produtivos
   em logs e relatórios públicos.
7. Previews e ambientes de teste não acessam dados produtivos por conveniência.
   Um ambiente que não consiga provar seu isolamento não é elegível para um
   gate de dados.

## 2. Baseline atual e lacunas

O checkout atual é um único pacote Next.js. `package.json` possui scripts
específicos de `node:test` para domínio, posições, read-side, dashboards,
apresentação, BRAPI, Quotes e Rules, além de `lint` e `build`, mas não possui
script agregado, CI, testes React/componentes/E2E ou testes PostgreSQL. A
descrição correta é “não há runner/framework agregado”; os scripts existentes
continuam sendo evidência útil do comportamento legado.

`firebase.json` configura somente o Firestore Emulator na porta 8080. Não há
Auth Emulator, API ASP.NET Core, PostgreSQL, migration job, projeto Firebase
por ambiente ou configuração versionada de CI/deploy. `.env.example` separa a
configuração pública `NEXT_PUBLIC_FIREBASE_*` das credenciais server-only de
BRAPI e Firebase Admin; a arquitetura futura preserva a regra, com `VITE_*`
somente para configuração pública.

As fases 003/004 e as decisões de Cloudflare/Vercel permanecem evidência
histórica do deploy Next.js. Elas não são topologia normativa do alvo: a API e
o frontend futuro devem ser publicáveis separadamente, sem depender de recurso
exclusivo da Vercel. O legado só pode ser marcado como `superseded` depois do
cutover, soak e aposentadoria da 021.

### 2.1 O que os testes atuais provam e não provam

| Prova atual | Limite que permanece | Gate futuro |
| --- | --- | --- |
| Regras de domínio, reducer, posições, dashboards e apresentação | Não prova equivalência C#, PostgreSQL ou API nova | 015, golden master e property tests |
| Adapter/service/route de Quotes e estados stale/unavailable | Não prova CORS, rate limit distribuído, telemetria ou API ASP.NET | 014 e 019 |
| Firestore Rules, ownership, schema e append-only documental | Não impede toda `SELL` acima do saldo e não prova locks PostgreSQL | 018, concorrência real e fence C0 |
| Lint, typecheck, build e scripts `node:test` | Não prova deploy, DNS, E2E, acessibilidade real, restore ou cutover | 013, 017, 020 e 021 |

Nenhuma lacuna acima deve ser apresentada como resolvida pela documentação.

## 3. Pirâmide e matriz de testes

### 3.1 Níveis normativos

| Nível | Responsabilidade | Evidência mínima |
| --- | --- | --- |
| Domain/unit | Value Objects, invariantes, reducers, erros e ordenação | suíte determinística rápida, sem HTTP/EF/Firebase/BRAPI |
| Property/boundary | limites de decimal/data/timestamp, idempotência e invariantes | propriedades geradas e fixtures de limite versionadas |
| Application | casos de uso, autorização contextual e transação orquestrada | testes com ports/fakes, sem controller ou infraestrutura concreta |
| Contract/API | OpenAPI provisória por slice, Problem Details, status e compatibilidade | provider/consumer fixtures e matriz N/N-1 quando aplicável |
| Component/accessibility | formulários, estados e interação visível | teclado, foco, zoom 200%, 320 px, contraste e axe equivalente |
| Integration | EF Core/Npgsql, auth, BRAPI adapter e queries | dependência real ou fixture controlada; falha e timeout cobertos |
| E2E | jornada autenticada completa e isolamento A/B | browser em staging representativo, sem confundir guard de UX com auth |
| Operational | build/deploy, health, migração, restore, observabilidade e rollback | artefato, log sanitizado, relatório assinado e owner do gate |

Cada vertical deve declarar quais níveis são obrigatórios e justificar qualquer
nível não aplicável. Unit e build nunca substituem integração ou E2E de uma
slice que atravessa fronteiras.

### 3.2 Matriz requisito → teste → ambiente → evidência

| Requisito/fase | Nível e casos mínimos | Ambiente | Owner primário | Evidência para o gate |
| --- | --- | --- | --- | --- |
| 013 Fundação reproduzível | lint, typecheck, build frontend/API; unit; analyzers; health; migrations em banco descartável; smoke de artefatos | local e test isolado | release owner + frontend/API | logs CI, hashes de artefato, relatório de migration e smoke |
| 014 Identidade e walking skeleton | token válido; issuer/audience/projeto/alg/exp/iat/sub inválidos; revogado/disabled conforme política; `401/403/404`; CORS; refresh; cross-user A/B; rate limit | test com Firebase isolado e PostgreSQL real; staging skeleton | API/segurança | contrato de auth, captura sanitizada de headers, testes A/B e traces |
| 015 Compatibilidade | golden master TS↔C#; property/boundary; IDs; decimal de 30+18; fee/moeda; data civil; nanos; erros e idempotência | fixtures sintéticas versionadas em local/test | domínio/compatibilidade | fixture manifest, diffs aprovados ou divergência justificada |
| 016 Persistência e migrador | up/reexecução ou forward-only; PK/FK/unique/check; roles/RLS se adotada; locks em duas conexões; pooling; import repetido; falha parcial; quarentena; restore/PITR; planos de query | PostgreSQL real local/test e rehearsal em staging | operador de dados/migração | relatório por batch, digest, quarentena, `EXPLAIN`, restore e permissões |
| 017 Portfolio | domain/application/API/contract/integration/component/E2E; owner A/B; archive/restore; teclado/mobile; reconciliação | staging sem Firestore no browser | slice Portfolio/frontend | vídeo/screenshot sem dado, relatório a11y, E2E e digest de Portfolio |
| 018 Assets/Transactions | `SELL` concorrente; lock; idempotência igual/divergente; append-only; lifecycle; cross-user; retroatividade; migração | PostgreSQL real e E2E staging com carga sintética | API/domínio + dados | teste concorrente reproduzível, auditoria de transação e reconciliação |
| 019 Paridade | adapter/API BRAPI; timeout/retry/quota; positions/golden master; dashboards; stale/unavailable/partial; visual; a11y; performance | staging com provider controlado/fixtures | integração/frontend + release owner | relatório de paridade, budgets, falhas injetadas e E2E das jornadas |
| 020 Cutover | rehearsal integral; pré-cópia/delta; backup/restore; fence; read-only; smoke auth/owner; DNS/TLS/CORS; secrets; observabilidade; rollback pré-write | staging representativo e produção controlada | release owner + dados/hosting | runbook preenchido, checklist go/no-go, digest, métricas e aprovação |
| 021 Retirement | regressão completa; scan de imports/config legado; E2E produtivo controlado; restore; dependency/secret scan; smoke pós-remoção | produção após soak e cópia retida | release owner + mantenedor | prova de zero tráfego antigo, scan, restore, soak e ADRs atualizadas |

### 3.3 Golden master e contract harness

O harness de compatibilidade será criado na 015 e ampliado por slice, não como
tradução mecânica do TypeScript. TS e C# recebem fixtures JSON versionadas com:

- decimal como string canônica, incluindo limites, zero, fee nula e moedas;
- `effectiveDate` civil e timestamp como `seconds`/`nanoseconds`;
- IDs opacos, ordem de ledger, `buy`/`sell`, archive e erros determinísticos;
- entradas válidas, inválidas, repetidas e payload divergente para idempotência;
- resultados esperados de reducer, posição e estados de Quote sem persistir
  `Position` como verdade.

Cada fixture tem `fixture_id`, versão do contrato, caso, entrada sanitizada,
saída esperada e regra de aprovação. O comparador não usa tolerância numérica,
`number`, `double` ou arredondamento implícito. Divergência pode ser aceita
somente com decisão registrada, impacto na slice e atualização explícita da
fixture; não se deve snapshotar um bug por inércia.

Contract tests validam método, rota provisória, headers necessários, status,
Problem Details, campos públicos e compatibilidade N/N-1 durante um release
independente. O contrato não congela capacidades antes da descoberta da 012 e
do protótipo da slice correspondente. Depois do freeze, uma quebra exige
versionamento, janela de compatibilidade ou rollout coordenado documentado.

## 4. Componentes, E2E e acessibilidade

### 4.1 Componentes e estados

Cada slice deve testar pelo menos loading, empty, error, unauthorized/session
expired, partial, stale, unavailable, sucesso e retry. `unavailable` não é zero
e `stale` permanece visível. Os testes cobrem:

- validação e mensagens de formulários sem ecoar payload sensível;
- foco inicial, ordem de tabulação, foco após erro, teclado sem mouse e
  cancelamento seguro;
- zoom de 200%, viewport de 320 px, orientação mobile e contraste;
- estados de refresh/401: uma tentativa de refresh para leitura ou write com
  chave idempotente, nunca retry cego de write não idempotente;
- loading e erro de provider sem bloquear operações não relacionadas;
- ausência de credencial PostgreSQL, Firestore patrimonial ou chamada BRAPI no
  bundle/frontend alvo.

A 012 decide a arquitetura de componentes e state/cache. A 011 somente exige
  que a decisão produza componentes testáveis e que os contratos provisórios
  tenham estados operacionais observáveis.

### 4.2 E2E por jornada

O conjunto mínimo de staging cobre login/refresh/logout, isolamento A/B,
Portfolio, Asset, Transaction, Quotes e dashboard. A conta A nunca deve enxergar
ou alterar o recurso de B; a UI de redirect não é evidência de autorização.
Testes E2E devem usar dados sintéticos identificáveis por batch, limpar seus
recursos e não gravar em Firestore produtivo.

Falhas de Firebase, API, PostgreSQL e BRAPI devem ser injetáveis em test/staging
por fixture, proxy de teste ou provider fake controlado. O teste registra
somente código, estado, duração e trace sanitizado, nunca token ou valor
financeiro.

## 5. PostgreSQL, migrations e restore

### 5.1 Banco de integração

SQLite e EF InMemory não são evidência. Local e test usam PostgreSQL real, com a
mesma família de tipos, migrations e roles prevista para staging/prod. Cada
execução de test recebe banco/schema descartável e identificador isolado; seeds
são determinísticos, sintéticos e desativados em produção.

O conjunto de integração deve provar:

1. migration em banco vazio, reexecução idempotente e estratégia forward-only
   quando `Down` não for seguro;
2. PK/FK compostas owner-scoped, unique de Asset, checks, `RESTRICT`, archive e
   permissões append-only de Transaction;
3. decimal textual de 30 dígitos inteiros + 18 fracionários, rejeição do limite
   seguinte, fee/moeda e ausência de arredondamento;
4. `effective_date`, seconds, nanos e ID em ordenação total;
5. duas conexões reais concorrentes para archive/restore e `SELL`, incluindo
   lock da Portfolio e retry/idempotência;
6. runtime sem DDL/migration, migration role separada e schema privado;
7. pooling, reset de contexto e RLS somente se a defesa candidata for adotada;
8. plano de query/índice das consultas críticas com volumetria sintética;
9. import repetido, conflito de hash, falha em cada entidade, retomada do batch,
   quarentena sem descarte e reconciliação de derivados;
10. backup restaurado em banco descartável, seguido de smoke e reconciliação.

O migration job não roda no startup da API. Ele recebe batch, versão de
transformador, snapshot e manifesto; o relatório publica contagens, hashes,
códigos e owners pseudonimizados. O runtime nunca possui a role de migration.

### 5.2 Critérios de reconciliação

Por owner, o relatório compara cardinalidade, IDs, ownership, FKs, identidade de
Asset, lifecycle, strings decimais, tempo/ordem, digest do ledger, reducer,
repetição e itens em quarentena. A promoção é bloqueada por divergência
inexplicada, colisão, órfão, `SELL` inválido ou perda temporal. Posição, total e
alocação são recomputados como verificação, nunca gravados para encobrir
divergência.

## 6. Ambientes e topologia lógica

O fornecedor de hosting permanece decisão da 020. A topologia mínima é definida
por capabilities, não por produto:

```text
Browser
  ├─ frontend estático por ambiente ──> Firebase Auth do mesmo ambiente
  └─ HTTPS + ID Token ──> API por ambiente ──> PostgreSQL privado
                                      ├─> migration job controlado
                                      └─> BRAPI
CI ──> artefatos versionados ──> frontend/API/migration independentes
```

| Ambiente | Dados e Firebase | Backend/controles | Saída permitida |
| --- | --- | --- | --- |
| Local | fixtures sintéticas; PostgreSQL descartável; Firebase dev ou emulator explicitamente configurado | secrets locais ignorados; logs locais redigidos; HTTPS opcional conforme harness | desenvolvimento e diagnóstico, nunca dado real |
| Test | Firebase project/emulator isolado; DB isolado por execução; fixtures de limite e falha | CI reproduzível, provider BRAPI fake/fixture, seeds automáticos apenas sintéticos | gates automatizados e integração |
| Staging | projeto Firebase, domínios e CORS próprios; dados sintéticos ou cópia sanitizada autorizada | schema privado, secret manager, rehearsal, observabilidade representativa | E2E, carga básica, rehearsal e aprovação operacional |
| Produção | projeto Firebase/origens produtivos; export autorizado; sem seed | secret manager/workload identity, backup/PITR, alertas, freeze e change approval | somente após C7/C8 e go/no-go; writes só após C10 |

Configuração pública no bundle contém apenas Firebase Web e base URL da API.
Firebase Admin, chave BRAPI, conexão PostgreSQL, tokens e private keys ficam
server-side. Authorized Domains, issuer, audience e CORS precisam apontar para o
mesmo ambiente; origem de preview nunca recebe produção por conveniência.

### 6.1 Previews

Preview é um ambiente efêmero e não uma cópia informal de staging/prod. Deve
ter origem exata, projeto Firebase/configuração compatível ou auth nominalmente
desabilitada, API isolada e dados sintéticos. Se não houver isolamento provado,
preview só valida conteúdo estático e contratos sem login. Wildcard CORS,
`*.vercel.app` ou segredo de produção não são atalhos aceitáveis.

### 6.2 Configuração e promoção

Artefatos são imutáveis e promovidos por digest entre ambientes; configuração e
secrets são injetados no ambiente, nunca empacotados no frontend ou imagem
pública. Uma promoção registra commit, versão de contrato, digest, migration
compatível, aprovador e janela. Deploy de frontend e API pode ocorrer de forma
independente somente se a compatibilidade N/N-1 estiver comprovada.

## 7. CI/CD e releases independentes

### 7.1 Pipelines

| Pipeline | Gates | Artefato e publicação |
| --- | --- | --- |
| Frontend | lint, typecheck, unit/component, contract fixtures, a11y, build e scan de segredo/dependência | bundle estático imutável; publicação não executa migration |
| API | restore/build, analyzers/dependency scan, Domain/Application/API tests, contract, auth, PostgreSQL integration e health smoke | imagem/artefato versionado; rollout independente com compatibilidade |
| Migration | validar manifesto e transformador, fixtures, migration schema, dry-run, import/reconcile, backup/restore e aprovação | job explícito com role própria; nunca startup side effect |
| E2E/operacional | staging deploy, E2E selecionado, CORS, headers, observabilidade, carga básica e rollback drill conforme fase | relatório de gate; não promove sozinho produção |

O pipeline deve falhar fechado em teste de segurança, contrato incompatível,
divergência de reconciliação, segredo detectado, migration concorrente ou
artefato sem manifesto. O job de migration é acionado separadamente, com lock
de execução e janela; a API deve continuar capaz de iniciar sem aplicar schema.

### 7.2 Compatibilidade de release

1. Publicar primeiro a API que entende o contrato anterior e o novo, quando o
   rollout exigir N/N-1.
2. Publicar o frontend compatível e executar contract/E2E contra a API alvo.
3. Executar migration de schema/data como job controlado, sem alterar autoridade
   antes do gate correspondente.
4. Remover compatibilidade somente depois de tráfego antigo zero, soak e aceite.

Rollback de frontend/API antes do PONR deve preservar a leitura/escrita da
autoridade corrente. Depois do PONR, somente versões compatíveis com PostgreSQL
podem ser promovidas.

## 8. Observabilidade, SLO e runbooks

### 8.1 Sinais mínimos

Logs estruturados registram ambiente, serviço, rota normalizada, método, status,
duração, trace/correlation ID validado, versão, código de erro e contadores
agregados. Métricas e traces cobrem:

- disponibilidade e latência da API por endpoint/classe de resposta;
- `401/403/404/429/5xx`, CORS negado, refresh e falhas de token;
- PostgreSQL connection pool, lock wait/deadlock, erro de query e health;
- BRAPI timeout/retry/stale/unavailable/quota/circuit breaker;
- migration duration, batch, rows válidas/quarentena, digest e reconciliação;
- backup, restore drill, deploy, readiness/liveness e versão ativa.

`owner_hash` HMAC com chave exclusiva de telemetria pode ser usado para
correlação operacional. Authorization, JWT/claims, cookies, UID, e-mail,
payload financeiro, SQL parametrizado, secrets e stack trace não entram em
logs, métricas ou respostas. Correlation ID fornecido pelo cliente é validado e
substituído quando inválido.

### 8.2 SLO inicial e limites a calibrar

Estes valores são baseline para test/staging e proposta inicial para a 020; não
são promessa de produto antes de medir volume e custo. Cada SLO precisa de
owner, janela, query da métrica, severidade e ação registrada no runbook.

| Sinal | Alvo inicial | Alerta/blocker |
| --- | --- | --- |
| API readiness | 99,5% na janela de 30 dias de staging/prod | qualquer falha sustentada por 5 min; blocker durante cutover |
| API p95 de reads saudáveis | ≤ 500 ms em carga sintética representativa | p95 > 1 s por 10 min ou erro 5xx acima de 2% |
| API p95 de writes | ≤ 750 ms fora de lock/retry | p95 > 1,5 s por 10 min; investigar antes de C10 |
| 5xx da API | < 1% em 15 min | ≥ 2% por 5 min; interromper rollout |
| divergência de reconciliação | 0 inexplicada | qualquer divergência bloqueia C8/C9 |
| backup/restore | restore dentro do RTO aprovado e RPO comprovado | qualquer restore não reproduzível bloqueia go/no-go |
| BRAPI | erros/timeouts dentro do orçamento de quota definido | quota/circuit breaker acionado sem estado sanitizado |

RTO, RPO, retenção, soak, quota BRAPI e limiares finais continuam decisões da
020 e devem ser aprovados com volumetria, custo e capacidade real. Um dashboard
sem owner e ação não é evidência operacional.

### 8.3 Runbooks mínimos

Cada runbook tem sintoma, impacto, comando/consulta segura, owner, decisão de
parada, comunicação, rollback/forward fix e evidência sanitizada:

| Runbook | Sintoma/impacto | Ação segura e parada | Owner primário | Rollback/forward fix | Evidência e escalonamento |
| --- | --- | --- | --- | --- | --- |
| token inválido, revogação, usuário disabled e refresh | `401/503`, sessão interrompida ou risco de aceitar identidade inválida | falhar fechado, limitar a um refresh e parar writes sensíveis | responsável de API/segurança | corrigir provider/política; não aceitar token sem verificação | trace/código sanitizado; incidente, bloqueia C3 |
| CORS, domínio, Firebase project/issuer/audience | preflight negado ou token de ambiente cruzado | manter allowlist exata e parar promoção/host novo | operador de hosting/identidade | corrigir configuração e redeploy; não usar wildcard | captura de headers sem token; API, bloqueia C3/C9 |
| BRAPI timeout, quota, retry, stale/unavailable e circuit breaker | quotes lentas, quota excedida ou dados externos indisponíveis | timeout/retry bounded, circuit breaker e estado explícito | responsável de integração/API | forward fix/configurar quota; não prometer quote fresca | métrica de estado/duração; plantão, bloqueia C7 se ambíguo |
| PostgreSQL indisponível, pool, lock/deadlock e migration concorrente | erro 5xx, espera ou risco de transação concorrente | parar writes afetados, inspecionar pool/lock e não repetir `SELL` sem chave | operador de dados | liberar/fixar lock ou forward fix; sem bypass de role | health/lock wait/trace; API, bloqueia C6/C10 |
| migration parcial, quarentena, hash divergente e restore/PITR | batch incompleto, conflito ou dado não reconciliado | não promover, preservar batch e quarentena, retomar idempotente | operador de migração/dados | repetir batch/restore ou corrigir transformador; nunca descartar | manifesto, digest e códigos; release owner, bloqueia C8/C9 |
| backup não verificável e exercício de restore | ausência de prova de recuperação ou RPO/RTO | manter read-only/adiar go-no-go | operador de dados | refazer backup/restore e forward fix operacional | relatório de restore e tempos; release owner, bloqueia go/no-go |
| rotação de secrets, smoke e revogação da chave antiga | chave exposta, expirada ou artefato usando segredo antigo | redigir, congelar promoção e ativar sobreposição controlada | responsável de segurança | rotacionar, smoke com nova e revogar antiga | scan/rotação/auditoria; hosting, bloqueia C9/C10 |
| DNS/TLS/host, edge e health checks | indisponibilidade, certificado inválido ou loop | abortar troca, conservar autoridade vigente e reduzir tráfego | operador de hosting | restaurar edge/deploy/DNS conforme snapshot; não duplicar redirect | DNS/TLS/health smoke; release owner, aborta tráfego |
| rollback antes do primeiro write PostgreSQL | novo stack falha em read-only ou smoke | parar tráfego, preservar batch, remover fence só após segurança | release owner | voltar stack anterior e reabrir Firestore após smoke | checklist, horário e owner; dados, bloqueia C10 |
| incidente depois do PONR | erro em write PostgreSQL ou divergência pós-ativação | manter PostgreSQL como autoridade e congelar mudança arriscada | release owner + operador de dados | versão PostgreSQL, restore/PITR ou forward fix; nunca reabrir Firestore | primeiro write, logs redigidos e reconciliação; segurança/maintainer |

No estado atual, o **mantenedor do projeto** é o owner operacional de C0 e o
responsável por nomear ou acumular esses papéis nas fases futuras. A atribuição
por papel evita inventar uma equipe inexistente; nenhum gate deve ser aprovado
sem registrar a pessoa que assumiu o papel na janela.

## 9. Checkpoints C0–C11 e go/no-go

| Gate | Evidência obrigatória | Owner primário | Decisão e bloqueio |
| --- | --- | --- | --- |
| C0 — risco contido | aceite temporário somente dev/teste, dados sintéticos/descartáveis, owner operacional e condição de saída antes de usuário/dado real/staging/prod | mantenedor do projeto | bloqueia qualquer escrita patrimonial nova fora do escopo; backend alvo não replica `SELL` inseguro |
| C1 — discovery fechado | inventários, ERD, threat model, decisões de camada, identidade, segurança, testes e migração revisados | mantenedor + release owner | bloqueia 012–016 sem arquitetura/risco classificado |
| C2 — fundação | CI, frontend/API, PostgreSQL real, migration job separado, health e staging skeleton reproduzíveis | release owner + frontend/API/dados | bloqueia feature no alvo |
| C3 — auth E2E | token correto passa; issuer/audience/exp/alg/cross-user falham; CORS/401/404 e logs sanitizados | API/segurança | bloqueia dados privados na API |
| C4 — compatibilidade | golden master de ID, decimal, data, nanos, timestamp, Portfolio e erros | domínio/compatibilidade | bloqueia primeira slice |
| C5 — Portfolio | jornada completa, owner A/B, a11y/component/E2E, archive e reconciliação | slice Portfolio/frontend | bloqueia ledger |
| C6 — ledger confiável | `SELL` concorrente serializado, idempotência igual/divergente, append-only e locks provados | API/domínio + dados | bloqueia cutover funcional |
| C7 — paridade | BRAPI, posições, dashboards, estados, UX, a11y, performance e telemetria aprovados | release owner + integração/frontend | bloqueia migração produtiva |
| C8 — rehearsal | pré-cópia/import repetível dentro da janela, backup/restore, digest e zero divergência inexplicada | migração/dados + release owner | bloqueia go/no-go |
| C9 — read-only | fence efetivo, delta final carregado, dados reconciliados, novo stack read-only, smoke auth/owner/flows passa | release owner + dados/hosting | bloqueia primeiro write |
| C10 — writes PostgreSQL | troca de host/origem concluída, observabilidade ativa e primeiro write explicitamente registrado | release owner + dados | PostgreSQL vira autoridade; Firestore não volta a destino |
| C11 — retirement | soak sem tráfego/erro antigo, retenção/restore aprovados, scans e runbooks atualizados | release owner + mantenedor | só então remover legado e marcar ADRs superseded |

O go/no-go é uma decisão registrada por gate, não um “build verde”. Deve
conter versão de artefatos, responsáveis, janela, backup restaurável, batch e
delta, digest por owner, quarentena aceita/zero, smoke, métricas, riscos e
plano de abortar. Qualquer item obrigatório ausente mantém o estado
`blocked`/`read-only`.

## 10. Rehearsal, fence, cutover e rollback

### 10.1 Rehearsals

Antes de C8, executar pelo menos dois rehearsals com snapshots sintéticos ou
sanitizados de volume representativo:

1. medir extract/validate/transform/stage/load/reconcile e a janela;
2. interromper o loader em Owner, Portfolio, Asset e Transaction e retomar o
   mesmo `migration_batch_id`;
3. repetir o batch e provar no-op por hash; provocar conflito de mesma chave;
4. gerar cada classe de quarentena, incluindo órfão, duplicate identity,
   `SELL` inválido, timestamp ilegível e decimal fora do limite;
5. executar duas cargas concorrentes e provar locks/idempotência;
6. restaurar backup/PITR em banco descartável e repetir smoke/reconciliação;
7. injetar falha de token provider, BRAPI, migration, reconciliação, DNS e
   write após PONR; confirmar que o runbook para no ponto correto.

O rehearsal só passa quando a duração está dentro da janela aprovada, o digest
é estável, a quarentena tem decisão e não existe divergência inexplicada.

### 10.2 Sequência de cutover

1. Confirmar C7/C8, backup restaurável, owners de plantão, versão compatível e
   comunicação da janela.
2. Executar pré-cópia idempotente em staging e resolver divergências.
3. Anunciar freeze e bloquear writes patrimoniais no app/Rules antigos; verificar
   requests em voo e métricas de fence, não apenas uma flag visual.
4. Extrair delta final, validar/transformar, carregar staging e promover por
   owner somente depois das FKs e digest.
5. Iniciar frontend/API novos em read-only e executar smoke de auth, owner,
   Portfolio, Asset, Transaction, Quotes e dashboard.
6. Trocar hosts/origens e validar DNS/TLS/CORS, health, traces e alertas.
7. Registrar o primeiro write PostgreSQL e habilitar writes; este é o PONR.
8. Monitorar soak, reconciliação contínua, erro/latência, tráfego legado e
   incidentes antes de C11.

Preferir janela global por causa das FKs cruzadas. Cutover por owner só é
permitido com fence forte por owner, autoridade inequívoca e reconciliação
completa; cutover por tabela é sempre proibido.

### 10.3 Rollback honesto

**Antes do primeiro write PostgreSQL:** parar novo tráfego, manter o novo banco
read-only ou descartar o batch conforme retenção, preservar evidência, remover
o fence após confirmar segurança e reabrir Firestore. O PostgreSQL ainda não é
autoridade.

**Depois do primeiro write PostgreSQL:** não reabrir Firestore. Parar rollout,
voltar frontend/API para uma versão compatível com PostgreSQL, aplicar forward
fix ou restore/PITR validado, manter uma autoridade e executar reconciliação.
Reverse migration para Firestore exigiria projeto separado, nova carga e
aprovação explícita; não é procedimento de emergência. O alerta de write após
PONR bloqueia qualquer instrução que prometa rollback ao Firestore.

## 11. Tabletop de falhas

O tabletop é executado antes de C3, C8, C10 e C11, com owner, observador,
horário e decisão registrados sem dados sensíveis:

| Falha | Pergunta de decisão | Resultado esperado |
| --- | --- | --- |
| Token provider indisponível/revogação | Pode uma operação sensível seguir? | fail closed, `401/503` sanitizado, sem loop de refresh |
| BRAPI timeout/quota | O que a UI mostra e qual tráfego é permitido? | timeout bounded, stale/unavailable explícito, circuit breaker e alerta |
| Migration falha no meio | Pode retomar sem duplicar ou perder fatos? | batch não promovido, retomada idempotente, quarentena e owner |
| Reconciliação diverge | Quem decide promoção? | bloquear C8/C9, preservar origem, relatório por código e investigação |
| DNS/TLS/CORS falha | Como manter uma autoridade e reduzir exposição? | abortar troca, rollback de edge/deploy, smoke e comunicação |
| Write depois do PONR | O que não pode ser feito? | não reabrir Firestore; compatibilidade/restore/forward fix no PostgreSQL |
| Pool/lock/deadlock | O ledger pode aceitar retry? | transação/lock observável, idempotency key, sem duplicar `SELL` |
| Secret exposto/rotação | Qual credencial revogar e como provar? | redaction, rotação, smoke com nova chave, revogação antiga e scan |

Um tabletop sem decisão, responsável e evidência não fecha o gate.

### 11.1 Resultado do tabletop desta subtarefa

Em 2026-10-06 foi executado um tabletop documental, com walkthrough dos seis
cenários exigidos pela subtarefa e dos incidentes de pool/secret. Não houve
injeção em serviço, DNS, banco ou provider — isso está fora do escopo da 011 —,
mas cada cenário recebeu decisão, owner e evidência esperada:

| Cenário | Decisão registrada | Owner/resultado |
| --- | --- | --- |
| token provider falha | operação sensível falha fechada; read não faz loop de refresh | API/segurança; evidência `401/503` sanitizada |
| BRAPI falha | timeout/retry bounded, `stale` quando permitido, `unavailable` explícito e alerta de quota | integração/API; nenhum payload no log |
| migration falha | batch não promovido; retomar pelo `migration_batch_id` ou quarentenar, sem duplicar | migração/dados; relatório com código/hash |
| reconciliação diverge | bloquear C8/C9; não corrigir fato silenciosamente nem gravar Position | migração + release owner; digest e divergência sanitizados |
| DNS/CORS/TLS falha | abortar troca, manter autoridade vigente e restaurar edge/deploy conforme runbook | hosting; smoke sem segredo |
| write após PONR | não reabrir Firestore; usar versão PostgreSQL, restore/PITR ou forward fix | release + dados; primeiro write e autoridade registrados |
| pool/lock/deadlock | respeitar transação/idempotency key; não repetir `SELL` sem identidade estável | dados/API; traces e contagem, sem valores |
| secret exposto/rotação | redigir evidência, rotacionar, testar chave nova e revogar antiga | segurança/hosting; scan e smoke |

Resultado: não foram encontrados bloqueios de planejamento além das
implementações futuras já registradas como risco. O tabletop não é evidência de
que os controles funcionam em produção; ele é a aprovação do desenho para que
013–020 implementem e repitam os cenários em ambientes representativos.

## 12. Handoff e decisões abertas

- **013:** transformar os pipelines e comandos em jobs reproduzíveis; criar
  PostgreSQL local/test, health checks, artifacts e migration job separado.
- **014:** provar token, CORS, headers, rate limit, traces, refresh e cross-user
  no walking skeleton; publicar runbook de auth.
- **015:** implementar fixtures e comparador TS↔C#; resolver divergências apenas
  com evidência de limite e decisão rastreável.
- **016:** provar roles, schema privado, migration/reconcile, locks, pooling,
  RLS se adotada, backup/restore e planos de query em PostgreSQL real.
- **017–019:** anexar contract/component/E2E/a11y/telemetria a cada slice;
  congelar contrato somente após 012 e protótipo correspondente.
- **020:** escolher fornecedor de hosting, fechar CORS/domínios/Firebase por
  ambiente, RTO/RPO, retenção, soak, quota, secrets e executar rehearsals,
  freeze, fence, cutover e go/no-go.
- **021:** provar zero tráfego legado, retenção/restore e remover Next/Firestore
  patrimonial somente após o soak.

Continuam abertas, sem bloquear o planejamento: fornecedor final de hosting,
adoção definitiva de RLS, valores finais de SLO/rate limit, RTO/RPO, retenção,
duração de soak, estratégia global versus cohort e runner/bibliotecas exatos
de component/E2E. Nenhuma abertura autoriza dados reais em preview, wildcard
CORS, segredo no bundle, dual-write ou rollback ilusório.

## 13. Comandos de referência e evidência

### Baseline atual

Os comandos abaixo foram usados como validação documental/regressiva da base
existente; eles não provam a futura stack:

```bash
npm run test:domain
npm run test:positions
npm run test:positions-read
npm run test:dashboard-read
npm run test:financial-presentation
npm run test:quotes-adapter
npm run test:quotes-service
npm run test:quotes-route
npm run test:rules
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git diff --check
```

O typegen precede o `tsc`, conforme `AGENTS.md`. O script de Rules exige o
Firestore Emulator e os casos `PERMISSION_DENIED` esperados não são falhas do
teste.

### Comandos alvo por fase

Os nomes são contratos de gate, não comandos já disponíveis neste checkout:

```bash
# frontend
npm run lint && npm run typecheck && npm run test:unit && npm run test:component
npm run test:contract && npm run test:e2e:staging && npm run build

# API/.NET
dotnet restore && dotnet build --configuration Release
dotnet test --configuration Release --collect:"XPlat Code Coverage"
dotnet format --verify-no-changes

# PostgreSQL/migration
dotnet ef migrations script --idempotent
dotnet test --filter Category=PostgreSQL
./migration validate --manifest <sanitized-manifest>
./migration dry-run --batch <batch-id>
./migration reconcile --batch <batch-id>
./backup restore --target <disposable-database>

# operação
curl --fail-with-body <health-url>/live
curl --fail-with-body <health-url>/ready
git diff --check
```

Os comandos reais serão definidos na 013/015/016 e devem ser registrados com
versão, ambiente, commit, resultado e link para o artefato. Não declarar como
executado qualquer comando futuro ou qualquer restore/deploy que não tenha
evidência observável.

## 14. Definição de pronto da estratégia

- toda fase 013–021 tem níveis de teste, ambiente, owner e evidência;
- harness TS↔C#, PostgreSQL real, migration/reconcile, backup/restore e E2E têm
  critérios claros, sem fingir que existem hoje;
- frontend, API e migration job podem ser publicados independentemente sem
  migration no startup e com compatibilidade de release;
- local/test/staging/prod têm isolamento, Firebase, secrets, CORS e política de
  dados explícitos;
- logs, traces, métricas, SLO, alertas, redaction e runbooks são observáveis;
- C0–C11, rehearsals, freeze/fence, read-only, PONR e rollback estão definidos;
- o cutover mantém uma autoridade por owner e nunca promete retorno ao Firestore
  após write PostgreSQL;
- decisões abertas estão encaminhadas para 012–021 e não foram resolvidas por
  escolha prematura de fornecedor.
