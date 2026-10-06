# 011-05 — Definir identidade, autenticação e segurança

- **Ticker:** `011`
- **Número:** `05`
- **Status:** `completed`

## Objetivo e resultado esperado

Definir o fluxo Firebase Authentication → ID Token → ASP.NET Core e o modelo de
autorização/tenancy, incluindo threat model, erros, CORS, secrets, logs e defesa
em profundidade no PostgreSQL.

## Requisitos cobertos

- Firebase permanece no frontend para experiência de autenticação.
- Backend valida token e estabelece identidade/autorização.
- Ownership nunca é aceito do cliente.
- Segurança, privacidade, rate limit e cross-user A/B.
- Configuração por ambiente e ausência de Supabase Auth.

## Escopo

### Incluído

- Assinatura, algoritmo, issuer, audience, exp/iat/sub e clock skew.
- JwtBearer/Firebase Admin, refresh e política de revogação.
- `CurrentOwner`, resource authorization e 401/403/404.
- CORS, CSP/security headers, rate limits e proxy trust.
- Roles/schema/RLS candidata, secrets e logging sanitizado.
- Threat model dos fluxos atuais e alvo.

### Excluído

- Implementar autenticação/API.
- Migrar para Supabase Auth, cookies de sessão ou outro IdP.
- Definir account deletion futura além dos impactos de segurança.

## Dependências

- 011-02, 011-03 e insumos de tenancy da 011-04.

## Arquivos e símbolos prováveis

- Leitura: `src/lib/firebase/client.ts`, auth components,
  `src/server/firebase-admin.ts`, Quote route/reader, Rules, `.env.example`,
  proxy e testes de route/rules.
- Saída provável: `docs/architecture/011/identity-security.md` e threat model.

## Passos de implementação

1. Desenhar fluxos de login, refresh, request, 401 e logout.
2. Definir validações obrigatórias do Firebase ID Token.
3. Comparar JwtBearer e Firebase Admin por operação/revogação.
4. Definir CurrentOwner derivado somente de `sub` verificado.
5. Definir autorização owner-scoped e resposta contra enumeração.
6. Definir CORS por ambiente, sem wildcard/credentials desnecessários.
7. Definir rate limits por IP/owner/endpoint e proteção BRAPI.
8. Avaliar RLS com conexão/pooling real como defesa em profundidade.
9. Definir secret management, redaction e telemetria permitida.
10. Revisar risco do arquivo de credencial local sem ler/divulgar conteúdo.

## Testes e comandos de validação

- Matriz de token: válido, expirado, outro projeto/audience/issuer, alg errado,
  malformado, usuário disabled/revogado conforme política.
- Casos cross-user A/B em API e banco.
- Testes planejados de CORS, rate limit, logs e pooling/RLS.
- Threat-model walkthrough e abuse cases.
- `git diff --check`.

## Definição de pronto

- Fluxo e trust boundaries estão explícitos.
- UID/email do request nunca definem owner.
- Revogação, refresh e erros têm política clara.
- CORS/secrets/logging/RLS têm requisitos testáveis.
- Nenhum token, segredo ou identificador real entrou na documentação.

## Riscos e cuidados

- Não confundir Google access token com Firebase ID Token.
- Bearer reduz CSRF por cookies, mas aumenta importância de XSS/CSP.
- Logout não é revogação instantânea de todos os tokens.
- CORS não substitui autenticação/autorização.

## Registro da execução

### Status

`completed`

### Arquivos alterados

