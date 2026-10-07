# 012 — Estados, sessão e recovery

- **Ticker:** `012`
- **Subtarefa:** `012-04`
- **Experimento:** UX-05/OBS-01 — simular 401, perda de rede e resultado de comando
- **Estado da decisão:** política conceitual aprovada para prototipação; contrato HTTP
  e implementação ficam para 013/014 e para as slices
- **Dados:** fixtures sintéticas; nenhum token, dado patrimonial real ou write foi usado

## 1. Escopo e decisões resumidas

Este documento transforma o handoff de [`012-03`](../../tasks/012-product-ux-ui-ia-api-discovery/012-03-definir-ia-navegacao-e-shell.md), o mapa de jornadas e o baseline de identidade da 011 em uma política transversal para leituras, comandos, sessão e recuperação.

As decisões são:

1. Estado de leitura e estado de sessão são fronteiras diferentes. `AuthGate` e
   `GoogleSignIn` orientam a UX, mas não autorizam dados; a API sempre valida o
   Firebase ID Token e deriva o owner do `sub` verificado.
2. Uma leitura nova sem snapshot válido começa em `loading`. Uma atualização com
   snapshot válido preserva esse snapshot em `refreshing`; falha de atualização
   nunca troca o valor conhecido por zero.
3. `partial`, `stale`, `unavailable` e `offline` são semânticas observáveis e
   podem ser combinadas quando necessário: por exemplo, último resultado
   `partial` mantido como `stale` enquanto a rede está `offline`.
4. Um `401` permite no máximo um `getIdToken(true)` por ciclo de recovery. Só uma
   leitura idempotente ou um comando com chave de idempotência estável pode ser
   repetido, uma única vez, depois desse refresh.
5. Um comando não idempotente nunca é repetido cegamente. Timeout, conexão perdida
   depois do envio, conflito ou resposta não interpretável produzem `conflict` ou
   `resultado desconhecido` e conduzem a verificação explícita.
6. Refresh sem sucesso, token revogado e usuário desabilitado interrompem requests
   privados, fazem uma tentativa de `signOut` e retornam à autenticação sem loop.
   A copy não expõe motivo criptográfico, UID ou existência de recurso.
7. O retorno pós-login consome uma única intenção interna allowlisted. Intenção
   inválida, expirada ou já consumida cai em Carteiras; nunca há redirect externo.
8. Offline não significa escrita offline: formulário não enviado pode ser
   preservado localmente, mas não é enfileirado nem apresentado como salvo.

URLs, DTOs, códigos Problem Details, biblioteca de cache e implementação de
router permanecem provisórios. A política deve ser reutilizada por Portfolio,
Transaction, Quotes e read models sem transformar seus detalhes em um store global.

## 2. Taxonomia transversal

### 2.1 Estado de leitura

O envelope de uma capability deve distinguir `snapshot` (último resultado válido,
quando existir), estado atual e diagnóstico. Os estados abaixo descrevem a leitura;
`refreshing`, `offline` e `stale` funcionam como overlays quando isso evita perder
informação. Uma UI não deve mostrar simultaneamente cópias contraditórias, como
“dados atuais” e “sem conexão”.

| Estado | Semântica | Snapshot e ação segura |
| --- | --- | --- |
| `loading` | Primeira leitura em andamento, sem dado válido para o escopo. | Não inventar zero; mostrar estrutura/estado ocupado e permitir cancelar somente se a capability suportar. |
| `refreshing` | Nova leitura está em andamento e há snapshot válido. | Manter o último dado visível, anunciar atualização discreta e desabilitar apenas a ação concorrente necessária. |
| `ready` | Resultado atual completo para o escopo. | Exibir dados e ações contextuais com horário/frescor quando relevante. |
| `empty` | Leitura concluída sem fatos aplicáveis; não é erro. | Explicar o começo da tarefa e oferecer uma ação primária, como criar carteira. |
| `partial` | Há dados conhecidos e lacunas identificadas no resultado atual. | Exibir somente o valor conhecido, escopo das lacunas e causa sanitizada; nunca completar com zero. |
| `stale` | Snapshot utilizável, mas fora da janela de frescor ou mantido após falha de atualização. | Exibir timestamp/qualidade e “Atualizar”; não chamar stale de atual nem de performance. |
| `unavailable` | O valor ou recurso solicitado não está disponível nesta leitura. | Preservar snapshot anterior se houver e marcar a atualização como indisponível; sem substituir valor ausente por zero. |
| `offline` | A rede local não permite iniciar ou concluir a leitura. | Se houver snapshot, mostrar stale/offline; sem snapshot, mostrar indisponibilidade da leitura e retry quando voltar a rede. |

