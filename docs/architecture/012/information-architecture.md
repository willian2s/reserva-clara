# 012 — Arquitetura da informação, navegação e shell

- **Ticker:** `012`
- **Subtarefa:** `012-03`
- **Experimento:** UX-02 — comparar entrada global e espaço de carteiras
- **Estado da decisão:** conceitual, dependente de protótipo responsivo
- **Dados:** somente fixtures sintéticas; nenhum dado patrimonial real ou write

## 1. Escopo e decisão resumida

Este documento transforma as jornadas de [`012-02`](../../tasks/012-product-ux-ui-ia-api-discovery/012-02-mapear-jornadas-e-problemas-de-produto.md) em uma IA navegável, sem transportar a estrutura de route groups do Next para o alvo. Ele define superfícies, hierarquia, intenções de navegação, deep links, filtros, foco, 404 e política conceitual de host.

As decisões são:

1. **Carteiras** é o workspace e a entrada autenticada padrão. A primeira conta
   deve encontrar criação de carteira sem passar por um dashboard vazio.
2. **Visão geral** é o consolidado de carteiras ativas. Continua acessível pelo
   shell, mas não é a entrada universal nem promete performance histórica.
3. O shell aplicado tem navegação primária para **Visão geral**, **Carteiras** e
   **Ativos**, com item ativo, logout visível e ação de pular para o conteúdo.
4. Detalhe, histórico de operações e configurações ficam sob o contexto da
   carteira; a ação primária de escrita é **Registrar operação**.
5. Deep links são suportados por parâmetros opacos e por query string limitada ao
   estado de navegação. History deve preservar localização, filtros confirmados e
   retorno à origem, sem escolher ainda biblioteca ou API de router.
6. A separação entre host público e host da aplicação é política de roteamento e
   disponibilidade. Não é autenticação, autorização nem prova de acesso a dados.

As URLs abaixo são nomes conceituais e exemplos do baseline atual. Não congelam
nomenclatura física, hosts, parâmetros, router, DTOs ou contratos HTTP.

## 2. Princípios de IA

### 2.1 Tarefa antes do modelo de dados

O usuário escolhe uma carteira, lê seu estado ou registra uma operação. `Position`,
read models, cobertura de cotação e ledger são conceitos que explicam a tarefa,
mas não devem criar uma navegação paralela de entidades técnicas.

- **Registrar operação** descreve o fato append-only; não usar “cadastrar posição”
  para uma ação que cria uma Transaction.
- **Patrimônio conhecido**, **custo de aquisição remanescente** e cobertura de
  cotação devem permanecer distinguíveis.
- `stale`, `unavailable` e `partial` são estados de leitura e não destinos de
  navegação nem zeros silenciosos.
- Carteira arquivada permanece encontrável e legível, com modo somente leitura e
  caminho explícito para restaurar; arquivar não é excluir.

### 2.2 Hierarquia estável e contexto explícito

Cada tela aplicada deve responder visualmente: “onde estou?”, “qual carteira está
em foco?” e “qual é a próxima ação segura?”. O contexto de carteira não deve
desaparecer ao abrir histórico, configurações, erro ou retorno de login.

IDs de carteira, ativo e operação são opacos e estáveis. O cliente não monta
identidade com símbolo, nome, UID ou texto editável; nomes podem ser exibidos
apenas como rótulo, nunca como identificador de rota.

### 2.3 Estado de navegação separado de estado financeiro

Path, query string e posição no history representam localização e intenção de
leitura. Não devem carregar tokens, dados patrimoniais, `ownerId`, comandos de
write ou um redirect externo arbitrário. Dados de servidor, sessão e formulários
terão políticas próprias nas subtarefas seguintes.

## 3. Superfícies e shells

