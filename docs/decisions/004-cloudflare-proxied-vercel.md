# 004 — Cloudflare Proxied diante da Vercel

- **Status:** accepted
- **Escopo:** fase 004, exclusivamente operação de domínios/DNS/TLS da task
  `004-04`
- **Ticker relacionado:** `004`
- **Data de registro:** 2026-09-23

## Contexto

O projeto Next.js usa Vercel como hosting e Cloudflare como DNS autoritativo.
Os três hostnames produtivos são `reservaclara.com.br`,
`www.reservaclara.com.br` e `app.reservaclara.com.br`. A política de host,
redirects de documento e `X-Robots-Tag` continua pertencendo a
`src/proxy.ts`, conforme a decisão `003`.

Durante a preparação anterior, a Vercel estava redirecionando o apex para
`www`, enquanto `src/proxy.ts` redireciona `www` para o apex. Essa combinação
criava conflito na canonicalização e risco de loop. O conflito foi corrigido;
o smoke atual com Cloudflare em DNS only passou. A correção não autoriza mover
redirect para Cloudflare nem alterar o proxy da aplicação.

A documentação atual da Vercel não recomenda reverse proxy externo como regra
geral porque ele reduz visibilidade do firewall e pode afetar identificação do
IP de origem. Ela documenta, contudo, Cloudflare como provedor de Verified
Proxy Lite, com `CF-Connecting-IP` nativo, e define pré-condições para ACME e
TLS. A decisão humana confirmada aceita esse trade-off e escolhe Cloudflare
Proxied diante da Vercel.

Esta decisão refina somente a política operacional da task `004-04`. Não cria
serviço, não altera código e não libera funcionalidades de segurança ou cache
fora do escopo abaixo.

## Decisão

1. Usar **Cloudflare Proxied** para os registros A/AAAA/CNAME que servem os
   três hostnames HTTP(S) oficiais, depois de confirmar na Vercel os records
   atuais do projeto. Não fixar IP, CNAME ou TXT nesta documentação.
2. Manter MX, TXT, CAA, DNSSEC e registros não relacionados preservados. Tipos
   que não servem tráfego web permanecem DNS-only; registros de verificação de
   domínio não serão proxied por conveniência.
3. Configurar Cloudflare SSL/TLS em **Full (strict)**. O trecho Cloudflare →
   Vercel deve usar HTTPS na porta 443 e validar certificado vigente cujo CN ou
   SAN corresponda ao hostname solicitado. **Flexible não é permitido**.
4. Preservar hostname original e SNI ao encaminhar a requisição para a Vercel.
   Usar o `CF-Connecting-IP` nativo do Cloudflare como header de IP de cliente
   aceito pelo Verified Proxy Lite da Vercel; não adicionar tratamento ou
   confiança desse header em `src/` nesta task.
5. Manter a validação ACME da Vercel disponível em
   `/.well-known/acme-challenge/*`: encaminhar HTTP na porta 80 para a Vercel,
   sem redirect HTTP→HTTPS nesse caminho, cache, autenticação ou rewrite. A
   condição vale para emissão e renovação.
6. Não criar nem configurar **Redirect Rules, Workers, Page Rules, WAF,
   Access ou cache customizado** nesta task. A camada externa não pode duplicar
   a matriz de `src/proxy.ts`.
7. Manter o apex como domínio canônico/primário na configuração da Vercel,
   sem redirect apex → `www`. O alias `www` deve chegar à aplicação para que o
   `308` `www` → apex continue sendo emitido somente por `src/proxy.ts`.

## Escopo

### Incluído

- Snapshot não secreto de RRsets, TTL, proxy status, MX/TXT/CAA/DNSSEC e
  configuração anterior necessária para rollback.
- Associação e verificação dos três domínios no mesmo projeto Vercel.
- Aplicação, após checkpoint humano, de Proxied somente nos registros web
  correspondentes aos targets atuais exibidos pela Vercel.
- Configuração e validação de Full (strict), HTTPS até a origem, host/SNI,
  `CF-Connecting-IP` e caminho ACME.
- Smoke de DNS, TLS, HTTP, redirects e ausência de loop antes de aceitar a
  topologia proxied.

### Excluído

- Alteração em `src/`, `public/`, `next.config.ts`, `vercel.json` ou
  dependências.
- Redirects de aplicação fora de `src/proxy.ts`, canonicalização externa ou
  regras para contornar o conflito apex/`www`.
- Redirect Rules, Workers, Page Rules, WAF, Access, rate limiting e cache
  customizado do Cloudflare.
- OAuth, Firebase Authorized Domains, dados financeiros e qualquer mudança nas
  tasks 004-05 a 004-09.
- Valores reais de DNS, certificados, environment variables, tokens,
  credenciais ou IPs de usuários em documentação/evidências.

## Responsabilidades

| Camada | Responsabilidade após decisão |
| --- | --- |
| Cloudflare | DNS autoritativo, proxy dos registros web, TLS de borda e conexão HTTPS com a origem; encaminhamento de `Host`, SNI e `CF-Connecting-IP`. |
| Vercel | Projeto único, deployment, associação dos domínios, certificado da origem, resposta ACME e logs padrão. |
| `src/proxy.ts` | Classificação de host, `www` → apex, público → app, app `/` → `/login`, allowlist e robots; sem alteração nesta task. |

