# 011 — Identidade, autenticação e segurança

- **Ticker:** `011`
- **Estado:** baseline proposta para validação na 014/016; não é implementação
- **Escopo:** Firebase Authentication → Firebase ID Token → ASP.NET Core →
  `CurrentOwner` → Application → PostgreSQL, incluindo threat model e controles
  operacionais.

## 1. Decisões e limites

1. Firebase Authentication continua sendo o IdP e a experiência de login no
   browser. Não será introduzido Supabase Auth, sessão por cookie ou outro IdP.
2. A API aceita somente **Firebase ID Token** em `Authorization: Bearer`. Google
   OAuth access token, refresh token, ID de usuário, email ou qualquer identidade
   enviada pela request não autentica nem escolhe owner.
3. O browser acessa a API; nunca acessa PostgreSQL/Supabase, credenciais de
   conexão, Firebase Admin ou BRAPI. Firestore direto no browser é legado e fica
   bloqueado para a experiência alvo após a paridade.
4. Autenticação é necessária, mas não é autorização. `AuthGate`, redirect,
   CORS, host routing e CSP não são boundary suficiente para dados patrimoniais.
5. As decisões abaixo são requisitos arquiteturais testáveis, não fechamento dos
   endpoints da 012. O ADR de identidade/autorização da spec 011 permanece
   `proposed` até a evidência da 014 e dos testes com PostgreSQL real.

## 2. Trust boundaries e ativos

```text
Usuário / browser não confiável
  ├─ Firebase Web SDK ──> Firebase Authentication
  └─ HTTPS + Bearer ID Token ──> ASP.NET Core API
                                  ├─ valida token e cria CurrentOwner
                                  ├─ Application autoriza e valida invariantes
                                  ├─ Infrastructure/EF ──> PostgreSQL privado
                                  └─ adapter fixo ──> BRAPI
```

| Boundary | Ativo protegido | Regra de confiança |
| --- | --- | --- |
| Browser ↔ Firebase | sessão, refresh e ID Token | O SDK administra a sessão; o backend nunca recebe o refresh token. XSS é ameaça ao contexto do usuário e exige CSP, dependências controladas e nenhum segredo no bundle. |
| Browser ↔ API | identidade, comandos, respostas | TLS, Bearer e validação server-side. Body/query/header são entrada hostil; o cliente não escolhe owner. |
| API ↔ PostgreSQL | fatos patrimoniais e tenancy | Schema privado, roles separadas, queries owner-scoped, FKs compostas e append-only de Transaction. RLS, se adotada, é defesa adicional. |
| API ↔ BRAPI | credencial, quota e disponibilidade | Chamada somente no backend, destino configurado/fixo, timeout, retry limitado, cache e resposta sanitizada. |
| Proxy ↔ API | origem, IP e encaminhamento | Só proxies/cidrs explicitamente confiáveis podem fornecer `X-Forwarded-*`; esses headers não são identidade. |

Ativos principais: Firebase project/configuração por ambiente, identidade
verificada, ledger/decimais/timestamps, credenciais de Firebase Admin/PostgreSQL/
BRAPI, quota do provider, logs e evidências de reconciliação. Logs, traces,
respostas de erro e relatórios de migração não devem conter token, UID bruto,
email, segredo, payload financeiro ou valor financeiro.

## 3. Fluxos normativos

### 3.1 Login

1. O usuário inicia Google Sign-In no Firebase Web SDK.
2. Firebase autentica o provedor e o SDK mantém/restaura a sessão no browser.
3. A UI pode redirecionar para a aplicação quando `onAuthStateChanged` informar
   usuário autenticado. Esse redirect é UX, não prova de autorização.
4. Nenhum token, email ou UID fornecido pela UI é persistido manualmente em
   `localStorage`; o SDK gerencia a sessão e o refresh token.
5. A aplicação só considera a sessão útil para a API após obter um ID Token
   atual com `getIdToken()`.