`unavailable` descreve a disponibilidade do recurso ou dependência, enquanto
`offline` descreve a conexão do cliente. Assim, `offline` não prova que o recurso
esteja indisponível e `unavailable` não prova que o usuário esteja offline.

### 2.2 Estado de comando e sessão

| Estado | Semântica | Ação segura |
| --- | --- | --- |
| `conflict` | O estado mudou, a identidade já existe ou a chave de idempotência divergiu. | Não reenviar automaticamente; reler/reconciliar e pedir revisão do usuário. |
| `unauthorized` | A sessão não pode ser usada para a operação ou a API rejeitou a identidade. | Interromper requests privados, tentar o recovery definido uma vez e pedir autenticação; não revelar recurso/owner. |
| `resultado desconhecido` | O cliente não sabe se o comando foi aceito, por timeout, desconexão ou falha após envio. | Não afirmar sucesso/falha nem repetir; consultar status/histórico por chave estável quando possível. |

`conflict` e `resultado desconhecido` não são estados financeiros. São estados de
reconciliação do comando e devem manter o contexto da carteira e os dados digitados
quando isso for seguro. `unauthorized` também não é uma decisão de autorização do
cliente: é a tradução de uma falha de sessão/capacidade para a UX.

### 2.3 Regras de composição

- `loading` e `refreshing` são transitórios; o componente deve manter o último
  estado estável abaixo deles e resolver para `ready`, `empty`, `partial`, `stale`,
  `unavailable` ou `offline`.
- `partial` é uma propriedade do resultado atual. Uma nova leitura pode resolver
  para `ready`, continuar `partial` ou falhar deixando o snapshot anterior como
  `stale`; não há promoção implícita de parcial para completo.
- `unavailable` sem snapshot não equivale a `empty`; deve preservar a ausência de
  conhecimento e oferecer retry/recurso alternativo apropriado.
- Um refresh bem-sucedido substitui o snapshot somente quando a resposta está
  validada para o mesmo owner, escopo e versão da leitura. Resposta atrasada de
  outro request não pode sobrescrever o snapshot mais novo.
- Ao fazer logout ou trocar de owner, limpar/inutilizar snapshots, diagnósticos e
  caches em memória do owner anterior antes de exibir dados do próximo owner.

## 3. Sessão e ciclo de recovery

### 3.1 Estados do ciclo

| Momento | Comportamento | Foco/copy esperada |
| --- | --- | --- |
| Sessão desconhecida | O SDK ainda restaura a sessão. Não iniciar dados privados em paralelo. | Região de status: “Verificando sua sessão…”. Não deslocar foco repetidamente. |
| Sessão restaurada | Obter ID Token atual quando a API precisar e carregar a intenção interna ou Carteiras. | Título da tarefa recebe foco após a navegação; nenhum token/UID é exposto. |
| Login em andamento | Google popup/redirect está pendente; bloquear dupla submissão. | “Abrindo a entrada do Google…”, `status` polido e botão ocupado. |
| Logout explícito | Invalidar requests/caches locais e chamar `signOut`; não prometer revogação instantânea de tokens já emitidos. | “Saindo…”, depois login/estado público com foco no título. |
| 401 recuperável | Suspender a operação, executar o único refresh forçado permitido e decidir se pode repetir. | Não mandar o usuário ao login durante o refresh silencioso. |
| Refresh rejeitado | Parar requests privados, tentar `signOut` uma vez e retornar à autenticação com origem segura. | “Sua sessão expirou. Entre novamente para continuar.” |
| Usuário desabilitado/revogado | Tratar como sessão não utilizável; não insistir em refresh. | Copy sanitizada: “Sua conta não pode acessar este espaço agora. Se isso parecer um engano, contate o suporte.” |
| Falha de `signOut` | Marcar sessão local como encerramento pendente, bloquear dados privados e não redirecionar em ciclo automático. | “Não foi possível concluir a saída neste momento. Tente sair novamente.” A ação é manual e explícita. |

