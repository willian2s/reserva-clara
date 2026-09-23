# 004-04 — Configurar domínios, DNS e TLS

- **Ticker:** `004`
- **Número:** `04`
- **Status:** `completed`
- **Decisão operacional:** [004 — Cloudflare Proxied diante da Vercel](../../decisions/004-cloudflare-proxied-vercel.md) (`accepted`; aplicada e revisada)

## Objetivo e resultado esperado

Associar os três hostnames oficiais ao projeto Vercel e, condicionado à decisão
004, usar Cloudflare Proxied como reverse proxy diante da Vercel, com SSL/TLS
Full (strict), obtenção/renovação ACME funcional e HTTPS válido sem duplicar a
política de redirects do `src/proxy.ts`.

Configuração externa, evidências visuais e smoke público foram confirmados;
limitações observacionais de headers e renovação futura foram aceitas e a
revisão independente aprovou a task.

## Requisitos cobertos

- Apex `reservaclara.com.br`.
- `www.reservaclara.com.br`.
- `app.reservaclara.com.br`.
- DNS Cloudflare, propagação, proxy status, TLS e certificado.
- Reverse proxy Cloudflare Proxied, preservação de `Host`/SNI e
  `CF-Connecting-IP` conforme integração documentada; headers brutos não são
  expostos pela UI padrão da Vercel.
- ACME HTTP-01 na porta 80 sem redirect, cache, autenticação ou rewrite no
  caminho `/.well-known/acme-challenge/*`.
- Responsabilidades sem redirects concorrentes.
- Rollback antes da mudança pública.

## Escopo incluído

- Snapshot de registros atuais, TTL, proxy status, MX/TXT/CAA e DNSSEC sem
  expor credenciais.
- Adicionar os três domínios ao mesmo projeto Vercel.
- Consultar a Vercel para obter os targets/records atuais por domínio.
- Usar Cloudflare Proxied para os registros web dos três hostnames, conforme a
  decisão 004 e após checkpoint humano; preservar registros não relacionados e
  tipos sempre DNS-only, como MX/TXT/CAA.
- Configurar Cloudflare SSL/TLS em Full (strict), com HTTPS até a origem Vercel,
  certificado válido e hostname/SNI preservados.
- Usar `CF-Connecting-IP` nativo do Cloudflare no caminho suportado pela Vercel,
  sem tratamento ou logging de headers em código.
- Confirmar ACME HTTP-01 sem redirect/cache/auth/rewrite no caminho reservado,
  inclusive para renovação.
- Aplicar somente alterações mínimas na zona Cloudflare após checkpoint
  humano; não criar Redirect Rules, Workers, Page Rules, WAF, Access ou cache
  customizado nesta task.
- Aguardar verificação e validar certificado/HTTPS em cada host.

## Escopo excluído

- Cloudflare Redirect Rules, Workers, Page Rules, WAF, Access, cache customizado
  ou qualquer regra externa adicional. O reverse proxy Proxied está incluído
  somente conforme a decisão 004; não aplicar configuração fora dela.
- Hardcode de IP/CNAME/TXT na documentação ou código.
- Alterar `src/proxy.ts`, `next.config.ts` ou criar `vercel.json`.
- Testar OAuth; depende de 004-05 e 004-07.

## Dependências

- 004-01, 004-02 e 004-03 concluídas.
- Decisão 004 aceita e aplicada após checkpoint humano.
- Deployment Vercel saudável no hostname gerado.
- Usuário com acesso autorizado a Vercel e Cloudflare.
- Rollback de DNS e deployment conhecido antes de salvar alterações.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: `PUBLIC_HOST`, `APP_HOST`, `WWW_HOST`, redirects e matcher.
- `docs/decisions/004-cloudflare-proxied-vercel.md`: decisão, configuração
  mínima, rollback e critérios de validação do reverse proxy.
- Vercel Project Settings → Domains, DNS/SSL, Deployments.
- Cloudflare DNS Records, proxy status, TTL, SSL/TLS e ausência de regras
  externas adicionais.
- Evidência nesta task; nunca conteúdo de tokens ou env.

## Passos de implementação

1. Registrar estado DNS atual e identificar registros não relacionados que não
   podem ser removidos: RRsets, TTL, MX/TXT/CAA, DNSSEC, proxy status e fonte.
2. Humano confirma apex, `www` e `app` no mesmo projeto Vercel, com o apex como
   domínio primário e sem redirect apex → `www`.
3. Inspecionar cada domínio e copiar somente para execução os valores fornecidos
   pela Vercel; não fixá-los na spec, nesta task ou na decisão.