O Firebase project usado pelo browser e o aceito pela API devem ser o mesmo no
ambiente. A configuração pública (`apiKey`, `authDomain`, `projectId` e
equivalentes) não é segredo, mas continua sujeita a authorized domains, quotas e
isolamento entre projetos.

### 3.2 Refresh

- O SDK deve obter o ID Token atual sem que a aplicação manipule o refresh token.
- Uma resposta `401` pode disparar **um** `getIdToken(true)` e repetir somente uma
  leitura idempotente ou comando que tenha idempotency key estável.
- Um write não idempotente nunca é repetido cegamente após `401`; o cliente deve
  consultar o resultado por chave idempotente ou informar falha ao usuário.
- Se o refresh falhar, limpar o estado local com `signOut`, interromper requests
  privadas e retornar à UX de login. Loops de refresh são proibidos.
- O backend não implementa refresh e não armazena refresh token.

### 3.3 Request autenticada

```text
Firebase Web SDK
  → getIdToken()
  → Authorization: Bearer <Firebase ID Token>
  → TLS / proxy confiável
  → middleware de autenticação ASP.NET Core
  → validação criptográfica e de claims
  → CurrentOwner(subject)
  → autorização owner-scoped
  → query EF com owner + resource ID
```

O middleware autentica antes de executar a operação. O caso de uso recebe um
`CurrentOwner` já verificado e não recebe `ownerId` do DTO. Para cada recurso,
Application combina o owner do contexto com o identificador opaco da rota; uma
query nunca busca por ID sozinho e depois tenta filtrar em memória.

### 3.4 `401`, `403`, `404` e falhas de infraestrutura

| Situação | Resposta | Política |
| --- | --- | --- |
| Bearer ausente, malformado, assinatura/claims inválidos, expirado, revogado ou usuário desabilitado | `401` | Problem Details com código estável e sem motivo criptográfico detalhado. Não redirecionar a API para login. |
| Token válido, mas ação exige papel/capacidade que o ator não possui | `403` | Usar somente quando a existência do recurso não for revelada por essa resposta. |
| Recurso inexistente **ou pertencente a outro owner** em operação owner-scoped | `404` indistinguível | Evita enumeração A/B. O tempo e o corpo devem ser suficientemente uniformes; não informar “outro usuário”. |
| Body inválido ou limite excedido depois da autenticação | `400` | Código de validação sem ecoar segredo/payload sensível. |
| Dependência de autenticação/configuração indisponível | `503` | Fail closed; nunca aceitar o token sem a checagem exigida. |
| Rate limit excedido | `429` | Incluir `Retry-After` quando seguro; não revelar contadores internos ou owner bruto. |

`403` é para autorização contextual conhecida, não para denunciar que um ID
pertence a outro owner. O contrato Problem Details é provisório até a 012/014,
mas esses princípios não são opcionais.

### 3.5 Logout e revogação

- `signOut` encerra a sessão local do Firebase e remove a capacidade do browser de
  obter novos tokens, mas não invalida instantaneamente ID Tokens já emitidos.
- Revogação administrativa/de incidente usa a capacidade de revogar refresh
  tokens do Firebase para o usuário afetado. A API não promete que logout local
  revogue tokens já apresentados.
- Reads comuns usam a validade criptográfica e temporal do token. Writes
  financeiros, ações destrutivas, mudança de ownership/capacidade e operações
  de incidente exigem também a checagem de revogação/usuário disabled conforme
  a política abaixo.
- Se a checagem de revogação exigida estiver indisponível, a operação sensível
  falha fechada; não há fallback para “token ainda parece válido”.

## 4. Validação do Firebase ID Token

### 4.1 Claims obrigatórias

O validador deve aceitar uma configuração exata por ambiente e rejeitar qualquer
variação não prevista:

| Elemento | Requisito |
| --- | --- |
| Tipo | Firebase **ID Token**; não Google access token nem token de outro Firebase project. |
| Assinatura | Chave pública oficial do Firebase, com rotação suportada pelo provider. Falhar em `alg=none`, HMAC, algoritmo não allowlisted ou chave desconhecida. |
| Algoritmo | `RS256` explicitamente allowlisted; não inferir o algoritmo do token. |
| Issuer | Exatamente `https://securetoken.google.com/{FIREBASE_PROJECT_ID}` do ambiente. |
| Audience | Exatamente `FIREBASE_PROJECT_ID` do ambiente; projeto de dev/test/staging/prod não é intercambiável. |
| `exp` | Presente e numérico; aceitar somente se `now <= exp + skew`, rejeitando quando `now > exp + 60s` no baseline. |
| `iat` | Presente e numérico; rejeitar se `iat > now + skew` (mais de 60 s no futuro); idade máxima e coerência temporal devem ser testadas. |
| `sub` | Presente, não vazio, string válida e usada como única origem de `CurrentOwner`. |
| `nbf`/tempo correlato | Se presente, respeitar a mesma janela de skew; não aceitar token ainda não válido. |
| Estado do usuário | Para a operação que exige revogação, consultar Firebase Admin e rejeitar usuário disabled/revogado. |

Clock skew inicial: **60 segundos**, configurável somente por ambiente e nunca
ilimitado. A configuração deve ter teste de fronteira (`-1`, exatamente `60` e
acima de `60` segundos), relógio sincronizado e alerta operacional. A API não
autoriza por `email`, `email_verified`, `name`, `picture`, `firebase.sign_in_provider`
ou claims arbitrárias; papéis customizados só podem ser mapeados por uma
allowlist server-side e não substituem o owner do `sub`.

### 4.2 JwtBearer versus Firebase Admin

| Critério | ASP.NET `JwtBearer` | Firebase Admin |
| --- | --- | --- |
| Assinatura, issuer, audience, exp/iat/sub | Excelente quando metadata, algoritmo e parâmetros são fixados explicitamente | `verifyIdToken` encapsula a semântica Firebase e os certificados |
| Rotação de chaves | Metadata/JWK cacheado pelo middleware; exige configuração/teste de refresh | SDK administra certificados e cache |
| Revogação/disabled | Não é prova por si só; token assinado pode continuar válido até expirar | `verifyIdToken(token, true)` consulta o estado necessário |
| Latência/indisponibilidade | Adequado para hot path local após cache | Revocation check é mais caro e depende de serviço/estado do Firebase |
| Integração com ASP.NET | Pipeline padrão, claims principal e policies | Adapter/serviço explícito e mapeamento próprio de identidade |
| Risco de configuração | Aceitar issuer/audience/alg incorretos se defaults não forem fechados | Menor risco de semântica Firebase, mas ainda requer projeto correto e segredo server-side |

Política proposta para a 014:

1. Encapsular a validação em uma porta `IFirebaseIdentityVerifier`, retornando
   somente claims verificadas e um `CurrentOwner`; Domain não referencia Firebase.
2. O baseline do walking skeleton pode usar Firebase Admin para todos os requests,
   incluindo revogação nos cenários sensíveis, para reduzir risco de semântica
   divergente e provar o fluxo E2E.
3. O alvo operacional é JwtBearer para validação criptográfica local de requests
   comuns, com parâmetros acima, e Firebase Admin com revocation check para
   writes financeiros/destrutivos e ações de incidente. A troca só ocorre após
   teste de rotação de chaves, métricas de latência/erro e paridade de claims.
4. Nenhum caminho pode degradar de revocation check para validação não revogada
   silenciosamente. Se a indisponibilidade impedir distinguir os estados, falha
   fechada.

Essa sequência mantém a implementação inicial simples sem transformar uma futura
otimização de hot path em decisão de segurança implícita.

## 5. `CurrentOwner`, tenancy e autorização

