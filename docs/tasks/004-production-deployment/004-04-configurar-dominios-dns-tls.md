# 004-04 — Configurar domínios, DNS e TLS

- **Ticker:** `004`
- **Número:** `04`
- **Status:** `pending`

## Objetivo e resultado esperado

Associar os três hostnames oficiais ao projeto Vercel, aplicar no Cloudflare
somente os registros efetivamente exigidos e obter HTTPS válido sem duplicar a
política de redirects do `src/proxy.ts`.

## Requisitos cobertos

- Apex `reservaclara.com.br`.
- `www.reservaclara.com.br`.
- `app.reservaclara.com.br`.
- DNS Cloudflare, propagação, proxy status, TLS e certificado.
- Responsabilidades sem redirects concorrentes.
- Rollback antes da mudança pública.

## Escopo incluído

- Snapshot de registros atuais, TTL, proxy status, MX/TXT/CAA e DNSSEC sem
  expor credenciais.
- Adicionar os três domínios ao mesmo projeto Vercel.
- Consultar a Vercel para obter os targets/records atuais por domínio.
- Confirmar na documentação atual se DNS only ou proxied é compatível; baseline
  inicial é DNS only, sem tratar isso como fato permanente.
- Aplicar alterações mínimas na zona Cloudflare após checkpoint humano.
- Aguardar verificação e validar certificado/HTTPS em cada host.

## Escopo excluído

- Cloudflare Redirect Rules, Workers, Page Rules, WAF, Access, cache customizado
  ou reverse proxy sem decisão nova.
- Hardcode de IP/CNAME/TXT na documentação ou código.
- Alterar `src/proxy.ts`, `next.config.ts` ou criar `vercel.json`.
- Testar OAuth; depende de 004-05 e 004-07.

## Dependências

- 004-01, 004-02 e 004-03 concluídas.
- Deployment Vercel saudável no hostname gerado.
- Usuário com acesso autorizado a Vercel e Cloudflare.
- Rollback de DNS e deployment conhecido antes de salvar alterações.

## Arquivos e símbolos prováveis

- `src/proxy.ts`: `PUBLIC_HOST`, `APP_HOST`, `WWW_HOST`, redirects e matcher.
- Vercel Project Settings → Domains, DNS/SSL, Deployments.
- Cloudflare DNS Records, proxy status, TTL e SSL/TLS.
- Evidência nesta task; nunca conteúdo de tokens ou env.

## Passos de implementação

1. Registrar estado DNS atual e identificar registros não relacionados que não
   podem ser removidos.
2. Humano adiciona apex, `www` e `app` ao mesmo projeto Vercel.
3. Inspecionar cada domínio e copiar somente para execução os valores fornecidos
   pela Vercel; não fixá-los na spec.
4. Confirmar documentação oficial atual sobre apex, CNAME, ACME/certificado,
   proxy Cloudflare, TTL e preservação de `Host`.
5. No checkpoint humano, configurar Cloudflare com os valores efetivos, sem
   Redirect Rules. Preferir DNS only se validação oficial não apontar conflito.
6. Aguardar propagação e estado `verified/valid` no painel Vercel; não iniciar
   OAuth enquanto certificado estiver pendente.
7. Confirmar que Vercel não adicionou redirect de domínio que concorra com
   `www → público`; se houver conflito, parar e revisar antes de continuar.
8. Registrar status, timestamps, TTL e decisão de proxy sem registrar secrets.

## Testes e comandos de validação

- `dig`/ferramenta equivalente para apex, `www` e `app`.
- Inspeção de domínio na Vercel mostrando status verificado e deployment alvo.
- GET/HEAD HTTPS em cada hostname, sem seguir redirects inicialmente.
- Browser confirma certificado válido e ausência de aviso.
- Requests HTTP verificam encaminhamento para HTTPS sem loop.
- Não usar IP/target genérico se painel fornecer valor específico.

## Definição de pronto

- Os três domínios pertencem ao mesmo projeto Vercel.
- DNS responde com os records efetivos exigidos pela Vercel.
- Registros existentes não relacionados foram preservados.
- Proxy status e TLS foram decididos com evidência oficial atual.
- Certificados válidos e HTTPS acessível nos três hosts.
- Não há redirect externo duplicado; a matriz 003 continua responsável por
  `www`, público e app.
- Snapshot e rollback estão registrados.

## Riscos e cuidados

- Não aplicar valor sugerido por tutorial antigo; usar inspeção atual do projeto.
- Apex, CNAME flattening e subdomínios podem ter regras distintas; validar cada
  hostname isoladamente.
- Cloudflare proxied pode mudar cadeia TLS, headers, cache e `Host`; não ativar
  por conveniência.
- `308` pode ficar cacheado; validar antes da publicação e lembrar propagação no
  rollback.
- MX/TXT/CAA/DNSSEC podem pertencer a serviços fora da fase; nunca apagar em
  bloco.

## Checkpoint humano

A task permanece `pending` até que responsável com acesso confirme alteração e
verificação real. O agente pode preparar comandos e ler estado público, mas não
deve presumir que painel salvo equivale a DNS propagado/TLS válido.