4. Confirmar documentação oficial atual sobre apex, CNAME, ACME/certificado,
   proxy Cloudflare, Full (strict), `CF-Connecting-IP`, TTL e preservação de
   `Host`/SNI.
5. No checkpoint humano, configurar os records web com os valores efetivos da
   Vercel e marcar Cloudflare como Proxied; manter MX/TXT/CAA e verificações
   DNS-only. Não criar Redirect Rules, Workers, Page Rules, WAF, Access ou
   cache customizado.
6. Configurar SSL/TLS Cloudflare em Full (strict), confirmar HTTPS até a Vercel
   na porta 443 e validar certificado correspondente a cada hostname. Não usar
   Flexible.
7. Confirmar pela documentação do Verified Proxy Lite, pelo estado `Proxy
   Detected` e pelo smoke que o caminho Cloudflare/Vercel está ativo; a UI
   padrão da Vercel não expõe `CF-Connecting-IP`, Host ou SNI brutos. Não criar
   logging de headers em código. Confirmar também que
   `/.well-known/acme-challenge/*` em HTTP/80 chega à Vercel sem redirect,
   cache, autenticação ou rewrite. Não criar bypass por regra.
8. Aguardar propagação e estado `verified/valid` no painel Vercel; não iniciar
   OAuth enquanto certificado estiver pendente.
9. Repetir smoke de apex, `www` e app: apex não pode voltar a redirecionar para
   `www`; `www → apex` continua sendo responsabilidade de `src/proxy.ts`.
10. Registrar status, timestamps, TTL, proxy status, certificado, ACME e
    decisão de rollback sem registrar secrets ou IPs de usuários.

## Testes e comandos de validação

- `dig`/ferramenta equivalente para apex, `www` e `app`.
- Inspeção de domínio na Vercel mostrando status verificado e deployment alvo.
- Inspeção Cloudflare mostrando Proxied somente nos registros web, Full (strict)
  e preservação dos registros não relacionados.
- GET/HEAD HTTPS em cada hostname, sem seguir redirects inicialmente.
- Browser confirma certificado válido e ausência de aviso.
- Requests HTTP comuns verificam encaminhamento para HTTPS sem loop; o caminho
  `/.well-known/acme-challenge/probe` deve chegar por HTTP/80 sem redirect,
  cache, autenticação ou rewrite e pode retornar `404` para token inexistente.
- Documentação oficial Vercel confirma `CF-Connecting-IP` nativo para Cloudflare
  Verified Proxy Lite; `Proxy Detected`, TLS por hostname e smoke confirmam o
  caminho. Logs padrão não expõem headers brutos; não registrar IP de usuário.
- Matriz mínima de redirects: apex `/` sem `Location` para `www`, `www` `/`
  com `308` para apex, público app-only com `307` para app e app `/` com `307`
  para `/login`.
- Verificação de ausência de Redirect Rules, Workers, Page Rules, WAF, Access e
  cache customizado aplicados a estes hosts.
- Não usar IP/target genérico se painel fornecer valor específico.

## Definição de pronto

- Os três domínios pertencem ao mesmo projeto Vercel.
- DNS responde com os records efetivos exigidos pela Vercel.
- Os records web estão Cloudflare Proxied, sem proxy em registros não web.
- Registros existentes não relacionados foram preservados.
- Cloudflare está em Full (strict), com HTTPS até origem Vercel, certificado
  válido e preservação de `Host`/SNI/`CF-Connecting-IP` respaldada pela
  integração documentada; ausência de inspeção de headers brutos é limitação
  observacional aceita.
- ACME HTTP-01 funciona na porta 80 sem redirect, cache, autenticação ou
  rewrite no caminho reservado.
- Certificados válidos e HTTPS acessível nos três hosts.
- Não há Redirect Rules, Workers, Page Rules, WAF, Access ou cache customizado
  novo; não há redirect externo duplicado e a matriz 003 continua responsável
  por `www`, público e app.
- Snapshot e rollback estão registrados.

Configuração e smoke foram validados com evidência de painel, snapshot
Cloudflare, confirmação humana no browser e requests públicos. Aceite final
aguarda resolução dos bloqueios registrados pela revisão independente.

## Riscos e cuidados

- Não aplicar valor sugerido por tutorial antigo; usar inspeção atual do projeto.
- Apex, CNAME flattening e subdomínios podem ter regras distintas; validar cada
  hostname isoladamente.
- A decisão 004 aceita Cloudflare Proxied, mas a camada pode mudar cadeia TLS,
  headers, cache padrão, limites e `Host`; validar preservação e não adicionar
  cache customizado.