O SDK permanece responsável pelo refresh token. O cliente obtém o ID Token atual
por sua porta de autenticação; o backend não recebe refresh token, não aceita UID
no body e não trata redirect HTML como resposta de API. A API retorna `401`/`503`
sanitizado, e a UI decide o recovery sem transformar `AuthGate` em autorização.

### 3.2 Contagem e limite do recovery

Cada ciclo começa com uma request autenticada que recebe `401` ou com uma ação de
reautenticação iniciada pelo usuário. O ciclo guarda, em memória, apenas:

- `refreshAttempted: boolean`, inicialmente falso;
- escopo da request e referência da intenção interna, sem token ou payload
  financeiro;
- `originConsumed: boolean`, inicialmente falso;
- uma chave de idempotência já criada para o comando, quando aplicável.

Ao receber o primeiro `401`, o cliente pode executar exatamente um
`getIdToken(true)`. Se funcionar, repete somente a mesma leitura idempotente ou o
mesmo comando idempotente com a mesma chave. Qualquer segundo `401`, falha do
refresh ou novo redirect para login encerra o ciclo; não há `refresh → 401 →
refresh` infinito. Um retorno pós-login bem-sucedido consome a origem uma vez e
marca o ciclo como recuperado.

## 4. Intenção e retorno à origem

Uma intenção de origem é um valor transitório de navegação, não uma sessão. Ela
contém somente superfície permitida, path com IDs opacos, filtros enumerados e um
prazo curto. Não contém URL absoluta, host arbitrário, token, UID, email, comando,
preço, quantidade ou formulário.

### Regras

1. Ao abrir um deep link sem sessão, validar e capturar a intenção interna uma
   única vez; caso inválida, usar Carteiras como destino seguro.
2. Preferir estado de navegação em memória/history. Se a implementação precisar
   sobreviver a um reload, uma área transitória de sessão pode guardar somente a
   intenção allowlisted; nunca usar `localStorage` para token ou refresh token.
3. Após a autenticação, consumir a intenção uma vez, navegar para o contexto e
   focar o título/região principal. A origem consumida não pode ser reutilizada
   por um segundo callback de `onAuthStateChanged`.
4. Em falha de login, expiração da intenção, erro de parse ou recurso não
   acessível, retornar a Carteiras com explicação. Não concatenar input em
   redirect nem aceitar `javascript:`, outro host ou fragmento como autorização.
5. Em recovery causado por 401, preservar o contexto atual. Se o segundo request
   falhar, mostrar `unauthorized` nesse contexto e oferecer autenticação explícita;
   não navegar automaticamente entre login e origem novamente.

## 5. Tabletop de 401 e matriz de retry

O tabletop usa a mesma intenção interna e fixtures sintéticas `F-CLARA` e
`F-CONFLICT`. “Um refresh” significa uma chamada forçada ao SDK, não uma nova
tentativa ilimitada de rede.

| Cenário simulado | Refresh | Repetição automática | Estado/copy | Recovery e evidência |
| --- | --- | --- | --- | --- |
| `read` recebe `401`; refresh retorna token válido; retry conclui | 1 | Sim, a mesma leitura, uma vez | `refreshing` → `ready`/`partial`; sem interrupção visual desnecessária | Registrar que houve 1 refresh, 1 retry e nenhuma chamada extra; foco permanece no título/controle de atualização. |
| `read` recebe `401`; refresh falha ou segundo request recebe `401` | 1 | Não | `unauthorized`: “Sua sessão expirou. Entre novamente para continuar.” | Requests privados param, `signOut` é tentado uma vez, retorno interno é consumido uma vez e login recebe foco. |
| write idempotente recebe `401`; refresh válido | 1 | Sim, mesmo payload e mesma chave de idempotência, uma vez | `refreshing`/submissão → confirmação ou `conflict` | Nunca gerar chave nova; se houver dúvida, consultar o resultado pela chave antes de oferecer nova ação. |
| write idempotente recebe `401` no segundo request | 1 | Não | `unauthorized` ou `resultado desconhecido` se o servidor não permitir distinguir aceitação | Não reenviar. Interromper sessão; após login, “Verificar histórico”/status por chave antes de nova submissão. |
| write não idempotente recebe `401` | No máximo 1 apenas se o fluxo de sessão exigir reautenticação; não há replay | **Não** | `unauthorized`; se a entrega puder ter alcançado o servidor, `resultado desconhecido` | Preservar o formulário não enviado, informar que nada será repetido automaticamente e exigir revisão/reenvio explícito após autenticação. |
| Read perde rede antes da resposta | Não forçar refresh baseado apenas em offline | Não | `offline`; com snapshot, `stale` + `offline` | Retry manual quando online; preservar o snapshot e não converter ausência em zero. |
| Write perde rede antes do dispatch | Não | Não | `offline`: “Nenhuma alteração foi enviada.” | Manter o formulário localmente e aguardar ação explícita quando online. |
| Write perde rede depois do dispatch | Não | Não | `resultado desconhecido`: “O resultado não foi confirmado.” | Verificar histórico/status; nunca afirmar que falhou nem repetir cegamente. |