| Superfície | Intenção | Shell e navegação | Regras de entrada/saída |
| --- | --- | --- | --- |
| Pública | Explicar o produto e oferecer acesso | Marca, conteúdo público e ação “Entrar” | Não mostra dados patrimoniais; links para a aplicação usam destino canônico e não carregam estado financeiro |
| Autenticação | Entrar, restaurar sessão e tratar falha | Shell mínimo de autenticação, título de tarefa, feedback de loading/erro | Pode receber uma intenção interna validada; depois do sucesso retorna uma vez à origem ou à entrada Carteiras |
| Aplicação | Trabalhar e compreender patrimônio | Shell aplicado persistente, skip link, navegação primária, logout, região principal focável | Requer sessão para dados; `AuthGate`/redirect visual não substitui autorização da API |
| Erro/indisponibilidade | Recuperar sem perder contexto | Mensagem contextual, ação de retorno/retry quando segura | Não revela se recurso pertence a outro owner; mantém query de leitura somente quando válida |

O shell aplicado deve manter a ordem de teclado previsível: skip link, marca/ações
globais, navegação primária, conteúdo contextual e região principal. A marca pode
ser um retorno à entrada aplicada, mas não deve apagar a intenção de um deep link.
O item primário ativo usa uma indicação visual e semântica equivalente a
`aria-current`; a implementação concreta fica para 013.

## 4. Árvore conceitual

```text
Público
└── Apresentação do Reserva Clara
    └── Entrar

Autenticação
└── Login
    ├── sessão restaurada
    ├── autenticação em andamento
    ├── cancelada ou bloqueada
    └── falha com recuperação

Aplicação — entrada padrão: Carteiras
├── Visão geral
│   └── consolidado das carteiras ativas
├── Carteiras
│   ├── ativas
│   │   └── Carteira
│   │       ├── resumo e posições conhecidas
│   │       ├── registrar operação
│   │       ├── histórico de operações
│   │       └── configurações / lifecycle
│   ├── arquivadas
│   │   └── Carteira em somente leitura → restaurar
│   └── criar carteira
└── Ativos
    └── catálogo de identidades reutilizáveis

Transversal
├── rota inexistente (404 contextual)
├── recurso não encontrado ou não acessível
├── sessão expirada / reautenticação
└── indisponibilidade de rede ou dados parciais
```

### 4.1 Mapa de rotas conceituais

| Chave de navegação | Exemplo de referência atual | Entrada e objetivo | Item ativo | Deep link e retorno |
| --- | --- | --- | --- | --- |
| `public.home` | `/` | Conhecer o produto | nenhum | Seguro para qualquer visitante; não exige sessão |
| `auth.sign-in` | `/login` | Autenticar | nenhum | Pode receber uma intenção interna validada; não aceita host externo |
| `app.portfolios` | `/portfolios` | Criar, localizar e separar carteiras ativas/arquivadas | Carteiras | Entrada padrão após login; restaura a visão selecionada quando válida |
| `app.overview` | `/dashboard` | Ler o consolidado de carteiras ativas | Visão geral | Pode ser aberto diretamente; explica escopo e parcialidade |
| `app.assets` | `/assets` | Gerenciar identidades reutilizáveis de ativos | Ativos | Pode ser aberto diretamente; não substitui o contexto de uma operação |
| `app.portfolio.detail` | `/portfolios/{portfolioId}` | Ler uma carteira e suas ações | Carteiras | ID opaco; recurso inexistente/inacessível tem resposta indistinguível |
| `app.portfolio.transactions` | `/portfolios/{portfolioId}/transactions` | Consultar histórico e registrar operação | Carteiras + contexto da carteira | ID opaco; volta ao detalhe preservando filtro confirmado quando possível |
| `app.portfolio.settings` | `/portfolios/{portfolioId}/settings` | Renomear, arquivar ou restaurar | Carteiras + contexto da carteira | Ações de lifecycle permanecem próximas do recurso e retornam ao contexto |
| `error.not-found` | `not-found.tsx` | Recuperar de rota ou recurso que não existe | depende do host | Oferece retorno seguro à superfície atual, preferindo Carteiras no app |

`{portfolioId}` representa um identificador opaco de recurso. A mesma regra vale
para futuros `{assetId}` e `{transactionId}`. Não há decisão nesta subtarefa sobre
se a forma física será path segment, outro mecanismo do router ou qual host
servirá cada arquivo estático.

### 4.2 Alternativas de entrada

