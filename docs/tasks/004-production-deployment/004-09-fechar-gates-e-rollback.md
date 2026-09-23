# 004-09 — Fechar gates e rollback

- **Ticker:** `004`
- **Número:** `09`
- **Status:** `pending`

## Objetivo e resultado esperado

Consolidar prova final da fase 004, executar gates técnicos, documentar rollback
reproduzível e distinguir configuração, publicação, disponibilidade HTTP e
validação real de OAuth.

## Requisitos cobertos

- Lint, typegen, typecheck e build.
- Evidências finais de Vercel, DNS, TLS, Firebase, previews e logs.
- Rollback para deploy, env, domínio, DNS e Authorized Domain.
- Critérios de aceite da spec sem marcar pendências como concluídas.

## Escopo incluído

- Reexecutar gates na ordem do repositório contra o estado aprovado.
- Conferir diff/status e ausência de arquivos proibidos ou secrets.
- Consolidar links/IDs não sensíveis de deployment, domínio, certificado,
  smoke HTTP e teste browser.
- Registrar último deployment saudável, candidato e passos de rollback.
- Atualizar status da própria task e overview somente após evidência real.

## Escopo excluído

- Fazer rollback destrutivo em produção sem incidente.
- Criar commit, push, CI, observabilidade externa ou documentação fora de `docs/`.
- Declarar OAuth, DNS ou configuração externa concluída sem teste correspondente.
- Remover usuários Firebase, dados ou registros não relacionados.

## Dependências

- 004-01 a 004-08 executadas ou cada bloqueio explicitamente resolvido.
- Ambiente local com npm/dependências instaladas.
- Acesso humano para confirmar painéis e rollback, se necessário.

## Arquivos e símbolos prováveis

- `AGENTS.md`, `package.json`, `package-lock.json`, `next.config.ts`.
- `src/proxy.ts`, route groups, layouts, Firebase client/auth islands.
- Docs da fase 004 e registros das tasks anteriores.
- Vercel Deployments/Logs/Domains; Cloudflare DNS; Firebase Auth.

## Passos de implementação

1. Confirmar que nenhuma task externa ficou apenas como intenção.
2. Executar gates na ordem exigida.
3. Executar `git diff --check` e inspeção de escopo; não incluir env local.
4. Comparar matriz de aceite com evidências: deployment, DNS, TLS, HTTP,
   browser OAuth, preview e rollback.
5. Confirmar pelo painel o último deployment saudável e o procedimento oficial
   de revert/rollback, sem acionar mudança desnecessária.
6. Registrar cenários não reproduzidos, limitações de browser e decisões
   pendentes.
7. Só marcar overview/spec/task como concluídos se todos os critérios forem
   realmente comprovados; caso contrário manter `pending`/`blocked`.

## Testes e comandos de validação

```bash
npm run lint
npm exec next typegen
npx tsc --noEmit
npm run build
git status --short
```

Revisar evidências das tasks 004-06 e 004-07 para matriz real. Não usar build
como substituto de DNS, TLS ou browser OAuth.

## Definição de pronto

- Todos os gates passam na ordem correta.
- Critérios de aceite têm evidência classificada por tipo.
- Rollback de deployment, variables, DNS/domínios e Firebase está documentado
  com camada, responsável, pré-condição e efeito residual.
- Logs e diagnósticos não expõem credenciais, tokens, UID ou identidade.
- Overview mostra progresso exato; nenhum item pendente foi marcado `[x]`.
- Fase só é `completed` após validação humana de Google Sign-In e domínios reais.

## Riscos e cuidados

- DNS cache/propagação e `308` podem atrasar reversão; registrar horário e TTL.
- Rollback de deploy não corrige DNS ou Authorized Domain sozinho.
- Alterar environment variables exige novo deployment; não confundir painel com
  runtime atual.
- Se qualquer critério depender de acesso ausente, manter bloqueado e informar
  intervenção necessária em vez de simular sucesso.

## Checkpoint humano

Responsável confirma status final em Vercel, Cloudflare e Firebase e aprova o
aceite de OAuth. Sem essa confirmação, a fase permanece `pending`, ainda que os
gates locais passem.