O tabletop deve verificar também que `onAuthStateChanged` não causa uma segunda
navegação, que `signOut` não é chamado em loop e que a origem não reaparece após
ser consumida. Um erro de transporte não deve ser convertido em `401` sem
evidência de que a API rejeitou a identidade.

## 6. Recovery de comando, conflito e resultado desconhecido

### 6.1 Comando não enviado

Se o navegador detectar offline antes de despachar o comando, manter os valores no
formulário enquanto a tela permanecer aberta e anunciar “Ainda não enviado”. Não
criar fila implícita, optimistic write financeiro ou promessa de reconciliação.
Ao voltar a rede, o usuário decide se tenta novamente; a ação deve validar o
formulário de novo.

### 6.2 Comando possivelmente enviado

Timeout, abort após envio, queda de rede ou fechamento do browser podem acontecer
depois do ponto em que o backend aceitou o comando. O resultado é desconhecido:

1. manter a operação como “resultado não confirmado”, sem limpar o formulário
   como se tivesse sido concluída e sem exibir uma falha definitiva;
2. oferecer **Verificar histórico** no mesmo contexto, usando chave de
   idempotência/status quando o comando possuir uma;
3. considerar concluído somente com confirmação do servidor; registrar conflito se
   a chave existir com payload diferente;
4. se não houver mecanismo confiável de consulta, pedir conferência manual do
   histórico/suporte. A ausência momentânea de um item não autoriza repetição cega;
5. só depois de o usuário confirmar que não houve registro permitir uma nova ação
   explícita, com nova validação e sem reaproveitar uma chave para payload distinto.

Depois do dispatch, não usar a copy “Nenhuma alteração foi enviada”, que é
exclusiva do caso offline detectado antes do envio. Se não for possível distinguir
o ponto do dispatch, prevalece `resultado desconhecido`.

Para Transaction, a UX deve preferir uma chave estável por intenção de submissão e
o backend futuro deve expor uma forma de reconciliação. Isso é dependência para
018, não um endpoint congelado nesta fase.

### 6.3 Conflito

Em identidade duplicada, versão alterada, carteira arquivada durante a edição ou
chave de idempotência divergente, manter o contexto e informar que o estado mudou:
“Este dado mudou antes de concluir. Atualize e revise os campos.” A ação primária
é **Atualizar e revisar**, não repetir o mesmo write. O formulário pode reaplicar
somente dados que não tenham sido confirmados como fato; Transaction continua
append-only.

## 7. Mensagens, foco e ações

Copy é deliberadamente curta, acionável e sanitizada. O motivo técnico detalhado
fica em telemetria redigida; não mostrar token, UID, email, stack trace, owner ou
distinção entre recurso inexistente e inacessível.