| Alternativa | Benefício | Problema observado | Decisão |
| --- | --- | --- | --- |
| Visão geral primeiro | Responde “como está meu patrimônio?” para quem já tem dados | Conta vazia encontra ausência e precisa de um desvio para criar carteira; mistura resumo e trabalho | Manter como destino de leitura, não como default universal |
| Carteiras primeiro | Aproxima a primeira tarefa, explicita vazio/arquivado e oferece criação no contexto | Pode atrasar a leitura consolidada de usuários recorrentes | **Escolhida como entrada autenticada padrão**, validando compreensão em protótipo |
| Entrada adaptativa por estado | Reduz passos para contas vazias ou maduras | Pode tornar a localização instável e dificultar deep links/history | Não adotar agora; pode ser experimento posterior sem alterar a hierarquia |

## 5. Navegação, deep links e history

### 5.1 Regras de transição

1. Abrir uma superfície, detalhe ou modo contextual cria uma entrada de history.
   Links compartilháveis e refresh devem reconstituir a mesma intenção de leitura.
2. `Back` retorna à lista, carteira ou filtro que originou a tarefa; `Forward`
   reabre o mesmo contexto. O usuário não deve ser sempre devolvido a Visão geral.
3. Mudanças de filtro confirmadas podem ser representadas na query string. Digitar
   um valor intermediário não deve criar uma entrada por tecla; o comportamento
   final de push/replace é candidato a validação no spike de 013.
4. Refresh mantém path e query válidos, refaz a leitura e mostra loading/erro sem
   fingir que o último valor é fresh. Formulário não submetido não vira estado
   financeiro nem deve ser repetido silenciosamente.
5. Ao abrir um deep link sem sessão, guardar somente uma intenção interna
   allowlisted (superfície, IDs opacos e filtros permitidos). Após autenticar,
   consumir essa intenção uma vez; em falha, expiração ou intenção inválida,
   retornar a Carteiras com explicação acionável.
6. Um redirect de host pode preservar caminho e query somente após validar que a
   origem é interna e que a superfície é permitida. Fragmentos não são tratados
   como prova de autorização; não há open redirect.

### 5.2 Cenários observáveis

| Cenário | Resultado esperado |
| --- | --- |
| Abrir diretamente o detalhe de uma carteira ativa | Após sessão, carregar o detalhe, marcar Carteiras e focar o título/região da tarefa |
| Abrir diretamente histórico de carteira arquivada | Carregar leitura, anunciar somente leitura, bloquear nova operação e oferecer lifecycle apropriado |
| Atualizar uma página de operações com filtro válido | Repetir a leitura no mesmo contexto; não perder o filtro nem transformar ausência em zero |
| Usar Back depois de abrir uma carteira a partir da lista | Retornar à lista com sua visão e filtros confirmados |
| Login iniciado a partir de deep link | Voltar uma vez ao deep link interno; não cair primeiro em uma tela intermediária sem motivo |
| Deep link inválido ou recurso inacessível | Mostrar 404 contextual e retorno seguro; não revelar owner, existência ou detalhes do recurso |
| Timeout ou resultado desconhecido de operação | Permanecer no contexto, oferecer verificação do histórico e não repetir write não idempotente |

## 6. Filtros e query string

Filtros são estado de localização somente quando ajudam a reencontrar uma leitura
ou compartilhar uma tarefa. A existência de um filtro não congela uma query de API.
Busca, paginação e filtros detalhados foram observados como lacunas e permanecem
**deferidos** até haver volume sintético e tarefa medida.

| Superfície | Filtro candidato | Política conceitual |
| --- | --- | --- |
| Carteiras | ativas / arquivadas / todas | Estado de descoberta essencial; deve continuar compreensível sem query e ser restaurável no Back |
| Ativos | mercado, tipo, moeda ou texto | Candidato posterior; não esconder identidade nem transformar símbolo em ID |
| Histórico | período, buy/sell, ativo e paginação | Candidato posterior; filtros confirmados podem ir na query, com valores limitados e sem payload financeiro |
| Visão geral | escopo de carteiras ativas e diagnóstico | Escopo padrão explícito; não usar filtro para incluir arquivadas silenciosamente |

Chaves e enumerações físicas ficam abertas. Valores desconhecidos, excessivos ou
malformados devem ser ignorados com estado seguro ou produzir uma recuperação
clara, nunca alterar owner, consultar um ID derivado de nome ou executar write.