Representação conceitual:

```text
VerifiedFirebaseIdentity
  └─ sub verificado
      └─ CurrentOwner { FirebaseUid: opaque string }
          └─ Owner row / tenant context
```

- `CurrentOwner` nasce exclusivamente do `sub` após validar assinatura, issuer,
  audience e tempo. O UID bruto não é logado.
- Body, query string, route header, custom header, email e claims de UI não podem
  substituir nem complementar esse owner. Um campo `ownerId` recebido é ignorado
  ou rejeitado como contrato inválido, nunca usado.
- Criação sempre injeta o owner do contexto. Leitura/alteração/exclusão consulta
  `(owner_uid, resource_id)` e retorna `404` quando não houver correspondência.
- FKs compostas impedem `Transaction` apontar para Portfolio/Asset de outro owner;
  a API e o banco devem manter a defesa em profundidade descrita no modelo
  relacional de 011.
- Roles iniciais são mínimas: usuário autenticado owner-scoped; papel de runtime
  da API sem DDL/migration; papel separado para migration; operador de incidente
  auditado e sem virar owner arbitrário. Não há papel administrativo global no
  produto sem requisito, policy e trilha de auditoria explícitos.

### RLS candidata no PostgreSQL

RLS é uma camada adicional, não substitui autenticação, `CurrentOwner`, queries,
FKs ou permissões. Se adotada:

1. dentro de cada transação, a API define `SET LOCAL app.current_owner = ...`
   usando o `sub` verificado e uma conexão do pool; o valor deve ser passado por
   binding/setter parametrizado (`set_config` equivalente), nunca interpolado em
   SQL;
2. policies comparam esse valor à coluna `owner_uid`; não existe `auth.uid()` do
   Supabase, pois Supabase Auth não faz parte do desenho;
3. o papel runtime não recebe `BYPASSRLS`, `SUPERUSER`, propriedade de tabela,
   DDL ou acesso ao schema de migration; o papel de migration é separado e não é
   usado pela API;
4. toda conexão é resetada pelo pool e não reutiliza contexto de outro request;
5. o comportamento é provado em PostgreSQL real com pooling, duas conexões,
   transações abortadas e tentativas A/B. SQLite/EF InMemory não são evidência.

O desenho pode optar por não habilitar RLS se os testes de roles, views/queries e
permissões oferecerem defesa equivalente; nesse caso a decisão e a justificativa
devem ser registradas no ADR. Nunca expor schema patrimonial à anon key, Data API
ou browser.

## 6. CORS, headers e proxy trust

### CORS por ambiente

Cada ambiente declara uma allowlist exata de origens HTTPS, por exemplo o app
canônico daquele ambiente e uma origem de preview isolada. A lista não aceita
`*`, regex ampla, origem pública de marketing por conveniência ou origem de
produção em preview. O marketing host não recebe acesso implícito à API.

- `Access-Control-Allow-Origin` só é emitido para origem allowlisted.
- `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers` ficam limitados
  ao necessário (`Authorization`, `Content-Type` e métodos da slice).
- `Access-Control-Allow-Credentials` permanece ausente/`false`: Bearer em header
  não exige credencial de cookie cross-origin.
- Preflight de origem não allowlisted é negado sem revelar configuração; o
  endpoint não trata preflight como autenticação.
- CORS nunca substitui `401`, autorização ou CSRF/XSS controls.

O frontend estático só recebe config pública Firebase e base URL da API. Cada
preview usa projeto/dados sintéticos ou isolados e uma allowlist própria.

### Headers e conteúdo

Baseline da API/site, ajustada ao hosting sem remover proteção por causa de
compatibilidade:

- HTTPS obrigatório; HSTS somente em host sob controle e após verificar a cadeia
  de TLS.