## Configuração mínima

1. **Vercel:** confirmar os três domínios no mesmo projeto, apex como primário,
   configuração sem apex → `www`, certificado válido por hostname e targets
   atuais exibidos no painel. Copiar targets somente para execução operacional;
   não registrá-los em spec, decisão ou task.
2. **Cloudflare DNS:** preservar registros não relacionados; criar/ajustar
   somente os records exigidos pela Vercel; marcar como Proxied os registros
   web de apex, `www` e `app`; deixar MX/TXT/CAA e verificações DNS-only.
3. **Cloudflare SSL/TLS:** selecionar Full (strict) e confirmar que a origem
   Vercel responde HTTPS com certificado não expirado e hostname compatível.
4. **Proxy de requisição:** não reescrever o `Host`, manter SNI do hostname
   oficial e confirmar que a integração Cloudflare envia
   `CF-Connecting-IP` à Vercel sem configuração de aplicação.
5. **ACME:** confirmar que uma requisição HTTP para
   `/.well-known/acme-challenge/*` chega à Vercel na porta 80, sem redirect,
   cache, autenticação ou rewrite. Se configuração existente violar essa
   condição, parar; não criar exceção via Rule, Worker ou Page Rule nesta task.
6. **Políticas adicionais:** confirmar ausência de configuração nova de
   Redirect Rules, Workers, Page Rules, WAF, Access e cache customizado para os
   hostnames desta task.

## Consequências

### Positivas

- Cloudflare fica entre cliente e origem, ocultando os endereços de origem
  retornados diretamente pelo DNS e fornecendo a camada de rede/edge escolhida.
- O tráfego visitante → Cloudflare e Cloudflare → Vercel permanece HTTPS; Full
  (strict) impede aceitar uma origem com certificado inválido.
- `CF-Connecting-IP` permite à Vercel reconhecer o IP real no caminho de proxy
  suportado, sem mudar o contrato do aplicativo.
- O único dono de redirects continua sendo `src/proxy.ts`, evitando nova
  canonicalização para `www` ou ponte público/app concorrente.

### Negativas e riscos aceitos

- Há uma camada adicional de edge: headers, cache padrão, limites, diagnóstico
  e latência podem diferir do smoke DNS only.
- A documentação da Vercel alerta que reverse proxy reduz visibilidade do
  firewall e pode encaminhar tráfego abusivo ao projeto; `CF-Connecting-IP`
  melhora identificação, mas não elimina esse trade-off.
- Full (strict) depende de certificado Vercel válido para cada hostname; erro
  de emissão, expiração ou mismatch pode resultar em erro 526.
- Emissão/renovação ACME depende de HTTP na porta 80 e do caminho reservado
  sem redirect ou cache; uma alteração futura fora desta task pode quebrá-la.
- DNS proxied responde endereços anycast do Cloudflare, não o target Vercel;
  TTL, propagação e diagnóstico devem distinguir painel de DNS público.
- Rollback de proxy e TLS não desfaz caches DNS, certificados já emitidos ou
  propagação em resolvers.

## Rollback

Preparar snapshot antes de alterar qualquer registro:

1. Registrar, sem segredos, domínio/target/status de cada record, TTL, proxy
   status, MX/TXT/CAA/DNSSEC, modo SSL/TLS, estado dos três domínios na Vercel,
   certificado, deployment saudável e smoke DNS-only que serviu de baseline.
2. Diante de erro HTTP, header, host, RSC, asset ou redirect, retornar os
   registros web afetados para DNS-only usando os targets confirmados da Vercel.
   Não remover MX/TXT/CAA e não alterar `src/proxy.ts` como primeira ação.
3. Diante de falha Full (strict), mismatch, expiração ou 526, manter o tráfego
   fora do proxy até o certificado Vercel estar válido; restaurar o modo SSL
   anterior documentado. Não usar Flexible como atalho.
4. Diante de falha ACME, voltar DNS-only para permitir diagnóstico/emissão,
   confirmar novamente o caminho HTTP-01 e só depois reavaliar Proxied. Não
   mascarar o problema com redirect, Worker, Page Rule ou cache.
5. Diante de loop apex/`www`, confirmar que o apex continua primário na Vercel,
   remover qualquer configuração externa concorrente se existir e repetir o
   smoke; não trocar o redirect fixo do proxy da aplicação.
6. Após rollback, repetir DNS, HTTPS, certificado, ACME de teste e matriz
   mínima de redirects. Registrar horário, TTL, propagação, camada causadora e
   efeito residual.

## Validação e aceite

A task só pode sair de `pending` após aplicação externa e confirmação humana.
Painel salvo, target copiado ou screenshot isolado não equivalem a tráfego
proxied validado.

### Configuração

- Os três domínios estão verificados no mesmo projeto Vercel e o apex não
  redireciona para `www`.