| Estado/cenário | Mensagem principal | Ação primária | Foco e anúncio |
| --- | --- | --- | --- |
| `loading` | “Carregando dados…” | nenhuma ou Cancelar, se suportado | `aria-busy` na região; não mover foco em cada atualização. |
| `refreshing` | “Atualizando este resumo…” | Cancelar somente se seguro | Manter foco e snapshot; status `polite`. |
| `empty` | “Ainda não há dados para esta carteira.” | “Criar carteira”/“Registrar operação” conforme a tarefa | Título e ação primária são descobertos por teclado. |
| `partial` | “Patrimônio conhecido; alguns dados ainda não estão disponíveis.” | “Ver detalhes” ou retry no escopo | Anunciar lacunas sem esconder os valores conhecidos. |
| `stale` | “Última atualização em [horário]. Esses dados podem estar desatualizados.” | “Atualizar” | Status `polite`; horário não depende apenas de cor. |
| `unavailable` | “Não foi possível obter este valor agora. Ele não foi considerado zero.” | “Tentar novamente” | Focar resumo após ação submetida; retry nomeia o escopo. |
| `offline` | “Você está sem conexão. As leituras podem estar desatualizadas.” | “Tentar novamente” quando online | `alert` somente se bloquear ação; preservar foco e snapshot. A copy “Nenhuma alteração foi enviada” só vale quando o write foi barrado antes do dispatch. |
| `unauthorized` | “Sua sessão expirou. Entre novamente para continuar.” | “Entrar novamente” | Focar título/status da autenticação; retorno interno uma vez. |
| usuário desabilitado | “Sua conta não pode acessar este espaço agora. Se isso parecer um engano, contate o suporte.” | “Contatar suporte”/“Voltar ao início” | Não oferecer retry automático nem spinner infinito. |
| `conflict` | “Este dado mudou antes de concluir. Atualize e revise os campos.” | “Atualizar e revisar” | Focar resumo do conflito e relacionar campos afetados. |
| resultado desconhecido | “O resultado não foi confirmado. Verifique o histórico antes de tentar de novo.” | “Verificar histórico” | Focar o aviso; não limpar inputs nem anunciar sucesso. |
| `signOut` falhou | “Não foi possível concluir a saída neste momento. Tente sair novamente.” | “Tentar sair novamente” | Foco no aviso/controle; nenhuma redireção automática repetida. |

Após erro de formulário, o foco vai para o resumo e depois para o primeiro campo
inválido. Após retry, retorna ao controle que iniciou a ação se a operação falhar
novamente; se resolver, foca a confirmação ou o título da região atual. Em
reautenticação, a página de login é uma tarefa nova: foco vai ao título, status e
botão do Google em ordem previsível. O anúncio não deve depender somente de
spinner, cor ou mudança silenciosa de rota.

## 8. Walkthrough e critérios de aceite

O walkthrough deve usar apenas fixtures sintéticas. O registro abaixo é a
evidência do tabletop documental desta subtarefa — não é execução de runtime — e
explicita as chamadas esperadas, o estado final, o contador de refresh, foco e
ação para cada caso:

| Caso | Evento e chamadas observadas no tabletop | Estado final | Refresh | Foco | Ação |
| --- | --- | --- | ---: | --- | --- |
| 1. Sessão restaurada | `onAuthStateChanged(user)`; `getIdToken()` sob demanda; carrega Carteiras | `ready` ou `empty` | 0 | título da tarefa | criar/localizar carteira |
| 2. Deep link e retorno | captura intenção interna; login; callback repetido ignorado; navega uma vez | contexto da origem | 0 | título/região principal | continuar na origem |
| 3. 401 em read | `401`; `getIdToken(true)`; mesma leitura uma vez; resposta válida | `refreshing` → `ready`/`partial` | 1 | título/controle preservado | nenhuma nova autenticação |
| 4. Refresh rejeitado | `401`; `getIdToken(true)` falha; `signOut` uma vez; requests privados parados | `unauthorized` | 1 | título/status de login | entrar novamente |
| 5. 401 em writes | idempotente: retry com mesma chave; não idempotente: sem replay | confirmado, `conflict` ou `resultado desconhecido` conforme retorno | 1 no máximo | resumo do resultado | verificar status/histórico ou revisar |
| 6. Rede perdida | read: snapshot mantido; write pré-dispatch barrado; write pós-dispatch não confirmado | `stale` + `offline`, `offline` ou `resultado desconhecido` | 0 | status/aviso sem perder contexto | retry online ou verificar histórico |
| 7. Estados de dados | respostas sintéticas `partial`, stale, unavailable, empty e conflito | estado correspondente; ausência não vira zero | 0 | resumo do estado | retry no escopo ou atualizar/revisar |
| 8. Conta/sair indisponível | usuário disabled/revogado; `signOut` falha; nenhuma nova tentativa automática | `unauthorized`/encerramento pendente | 0 ou 1 conforme ciclo | aviso/controle de saída | suporte, voltar ou tentar sair manualmente |

1. Restaurar sessão e abrir Carteiras; verificar que a origem default é consumida
   uma vez e que o foco chega ao título.