- `Content-Security-Policy` com `default-src 'self'`, sem `unsafe-eval`, scripts
  allowlisted e `connect-src` explícito para Firebase/API; popup Google e frames
  necessários devem ser allowlisted de forma mínima, não por wildcard.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `frame-ancestors 'none'`/equivalente e
  `Permissions-Policy` mínima.
- API retorna JSON/Problem Details e `Cache-Control: no-store` para respostas
  autenticadas; nunca HTML de erro que possa refletir input.
- CSP começa em Report-Only no ambiente de teste para ajustar Firebase/popup e
  vira enforce antes do dado real; reports não carregam token ou payload.

O reverse proxy deve confiar em `X-Forwarded-For`, `X-Forwarded-Proto` e
`X-Forwarded-Host` somente de redes/proxies conhecidos e configurados. A API não
aceita `X-Forwarded-For` arbitrário como prova de IP, host ou owner. Se a cadeia
for ambígua, usar o peer direto ou falhar fechado para controles que dependam de
IP; nunca transformar um header do cliente em identidade.

## 7. Rate limit e BRAPI

Rate limit é defesa de disponibilidade e quota, não autorização. O desenho exige
chaves independentes por IP confiável, owner verificado e endpoint/custo; em
múltiplas réplicas o contador precisa ser distribuído ou o limite deve ser
explicitamente apenas local. A primeira implementação deve tornar os valores
configuráveis e publicar `429`/`Retry-After`, sem fixá-los no frontend.

Baseline inicial para teste de carga sintético, a calibrar com quota BRAPI e
telemetria antes de staging:

| Escopo | Política inicial | Observação |
| --- | --- | --- |
| IP não autenticado | 60 requests/minuto por rota de superfície | Evita abuso de endpoints públicos e de autenticação/erro. |
| IP autenticado | 120 requests/minuto por API | Atua mesmo quando muitos owners compartilham NAT. |
| Owner | 300 requests/minuto no conjunto de API; limites por slice podem ser menores | A chave é o owner verificado, nunca um campo da request. |
| `POST /quotes` por owner | 30 chamadas/minuto, máximo 20 `assetIds` por chamada | Deduplicar IDs antes do custo e retornar `429` sem chamar BRAPI quando exceder. |
| `POST /quotes` por IP | 60 chamadas/minuto | Complementa o limite por owner contra contas/IPs abusivos. |
| BRAPI global | orçamento configurado abaixo da quota contratada, com alerta e circuit breaker | Não prometer proteção global usando cache/fila process-local. |

Os números são ponto de partida operacional, não contrato de produto: 014 deve
medir p95, quota, cardinalidade e falsos positivos e registrar alterações. A
limitação deve ocorrer antes do upstream; timeout e retry são bounded (baseline
atual: timeout 3 s e no máximo um retry transitório). Cache, stale-if-error e
deduplicação não podem retornar quote de Asset que falhou na autorização. A
resposta do provider é mapeada para estados/códigos sanitizados; body, key,
símbolo e payload bruto da BRAPI não entram em log ou resposta.

## 8. Secrets, configuração e logging

### Configuração e ciclo de vida de secrets

| Ambiente | Firebase | API/DB/BRAPI | Regra |
| --- | --- | --- | --- |
| Local | projeto dev/test e authorized domains locais | secret store local ignorado ou workload de desenvolvimento | Dados sintéticos; nunca copiar produção. |
| Test | projeto isolado ou emulador explicitamente configurado | secrets efêmeros, DB descartável | Fixtures determinísticas; sem dados reais. |
| Staging | projeto próprio e origens próprias | secret manager, schema privado e dados sintéticos/sanitizados autorizados | Não compartilhar credencial/config de produção. |
| Produção | projeto/origens produtivos | secret manager/workload identity, rotação e auditoria | Nenhum secret no bundle, imagem pública, log ou migration report. |