## 7. Foco, teclado e feedback de navegação

Esta é uma política conceitual para o walkthrough; a matriz de conformidade e os
componentes serão validados em 012-05/012-06.

- O foco inicial deve chegar ao título da tarefa ou à primeira região útil, sem
  pular silenciosamente o contexto de carteira. O shell permanece navegável por
  teclado e oferece “Pular para conteúdo”.
- Após navegação, o foco não deve ficar perdido no link que iniciou a transição.
  O título/região principal deve ser anunciado e o item primário ativo deve ser
  identificável visual e semanticamente.
- Após erro de formulário, focar o resumo do erro e fornecer relação com o campo;
  após uma ação em diálogo, devolver o foco ao controle que abriu o diálogo ou à
  confirmação contextual.
- Loading, refresh, partial, stale, unavailable, offline e sessão expirada devem
  ser anunciados sem remover a última leitura válida indevidamente. Retry precisa
  informar escopo.
- Deep link, 404 e redirecionamento de host devem deixar claro o destino e o
  próximo passo. O host não permitido não deve parecer uma tela de login nem uma
  autorização concedida.
- O walkthrough precisa cobrir teclado sem mouse, leitor de tela, viewport de
  320 px, zoom de 200%, nomes longos, números longos e query string.

## 8. 404, recurso ausente e estado de host

### 8.1 Taxonomia de recuperação

| Caso | Copy/semântica | Ação segura |
| --- | --- | --- |
| Rota não reconhecida | “Não encontramos esta página” no contexto da superfície | Público: apresentação; app: Carteiras; autenticação: login |
| Recurso inexistente ou não acessível | Mensagem indistinguível para não vazar existência ou owner | Voltar à lista/contexto; não oferecer retry infinito |
| Host não permitido | Indisponibilidade de origem, sem simular autorização | Resposta de infraestrutura; não renderizar dados nem redirecionar para host arbitrário |
| Recurso arquivado | Recurso existe, leitura é permitida e writes de operação estão bloqueados | Permanecer em somente leitura; oferecer restaurar conforme lifecycle |
| Sessão expirada | Identidade precisa ser restaurada antes de repetir leitura | Reautenticar e retornar uma vez à intenção interna |

O 404 deve preservar o contexto que o usuário consegue compreender, mas nunca
confirmar se um ID pertence a outro owner. A escolha conceitual de retorno do app
é Carteiras, alinhada à nova entrada padrão; o comportamento atual que retorna ao
dashboard é baseline a ser revisado, não requisito.

### 8.2 Política de host

| Classe | Host de referência | Superfície permitida | Política conceitual |
| --- | --- | --- | --- |
| Público | `reservaclara.com.br` | Pública | Landing; login e app podem ser encaminhados ao host da aplicação preservando somente intenção interna |
| Aplicação | `app.reservaclara.com.br` | Autenticação e aplicação | Entrada raiz encaminha para login/entrada aplicada; dados continuam sujeitos à API e ao owner do token |
| Canônico público | `www.reservaclara.com.br` | Pública | Canonicaliza para o host público sem perder caminho/query válidos |
| Local | `localhost`, loopback | Todas as superfícies de desenvolvimento | Aceito para dev/testes e não indexado |
| Preview | domínio de preview permitido | Superfícies de preview | Aceito para validação e não indexado; não prova prontidão de produção |
| Desconhecido | qualquer outro | nenhuma | 404/negação de infraestrutura; sem fallback silencioso |

Esta política acompanha `classifyHost` e `src/proxy.ts` como baseline, mas a
implementação alvo pode residir em reverse proxy/hosting. Host, CORS, redirect e
canonicalização não autorizam leitura ou escrita patrimonial: a API deve validar
Bearer, owner derivado do token, recurso e invariantes independentemente da
superfície que iniciou a navegação.

## 9. Walkthrough de teclado e URL

O protótipo deve usar somente `F-EMPTY`, `F-CLARA`, `F-MULTI` e `F-CONFLICT` de
`journeys-and-product-findings.md`. Para cada cenário, registrar tempo/erros de
localização, foco, compreensão e recuperação; isto é evidência de hipótese, não
pesquisa com usuários reais.