- `docs/architecture/011/identity-security.md` — fluxo Firebase ID Token → API,
  validação de claims, comparação JwtBearer/Firebase Admin, `CurrentOwner`,
  autorização/erros, CORS, headers, rate limits, BRAPI, roles/RLS, secrets,
  redaction e threat model.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-05-definir-identidade-e-seguranca.md` — status e registro desta execução.
- `docs/tasks/011-revisao-roadmap-evolucao-arquitetural/011-00-overview.md` — checklist e progresso da fase.
- Nenhum arquivo de produção, banco, deploy, configuração externa ou segredo foi
  alterado.

### Decisões e desvios

- Firebase Authentication permanece no browser; a API aceita somente Firebase ID
  Token e deriva `CurrentOwner` do `sub` verificado.
- O baseline recomenda validar o walking skeleton inicialmente com Firebase Admin;
  o alvo operacional permite JwtBearer no hot path comum e Firebase Admin com
  revocation check em operações sensíveis, sem fallback inseguro.
- Foi definido clock skew inicial de 60 segundos, issuer/audience/projeto exatos,
  `RS256`, `exp`/`iat`/`sub` obrigatórios e rejeição de access token Google.
- Recurso inexistente e recurso de outro owner usam `404` indistinguível; `403`
  fica reservado para autorização contextual sem revelar existência.
- Rate limits foram registrados como baseline configurável para teste sintético,
  não como quota final: 20 assets por lote de Quotes, limites por IP/owner/rota e
  orçamento BRAPI devem ser calibrados antes de staging.
- RLS foi mantida como defesa candidata, condicionada a teste com pooling real,
  `SET LOCAL` transacional e roles sem `BYPASSRLS`; não substitui `CurrentOwner`.
- O arquivo local de credencial Firebase foi tratado somente pelo nome/rastreamento
  e sem abrir ou divulgar conteúdo, conforme o risco da spec.

### Comandos executados e resultados

- `functions.glob`/`functions.grep`/`functions.read` — **passaram**; confirmaram
  spec, overview, oito subtarefas, ticker `011`, checklist único com oito itens,
  dependências concluídas e os boundaries atuais de Firebase/Quotes/Rules.
- Revisão read-only por agente `explore` — **passou**; confirmou o fluxo atual,
  `verifyIdToken`, owner-scoped Asset reader, lote 20, ausência de revogação
  explícita/CORS/rate limit e o teste atual de `SELL` acima do saldo nas Rules.
- `git ls-files '*firebase-adminsdk*'` — **passou**; nenhuma ocorrência rastreada
  foi encontrada. O arquivo local não foi aberto; isto não é auditoria de exposição
  externa.
- `npm run test:quotes-route` — **passou**, 8 testes; cobriu Bearer, `401`,
  ownership derivado, cross-user e proxy/host.
- `npm run test:rules` — **passou**, 19 testes no Firestore Emulator; os logs de
  `PERMISSION_DENIED` são os casos negativos esperados.
- `npm run lint` — **passou**.
- `npm exec next typegen && npx tsc --noEmit` — **passou**; typegen e typecheck
  sem erros.
- `npm run build` — **passou**; Next.js 16.3.5 compilou e gerou as rotas atuais.
- `git diff --check` — **passou** após a documentação final.
- Revisão independente `review` — **APROVADO**, sem findings bloqueantes; a
  revisão confirmou estrutura SDD, cobertura, consistência com o modelo relacional,
  ausência de dados sensíveis e escopo documental.
- Não houve mudança de comportamento: a alteração é documental e os gates
  comprovam a ausência de regressão no baseline atual, não a futura implementação
  ASP.NET Core/PostgreSQL.

### Resultados e evidências

- `docs/architecture/011/identity-security.md` explicita login, refresh, request,
  401, logout/revogação e limites de trust boundary.
- A matriz de token cobre assinatura/algoritmo, issuer, audience, `exp`, `iat`,
  `sub`, skew, token revogado/disabled e a distinção de access token.
- `CurrentOwner` nunca depende de body/query/header/email; a política de
  autorização cobre owner-scoped queries, cross-user A/B e respostas contra
  enumeração.
- CORS, CSP/security headers, trusted proxy, rate limit por IP/owner/endpoint,
  BRAPI, roles, schema privado, RLS/pooling, secrets e redaction têm requisitos
  observáveis e testes planejados.
- O threat model cobre login/refresh/Bearer, XSS/CSRF, enumeração, replay,
  proxy, BRAPI, Firestore legado, PostgreSQL/pooling e point of no return.

### Riscos residuais

- A validação ASP.NET Core, JwtBearer/Firebase Admin, CORS, rate limiting,
  headers, RLS e logging ainda não foram implementados; pertencem à 014/016.
- Revocation check adiciona latência/dependência operacional e a escolha final do
  hot path depende de métricas, rotação de chaves e testes de paridade.
- Valores finais de rate limit, RLS, trusted proxy e hosting permanecem abertos;
  os números documentados são somente baseline calibrável.
- Não houve acesso a dados reais, secrets, logs produtivos ou PostgreSQL nesta
  subtarefa; nenhuma exposição de credencial pode ser concluída apenas pela
  inspeção de nome/histórico local.

### Handoff

- `011-06` pode usar a política de sessão expirada, `401`, estados de erro e
  restrições de cliente HTTP sem tratar os exemplos como contrato final.
- `011-07` deve transformar a matriz de testes, rotação, CORS, observabilidade,
  trusted proxy e threat tabletop em gates e runbooks.
- `011-08` deve registrar/revisar o ADR de identidade, autorização, revogação,
  CORS e tenancy, mantendo as escolhas abertas marcadas como `proposed`.