`NEXT_PUBLIC_*`/`VITE_*` pode conter somente configuração pública Firebase e URL
da API. Firebase Admin, private key, client email, BRAPI key, connection string,
password e tokens ficam server-side. Preferir workload identity/secret manager a
arquivo JSON. Rotação deve permitir sobreposição curta de chaves, smoke
autenticado, revogação da chave antiga e confirmação de que nenhum artefato ainda
depende dela.

O arquivo local ignorado com nome de credencial Firebase Admin não deve ser aberto,
copiado ou documentado. A verificação permitida é apenas de rastreamento/histórico
por nome e de regras de ignore; ausência de ocorrência rastreada não prova que
nenhuma cópia tenha sido exposta externamente. Se houver evidência, preservar a
evidência sem conteúdo, revogar/rotacionar a credencial e revisar histórico,
backups e artefatos. O conteúdo nunca entra nesta documentação.

### Redaction e telemetria

Logs estruturados podem registrar timestamp, ambiente, rota normalizada, método,
status, duração, correlation/trace ID, código de erro, resultado do rate limit e
contadores agregados. Podem usar `owner_hash` HMAC com chave exclusiva de
telemetria e rotação, se a correlação operacional for necessária; não registrar
UID bruto.

São obrigatoriamente redigidos: `Authorization`, JWT inteiro ou claims, cookies,
refresh token, email, UID, private key, API keys, connection strings, body de
commands, valores/quantidades/preços/taxas, payload BRAPI, SQL com parâmetros,
stack trace em resposta e IDs que não sejam necessários ao operador. Exceções
devem ser sanitizadas antes do sink; correlation ID vindo do cliente é validado e
substituído quando inválido. Métricas devem agregar por código/endpoint, sem
dimensão de alta cardinalidade que reconstitua pessoas ou patrimônio.

## 9. Threat model e abuse cases

| Ameaça/ator | Caminho | Controle alvo | Evidência exigida |
| --- | --- | --- | --- |
| Token ausente, forjado, expirado, de outro projeto ou Google access token | Browser → API | RS256/issuer/audience/exp/iat/sub, projeto exato, `401` fail closed | Matriz negativa de tokens e logs sem token |
| Usuário A troca owner/UID/email para acessar B | Request → Application/DB | `CurrentOwner` do `sub`, query/FK composta, RLS candidata, `404` indistinguível | Testes API/DB A/B com body/query/header adulterados |
| Enumeração de IDs | Respostas e timing | `404` igual para inexistente/outro owner, códigos sanitizados, rate limit | Teste estatístico/contratual de A/B e ausência de detalhe |
| Revogação ou usuário disabled após emissão | Token ainda válido | Revocation check em operações sensíveis, fail closed e política de TTL | Teste revoke/disabled/read/write e runbook de incidente |
| Replay/duplicação de write após 401 | Refresh/retry | idempotency key e no blind retry; append-only | Teste de retry igual/divergente |
| XSS rouba sessão no browser | UI/dependências | CSP, sem token em localStorage/manual, headers, revisão de dependências | CSP enforce, teste de headers e E2E de sessão |
| CSRF usando cookies | Browser cross-site | Bearer sem cookie credentials; CORS exato | Preflight/origem e ausência de sessão por cookie |
| Abuso de Quotes/BRAPI | API → provider | limites IP/owner/endpoint, lote 20, timeout/retry/cache/circuit breaker | Teste 429, quota e chamada upstream limitada |
| Proxy falsifica IP/host | Headers encaminhados | trusted proxy allowlist; ignorar headers externos | Teste de cadeia confiável e spoofing |
| Secret em bundle/log/artefato | Build/telemetria | env público restrito, secret manager, redaction, scan e rotação | Inspeção de bundle/logs e rotation drill |
| Admin/DB papel amplo ou pool vazando owner | API → PostgreSQL | roles privadas, `SET LOCAL`, reset de pool, RLS/testes reais | Teste com duas conexões e rollback/abort |
| Firestore legado aceita SELL fora do reducer | SDK/browser legado | C0 somente dev/testes sintéticos; fence e backend confiável antes de dados reais | Teste Rules + decisão C0 + gate de saída |
| BRAPI/IdP indisponível | Dependência externa | timeouts, fail closed em auth/revogação, estados sanitizados e runbook | Chaos/tabletop sem fallback inseguro |