- Flexible entre visitante e origem pode criar loop HTTP/HTTPS; Full (strict)
  exige certificado Vercel válido e pode retornar 526 quando houver mismatch.
- ACME pode falhar se port 80 sofrer redirect ou se o caminho reservado for
  cacheado, autenticado ou reescrito; bloqueio exige parada, não regra paralela.
- UI/logs padrão Vercel não expõem headers brutos; `CF-Connecting-IP` fica
  respaldado pela documentação do Verified Proxy Lite, sem confiança adicional
  dentro da aplicação. Instrumentação foi deliberadamente excluída.
- Vercel pode reaplicar redirect apex → `www`; confirmar apex primário antes e
  depois do proxy para não reabrir o conflito com `www` → apex.
- `308` pode ficar cacheado; validar antes da publicação e lembrar propagação no
  rollback.
- MX/TXT/CAA/DNSSEC podem pertencer a serviços fora da fase; nunca apagar em
  bloco.

## Checkpoint humano

O responsável com acesso confirmou alteração e verificação real. O painel foi
correlacionado com DNS propagado, Proxied efetivo, Full (strict), ACME, TLS e
smoke sem loop; a integração documentada preserva Host/SNI e fornece
`CF-Connecting-IP` no caminho suportado pela Vercel.

## Evidências e estado atual da execução

- **Data:** 2026-09-23.
- A decisão humana registrada em
  [`004-cloudflare-proxied-vercel.md`](../../decisions/004-cloudflare-proxied-vercel.md)
  tornou Proxied o escopo desta task e foi aplicada pelo responsável.
- A causa anterior foi registrada: Vercel apex → `www` conflitava com
  `src/proxy.ts` `www` → apex. O conflito foi corrigido e o smoke atual com DNS
  only passou; isso não comprova a configuração Proxied.
- Capturas de painel e snapshot:
  [`004-04-01-domain-vercel.png`](evidences/004-04-01-domain-vercel.png),
  [`004-04-02-domain-vercel.png`](evidences/004-04-02-domain-vercel.png),
  [`004-04-03-domain-vercel.png`](evidences/004-04-03-domain-vercel.png) (captura
  intermediária apex → `www`) e
  [`004-04-domain-cloudflare.png`](evidences/004-04-domain-cloudflare.png),
  [`004-04-dns-cloudflare.png`](evidences/004-04-dns-cloudflare.png),
  [`004-04-waf-cloudflare.png`](evidences/004-04-waf-cloudflare.png) e
  [`004-04-domain-vercel-without-proxy.png`](evidences/004-04-domain-vercel-without-proxy.png)
  (captura atual após correção; nome histórico do arquivo). As capturas finais
  de Proxied, DNS, regras e Vercel foram arquivadas, junto com
  [`004-04-deployment.png`](evidences/004-04-deployment.png) e logs sanitizados
  por host:
  [`004-04-log-reserva-clara.png`](evidences/004-04-log-reserva-clara.png),
  [`004-04-log-www-reserva-clara.png`](evidences/004-04-log-www-reserva-clara.png)
  e [`004-04-log-app-reserva-clara.png`](evidences/004-04-log-app-reserva-clara.png).
  Essas capturas comprovam deployment `Ready`, Host e rotas/status; headers
  brutos e renovação futura continuam limitações observacionais aceitas.
