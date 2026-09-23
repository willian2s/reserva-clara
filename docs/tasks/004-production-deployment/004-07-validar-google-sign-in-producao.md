# 004-07 — Validar Google Sign-In produção

- **Ticker:** `004`
- **Número:** `07`
- **Status:** `pending`

## Objetivo e resultado esperado

Validar no browser o fluxo real `app/login → Google popup → dashboard`, a
restauração de sessão e o comportamento anônimo, sem alterar a arquitetura de
auth da fase 001.

## Requisitos cobertos

- Google popup em `app.reservaclara.com.br`.
- Sessão restaurada e navegação relativa.
- Dashboard autenticado e guard anônimo.
- Cancelamento, popup bloqueado, erros e retry.
- Separação entre auth validada e host routing.

## Escopo incluído

- Usar conta Google de teste autorizada em browser real.
- Confirmar origem, URL e destino após popup.
- Atualizar/reabrir páginas para testar persistência do Firebase Web.
- Limpar contexto/incognito para testar anônimo.
- Reproduzir cenários de cancelamento, bloqueio ou erro quando possível.
- Registrar evidência sanitizada de cada cenário e limitações de browser.

## Escopo excluído

- Criar credenciais, solicitar senha, guardar identidade, token, UID ou cookie.
- Firebase Admin, Firestore, sessão server-side, logout ou dados financeiros.
- Alterar `GoogleSignIn`, `DashboardGate`, popup ou fallback redirect.
- Declarar preview OAuth aprovado sem Authorized Domain exato.

## Dependências

- 004-05 provider/domínio autorizado.
- 004-06 topologia HTTPS e app login funcionando.
- Conta Google de teste e autorização humana no momento do teste.
- Browser desktop/mobile compatível com popup.

## Arquivos e símbolos prováveis

- `src/components/auth/google-sign-in.tsx`: listener, popup, estados e replace.
- `src/components/auth/dashboard-gate.tsx`: guard e shell não sensível.
- `src/app/(app)/login/page.tsx`, `dashboard/page.tsx`.
- DevTools/browser e logs Vercel sem copiar valores privados.

## Passos de implementação

1. Abrir `https://app.reservaclara.com.br/login` em contexto limpo.
2. Confirmar `checking → ready`, foco e CTA.
3. Clicar uma vez em Google, confirmar popup e concluir com conta autorizada.
4. Confirmar `router.replace` lógico para `/dashboard` e shell não sensível.
5. Atualizar/reabrir `/dashboard` e confirmar restauração sem flash privado.
6. Abrir `/login` autenticado e confirmar retorno para `/dashboard`.
7. Abrir `/dashboard` sem sessão em contexto anônimo e confirmar retorno para
   `/login`.
8. Fechar popup, simular bloqueio e erro/retry quando o browser permitir;
   registrar não reproduzido em vez de marcar como aprovado.
9. Conferir console para `auth/unauthorized-domain`, popup, rede e erros
   inesperados; não compartilhar conteúdo sensível.

## Testes e comandos de validação

- Browser real com HTTPS e popup habilitado.
- Matriz manual 001: nominal, sessão existente, anônimo, cancelamento,
  bloqueio, erro e retry.
- Refresh em desktop e mobile disponíveis.
- Logs Vercel somente para diagnóstico sanitizado.
- Não considerar curl ou build suficientes para OAuth.

## Definição de pronto

- Usuário Google autorizado conclui login no host app e chega ao dashboard.
- Sessão restaura em refresh/reabertura.
- `/login` autenticado e `/dashboard` anônimo têm comportamento esperado.
- Popup/cancelamento/erro/retry foram testados ou limitações foram registradas.
- Nenhum token, UID, email ou dado patrimonial aparece em evidência.
- Nenhuma lógica de auth foi movida para proxy/layout/landing.

## Riscos e cuidados

- Popup bloqueado ou WebView pode impedir aceite nominal; não trocar para
  redirect sem nova decisão.
- Conta já autenticada pode esconder cenário anônimo; usar contexto separado.
- Erro de Authorized Domain pode ocorrer somente na origem real; não validar
  localhost como substituto.
- Dashboard continua sem autorização server-side e sem dados sensíveis.

## Checkpoint humano

Usuário deve iniciar o popup e concluir login com conta autorizada. Se não houver
conta/browser adequado, task fica `blocked` e o aceite de produção não pode ser
declarado completo.