### C0 e transição

No estado atual, Rules garantem owner/schema e append-only de documento, mas não
agregam o ledger; uma `SELL` schema-válida acima do saldo pode ser gravada por
SDK direto. A decisão C0 é aceitação temporária **somente em dev/testes**, com
 dados sintéticos/descartáveis, sem writes patrimoniais em staging/produção ou
 dados reais. A saída ocorre antes do primeiro usuário ativo, dado real,
 avanço para staging/produção ou cutover. Após o fence, o browser não escreve
 Firestore e PostgreSQL/API é a autoridade única.

## 10. Matriz de testes e gates

| Área | Casos mínimos | Gate/evidência |
| --- | --- | --- |
| Token | válido; assinatura/chave/alg inválidos; issuer/audience/projeto incorretos; expirado; `iat` futuro; `sub` ausente/vazio; access token; clock skew; revogado/disabled | Unit do mapeamento + integração ASP.NET/Firebase; nenhum caso negativo vira `200`. |
| Owner/autorização | A lê/escreve próprio; A tenta ID/body/query/header de B; inexistente versus B; papel insuficiente; Portfolio arquivada; Transaction append-only | API contract + PostgreSQL real + respostas `401/403/404`; nenhum UID escolhido pelo cliente. |
| RLS/pooling | owner context em duas conexões, transação abortada, conexão reutilizada, ausência de `SET LOCAL`, papel migration/runtime | Integração PostgreSQL real; RLS é adicional e não há cross-user A/B. |
| Refresh/logout | refresh forçado uma vez; retry de read; write sem retry cego; signOut; token revogado | E2E de sessão e runbook de revogação; sem loop e sem refresh token no backend. |
| CORS/headers/proxy | origem permitida/negada; preflight; wildcard; credentials; CSP; headers; `X-Forwarded-*` spoofado/confiável | Testes de API/infra por ambiente e captura de headers. |
| Rate/BRAPI | IP/owner/endpoint, lote 20, burst, multi-réplica, `429`, `Retry-After`, timeout/retry/cache/quota | Teste de carga sintético e métricas sem payload. |
| Logs/secrets | Authorization, claims, emails, UID, body financeiro, key, exception e SQL parametrizado | Teste de redaction, inspeção de bundle/sinks e rotation drill; sem segredo real. |
| Threat/tabletop | IdP/BRAPI/DB/proxy indisponível, replay, enumeração, XSS, write pós-point-of-no-return | Walkthrough assinado antes do C3/C8/C10/C11 conforme o roadmap. |

## 11. Handoff e decisões abertas

- **014:** implementar o walking skeleton, porta de identidade, CORS, Problem
  Details, rate limit, headers, traces e testes token/A-B; decidir com evidência
  se o hot path já pode usar JwtBearer ou permanece Admin.
- **015/016:** manter `CurrentOwner` fora do Domain, mapear owner/roles/schema,
  provar FKs, permissões, pooling e RLS candidata em PostgreSQL real.
- **020:** separar Firebase project/origins/secrets por ambiente, executar
  rotation drill, write fence, smoke e observabilidade sem dados sensíveis.
- **021:** só remover Firestore/Admin legado após paridade, cutover, soak e
  revogação dos secrets antigos.

Decisões deliberadamente abertas: valores finais de rate limit conforme quota e
carga, adoção definitiva de RLS, hosting/trusted proxy, duração do TTL operacional
e o ponto em que JwtBearer substitui Admin no hot path. Nenhuma abertura permite
aceitar owner do cliente, wildcard CORS, segredo no frontend, Supabase Auth ou
write patrimonial sem boundary confiável.