- Documentação oficial consultada em 2026-09-23:
  [Vercel reverse proxy](https://vercel.com/docs/security/reverse-proxy),
  [Vercel SSL e renovação](https://vercel.com/docs/domains/working-with-ssl),
  [Vercel domain troubleshooting](https://vercel.com/docs/domains/troubleshooting),
  [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
  e [Cloudflare proxy status](https://developers.cloudflare.com/dns/proxy-status/).
- `git diff --check` passou para as alterações rastreadas desta revisão; não
  foram executados deploy, lint, typecheck ou build porque nenhum arquivo de
  código foi alterado por esta subtarefa. A alteração em
  `src/app/(marketing)/page.tsx` é pré-existente e fora do escopo.
- A configuração externa foi aplicada pelo responsável: três records web
  Cloudflare Proxied, SSL/TLS `Full (strict)` e `Always Use HTTPS` desligado.
- O responsável confirmou browser sem aviso TLS nos três hosts; snapshot final
  registrou nove records, proxy status, TTL, MX/TXT e rollback. As capturas de
  regras confirmam ausência de regras customizadas e o WAF não está contratado.
- O status desta subtarefa é `completed`; revisão independente final retornou
  `approve`.

## Execução e evidências atuais

- **Data/hora da validação pública:** 2026-09-23, aproximadamente 19:11 UTC.
- **Configuração observada:** respostas públicas passaram a usar `server:
  cloudflare`; DNS público retornou endereços anycast Cloudflare; Vercel exibiu
  `Proxy Detected` nos três domínios. Aviso é esperado pela decisão 004.
- **HTTPS:** apex `/` retornou `200`; `www` retornou `308` para
  `https://reservaclara.com.br/`; app `/` retornou `307` para `/login`.
- **Cadeias finais:** apex `200` sem redirect; `www` `200` após um redirect;
  app `/login` `200` após um redirect.
- **HTTP:** os três hosts retornaram `308` para HTTPS, sem loop.
- **ACME:** probe inexistente em HTTP e HTTPS retornou `404`, sem redirect, com
  `X-Vercel-Acme-Ips` e `cf-cache-status: DYNAMIC`; `404` é esperado para token
  inexistente e não prova emissão/renovação real sozinho.
- **Certificado observado:** handshake TLS validado nos três hosts; certificado
  Let's Encrypt com `notAfter=2026-12-13`; hostname verification via `curl`
  passou sem `-k`.
- **Comandos executados:** `dig @1.1.1.1` para A/CNAME dos três hosts;
  `curl` HEAD sem seguir redirects; `curl -L` com limite de redirects; `curl`
  HTTP/HTTPS no probe ACME; `openssl s_client`/`openssl x509` para subject,
  issuer e validade.
- **Resultado:** smoke proxied passou; não houve `526`, `403`, loop, erro TLS
  ou perda de rota observável.
- **Follow-up 2026-09-23, aproximadamente 19:52 UTC:** HTTP para app `/`,
  `/login` e `/dashboard` retornou `308` para HTTPS; HTTPS app `/dashboard`
  retornou `200`; público `/dashboard` retornou `307` para app. Isso resolve
  verificação anterior de HTTPS incompleto.

### Estado atual e bloqueios

- Snapshot final, evidência de painel e confirmação visual foram
  registrados sem secrets ou IPs de usuários.
- `CF-Connecting-IP`, Host e SNI estão respaldados pela documentação e pelo
  estado `Proxy Detected`; a ausência de diagnóstico/log bruto na UI padrão foi
  aceita pelo responsável como limitação observacional, sem adicionar código.
- Renovação ACME futura não é observável por probe `404` nem por tela dedicada
  no painel; evidência aceita combina documentação oficial de renovação
  automática Vercel, domínio em configuração válida, certificado Let's Encrypt
  vigente e caminho ACME sem redirect/cache.
- **Rollback registrado:** o responsável confirmou o procedimento reversível:
  abrir Cloudflare → DNS Records e desligar o proxy dos três records web,
  preservando names, targets, tipos e TTL; MX/TXT/CAA permanecem intactos.
  Capturas em `evidences/` registram records e proxy status. Rollback não exige
  remover records nem alterar Vercel, `src/proxy.ts` ou SSL/TLS Full (strict).

## Revisão independente

- **Resultado inicial:** `changes_requested`; bloqueios tratados e aceitos.
- **Bloqueio 1:** resolvido por decisão humana: aceitar documentação oficial,
  `Proxy Detected` e smoke como evidência, sem instrumentar headers brutos.
- **Bloqueio 2:** resolvido por decisão humana: aceitar documentação oficial de
  renovação automática, configuração válida, certificado vigente e probe ACME
  sem redirect/cache; não existe tela dedicada de renovação no painel.
- **Bloqueio 3:** resolvido por confirmação humana e evidências arquivadas; o
  rollback é desligar Proxied nos três records web na página DNS, preservando
  records e targets.
- Findings posteriores sobre HTTP app e captura apex foram resolvidos pelo
  follow-up: HTTP `/dashboard` retorna `308` e a captura apex antiga está
  explicitamente rotulada como intermediária.
- **Resultado final:** `approve`, sem findings restantes. Riscos residuais de
  observabilidade permanecem documentados e aceitos.

### Decisão de evidência aceita

- **Data:** 2026-09-23.
- O responsável aceitou a limitação de que UI/logs padrão Vercel não mostram
  `CF-Connecting-IP`, Host ou SNI brutos. Não haverá endpoint temporário,
  logging de IP ou alteração de código para produzir essa prova.
- Evidência aceita: documentação oficial Vercel, estado `Proxy Detected`,
  Full (strict), certificado válido, documentação de renovação automática e
  smoke público por hostname. O painel não expõe detalhes de headers ou
  renovação futura; isso foi aceito como limitação observacional.