- O painel Cloudflare mostra Proxied nos três registros web, preserva registros
  não relacionados e não mostra configuração nova de Redirect Rules, Workers,
  Page Rules, WAF, Access ou cache customizado.
- SSL/TLS está em Full (strict); a origem responde HTTPS na porta 443 com
  certificado válido e correspondente ao hostname.
- O caminho de ACME permanece alcançável na porta 80 sem redirect, cache,
  autenticação ou rewrite.

### Rede e aplicação

- `dig`/painel confirmam targets Vercel configurados, enquanto a resolução
  pública proxied retorna endereços Cloudflare esperados para registros web.
- Requests HTTPS para apex, `www` e `app` passam sem aviso de certificado e sem
  loop; requests HTTP comuns chegam a HTTPS.
- A origem recebe `Host`/SNI do hostname oficial e `CF-Connecting-IP`; logs de
  validação não devem registrar IP de usuário, cookies, tokens ou credenciais.
- `https://reservaclara.com.br/` não recebe `Location` para `www`; `www` segue
  `308` para o apex; ponte público/app e app `/` preservam os destinos fixos de
  003.
- Uma sondagem ACME com token inexistente retorna resposta da Vercel sem
  redirect; `404` é esperado para token inexistente, mas não prova sozinho
  emissão ou renovação real.
- Landing, login, dashboard, assets e RSC respondem como no smoke anterior;
  divergência causada pelo edge bloqueia aceite e aciona rollback.

### Comandos de referência

```bash
dig NS reservaclara.com.br
dig A reservaclara.com.br
dig CNAME www.reservaclara.com.br
dig CNAME app.reservaclara.com.br

curl -sS -D - -o /dev/null --max-redirs 0 https://reservaclara.com.br/
curl -sS -D - -o /dev/null --max-redirs 0 https://www.reservaclara.com.br/
curl -sS -D - -o /dev/null --max-redirs 0 https://app.reservaclara.com.br/
curl -sS -D - -o /dev/null --max-redirs 0 \
  http://reservaclara.com.br/.well-known/acme-challenge/004-04-probe
```

Adaptar tipo de consulta aos records efetivos mostrados pela Vercel. Não
registrar cookies, headers privados, IPs de clientes, tokens ou valores de
environment variables.

## Evidências e estado desta decisão

- A decisão humana de usar Cloudflare Proxied com Vercel e Full (strict) está
  registrada e foi aplicada pelo responsável; o aceite final ainda depende do
  snapshot e das evidências da task `004-04`.
- O conflito anterior apex → `www` da Vercel versus `www` → apex do
  `src/proxy.ts` foi corrigido antes desta revisão; smoke atual em DNS only
  passou. Isso é baseline, não validação de Proxied.
- Capturas já existentes em
  [`004-04-01-domain-vercel.png`](../tasks/004-production-deployment/evidences/004-04-01-domain-vercel.png),
  [`004-04-02-domain-vercel.png`](../tasks/004-production-deployment/evidences/004-04-02-domain-vercel.png),
  [`004-04-03-domain-vercel.png`](../tasks/004-production-deployment/evidences/004-04-03-domain-vercel.png)
  e [`004-04-domain-cloudflare.png`](../tasks/004-production-deployment/evidences/004-04-domain-cloudflare.png)
  são evidências de painel/intermediárias; não substituem validação de
  certificado, ACME, header e cadeia HTTP após Proxied.
- Nenhum código foi alterado. No momento do registro da decisão, nenhum serviço
  externo, DNS, TLS, domínio ou configuração de painel havia sido alterado;
  posteriormente, o responsável aplicou Proxied e Full (strict), conforme esta
  decisão, e o smoke público passou.

## Referências oficiais consultadas

Consultadas em 2026-09-23:

- [Vercel — Reverse Proxy Servers and Vercel](https://vercel.com/docs/security/reverse-proxy): Cloudflare usa `CF-Connecting-IP` nativo no Verified Proxy Lite; ACME deve passar pela porta 80 sem redirect e sem cache; a origem deve usar HTTPS; Flexible pode causar loop; Full (strict) é recomendado.
- [Vercel — Troubleshooting domains](https://vercel.com/docs/domains/troubleshooting): targets devem ser os exibidos no projeto; HTTP-01 para domínios não wildcard é tratado pela Vercel; com proxy, o caminho ACME deve chegar à Vercel sem cache, autenticação, rewrite ou redirect; DNS-only é alternativa de diagnóstico.
- [Cloudflare — Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/): exige HTTPS na origem e certificado vigente, confiável e compatível com CN/SAN; falha de requisito pode produzir 526.
- [Cloudflare — Proxy status](https://developers.cloudflare.com/dns/proxy-status/): Proxied encaminha tráfego web pela rede Cloudflare e responde anycast; somente A/AAAA/CNAME são proxied; MX/TXT permanecem DNS-only; TTL proxied é controlado pelo Cloudflare.
- [Decisão 003 — separação por host](003-separacao-host-publico-app.md): `src/proxy.ts` é dono de host routing, redirects e robots.
- [Spec 004 — Production Deployment](../specs/004-production-deployment.md): contratos de domínios, TLS, DNS e rollback da fase.