2. Abrir deep link interno sem sessão, autenticar e retornar uma vez; repetir o
   callback de auth e confirmar que não há segundo redirect.
3. Forçar `401` em read, refresh válido e retry; conferir exatamente um refresh,
   uma leitura repetida e dados preservados durante `refreshing`.
4. Forçar refresh inválido/segundo `401`; conferir `signOut` único, parada de
   requests privados, login e ausência de loop.
5. Forçar `401` em write idempotente e não idempotente; conferir chave estável no
   primeiro e nenhum replay cego no segundo.
6. Interromper rede antes de read e depois de dispatch de write; distinguir
   `offline` de `resultado desconhecido`, sem converter qualquer caso em zero.
7. Forçar `partial`, `stale`, `unavailable`, `empty` e `conflict`; conferir copy,
   escopo de retry, snapshot anterior, foco e ação de reconciliação.
8. Simular usuário desabilitado e falha de `signOut`; conferir mensagem sanitizada,
   ausência de loop e nenhum token/UID em tela, URL, fixture ou log de evidência.

Evidência mínima: tabela com evento inicial, chamadas de auth/retry, estado final,
quantidade de refresh, foco esperado/observado e ação oferecida. A validação humana
de teclado, leitor de tela, viewport de 320 px e zoom de 200% permanece necessária
em 012-05/012-06/013; este documento não declara conformidade a11y executada.

## 9. Handoff e dependências

### 013 — fundação frontend

- Separar estado de sessão, estado de servidor, formulário e navegação; não criar
  store global de negócio para implementar este fluxo.
- Implementar boundary de dados com snapshot/refresh, request obsoleta descartada,
  foco e live regions testáveis.
- Manter Firebase Web somente para Auth; cliente HTTP obtém o ID Token sob demanda
  e nunca persiste token manualmente.

### 014 — identidade, API e segurança

- Validar `401`, `503`, revogação/disabled, CORS, claims, `CurrentOwner` e erros
  sanitizados sem transformar API em redirect para login.
- Provar o limite de um refresh, o retry idempotente com chave estável e a
  ausência de replay de write não idempotente.
- Definir a capacidade de consulta/reconciliação de resultado desconhecido sem
  congelar URL ou DTO nesta fase.

### 015/016 — compatibilidade e dados

- Preservar strings decimais, IDs opacos, ordem temporal e distinção entre fato,
  snapshot e derivação; erro de sessão não pode apagar um fato ou virar zero.

### 017–019 — slices

- Portfolio consome empty/archived/read-only, conflito e retorno ao contexto.
- Transaction consome idempotência, append-only, conflito e resultado desconhecido.
- Quotes/valuation/dashboard consomem partial/stale/unavailable/offline, escopo do
  refresh e ausência de performance histórica.

## 10. Riscos residuais e decisões abertas

- Ainda não há implementação de cliente HTTP, API ou testes React/E2E; a matriz é
  uma política de discovery e precisa de um spike executável em 013/014.
- O contrato de status para reconciliar comando desconhecido ainda precisa ser
  desenhado pela 014/018. Sem essa capacidade, a UI não deve prometer que uma nova
  submissão é segura.
- A copy de usuário desabilitado é sanitizada e pode precisar de revisão de suporte
  sem revelar detalhes de identidade ou autorização.
- O limite temporal de stale, TTL, armazenamento exato da intenção e telemetria
  operacional permanecem decisões de implementação, sujeitas a privacidade e
  compatibilidade.
- Acessibilidade completa, 320 px e zoom 200% ainda dependem de protótipo e
  validação humana; nenhum resultado deste tabletop é declaração WCAG.

## Referências

- [`012-03 — IA, navegação e shell`](../../tasks/012-product-ux-ui-ia-api-discovery/012-03-definir-ia-navegacao-e-shell.md)
- [`Mapa de jornadas 012`](journeys-and-product-findings.md)
- [`Handoff frontend 011`](../011/frontend-ux-contract-discovery.md)
- [`Identidade e segurança 011`](../011/identity-security.md)
- [`ADR 013 — identidade, autorização, revogação e CORS`](../../decisions/013-identidade-autorizacao-revogacao-e-cors.md)
- [`Spec 012`](../../specs/012-product-ux-ui-ia-api-discovery.md)