O [protótipo standalone de IA e shell](information-architecture-prototype.html)
materializa esses estados sem Next. Ele possui simulador de host/path/query,
login com retorno único ao deep link, navegação primária, filtro de carteiras,
history, foco no título e autoverificação de host desconhecido, query preservada,
ID opaco e entrada padrão.

1. No host público, abrir landing, localizar Entrar e confirmar que nenhum dado
   patrimonial aparece.
2. Abrir diretamente uma intenção de Carteiras, sair da sessão e autenticar;
   confirmar retorno único à intenção e foco no título.
3. Criar uma carteira a partir do vazio, abrir detalhe, histórico e configurações;
   usar Tab/Shift+Tab, Back/Forward e refresh sem perder o contexto.
4. Abrir uma carteira arquivada, confirmar somente leitura, localizar restauração
   e verificar que “Registrar operação” não aparece como ação habilitada.
5. Percorrer Ativos, um filtro candidato e o histórico com query malformada;
   confirmar que estado inválido não muda identidade nem dispara write.
6. Forçar 404 de rota e de recurso, timeout, partial, stale e unavailable;
   verificar copy, foco do erro, escopo do retry e retorno seguro.
7. Repetir em 320 px, zoom de 200% e leitor de tela; nenhum item essencial deve
   depender apenas de cor, hover, `<details>` fechado ou indicação visual.

Critérios observáveis: cada tarefa tem uma entrada identificável; o item ativo é
percebido; Back/Forward e refresh reconstituem intenção; query inválida não vaza
dados; foco não é perdido; 404/host não permitido não se confundem com login ou
autorização; estados financeiros não viram zero.

## 10. Handoff e decisões adiadas

### Para 013 — fundação frontend

- Implementar a IA como configuração independente de framework, com shell público,
  autenticação e aplicação separados.
- Comparar router/history, foco em transições, restauração de scroll, query state,
  cache de servidor e testabilidade; TanStack Query ou equivalente continua
  candidato, não decisão desta subtarefa.
- Manter UI, capabilities, cliente HTTP, autenticação e domínio separados; não
  transportar Firestore, BRAPI ou regras de host para componentes.

### Para 014 — sessão e segurança

- Definir retorno pós-login, refresh único, logout, 401, offline e resultado
  desconhecido sem retry cego.
- Validar a fronteira entre host/CORS/redirect e autorização por token/owner.

### Para 017–019 — slices

- Portfolio usa Carteiras como workspace e deve validar vazio, arquivada,
  restore, conflito e detalhe.
- Transaction usa o contexto da carteira, “Registrar operação”, ledger append-only
  e reconciliação.
- Quotes, posições e consolidado mantêm partial/stale/unavailable, escopo de
  refresh e ausência de performance histórica.

Ficam deliberadamente adiados: URLs definitivas, nomes físicos de query params,
biblioteca de router, fallback de hosting, DTOs/OpenAPI, paginação física,
autorização no cliente e redesign visual final.

## 11. Riscos residuais

- A preferência por Carteiras é uma hipótese heurística, sem pesquisa com usuários
  reais; precisa de protótipo e tarefa observável.
- A política de foco, filtros e 404 ainda não tem teste React/E2E automatizado.
- A implementação legada perde query string em alguns redirects e retorna 404 do
  app ao dashboard; isso é gap de implementação futura, não corrigido nesta fase.
- Host policy pode variar com hosting, mas não pode ser promovida a boundary de
  autorização.
- Volume real ainda não justifica busca, filtros detalhados ou paginação; decidir
  depois de medir tarefas com fixtures pequenas, médias e grandes.

## Referências

- [`012-02 — mapa de jornadas`](journeys-and-product-findings.md)
- [`011 — handoff frontend/UX`](../011/frontend-ux-contract-discovery.md)
- [`Spec 012`](../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`host-routing.ts`](../../../src/lib/host-routing.ts)
- [`proxy.ts`](../../../src/proxy.ts)
- [`shell protegido`](../../../src/app/(app)/(protected)/layout.tsx)
- [`404 atual`](../../../src/app/not-found.tsx)
- [`protótipo standalone`](information-architecture-prototype.html)
