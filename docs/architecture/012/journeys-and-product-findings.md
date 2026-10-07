# 012 — Mapa de jornadas e achados de produto

- **Ticker:** `012`
- **Subtarefa:** `012-02`
- **Experimento:** UX-01 — mapear jornadas, problemas e entrada do produto
- **Estado da evidência:** walkthrough heurístico concluído com fixtures sintéticas
- **Dados:** nenhum dado patrimonial real; nenhuma escrita foi executada

## 1. Método e limites

Este artefato registra um walkthrough documental baseado no comportamento
observável do checkout atual e em três perfis hipotéticos. Não é pesquisa com
usuários, teste de usabilidade ou aprovação de implementação. As conclusões
separam observação de hipótese e precisam de validação posterior com protótipo
responsivo.

O walkthrough percorre login → shell → carteira → ativo → operação → leitura
patrimonial. Foram comparadas duas entradas autenticadas: dashboard global e
lista de carteiras. Os estados foram representados por fixtures descartáveis de
sucesso, vazio, erro, parcial, stale, unavailable, arquivado/read-only e
conflito.

### 1.1 Evidências do baseline

| Área | Evidência observada |
| --- | --- |
| Login e shell | [`AuthGate`](../../../src/components/auth/auth-gate.tsx), [`GoogleSignIn`](../../../src/components/auth/google-sign-in.tsx) e shell protegido em `src/app/(app)/(protected)/layout.tsx` |
| Entrada global | [`GlobalDashboard`](../../../src/components/dashboard/global-dashboard.tsx) e [estado de leitura](../../../src/components/dashboard/dashboard-read-state.ts) |
| Carteiras | [`PortfolioList`](../../../src/components/portfolio/portfolio-list.tsx), [`PortfolioDetail`](../../../src/components/portfolio/portfolio-detail.tsx) e [`PortfolioSettings`](../../../src/components/portfolio/portfolio-settings.tsx) |
| Ativos | [`AssetCatalog`](../../../src/components/asset/asset-catalog.tsx), formulários de criação/edição e [`AssetQuote`](../../../src/components/asset/asset-quote.tsx) |
| Operações | [`TransactionLedger`](../../../src/components/transaction/transaction-ledger.tsx) e [`TransactionForm`](../../../src/components/transaction/transaction-form.tsx) |
| Linguagem financeira | [copy financeira](../../../src/components/financial/financial-copy.ts) e [componentes financeiros](../../../src/components/financial/) |

## 2. Fixtures sintéticas

As fixtures são cenários de observação, não dados de usuários.

| Fixture | Situação | Estado esperado para o walkthrough |
| --- | --- | --- |
| `F-EMPTY` | Conta recém-autenticada, sem Portfolio e sem Asset | dashboard vazio, lista de carteiras vazia e primeiro fluxo de criação |
| `F-CLARA` | Uma carteira ativa, um Asset em BRL e uma compra válida | fluxo feliz de criação/leitura com patrimônio conhecido |
| `F-MULTI` | Duas carteiras ativas e uma arquivada; posições em BRL; uma cotação stale, uma unavailable e uma moeda incompatível | consolidado parcial, diagnóstico por carteira e detalhe read-only |
| `F-CONFLICT` | Carteira ativa, Asset existente e tentativa de `sell` acima do saldo ou resultado de escrita desconhecido | erro acionável, reconciliação por releitura e nenhuma repetição cega |

## 3. Perfis e tarefas observáveis

### Perfil A — Marina, primeira organização

Marina acabou de entrar e quer registrar sua primeira compra sem conhecer a
diferença entre Asset, operação, posição e patrimônio.

| Tarefa | Critério observável de sucesso | Fricção a investigar |
| --- | --- | --- |
| Entrar e encontrar o próximo passo | identifica onde criar uma carteira sem ajuda | dashboard vazio oferece “Ver carteiras”, mas não “Criar carteira” |
| Criar a primeira carteira | informa nome e entende a moeda-base | BRL é fixa nesta versão e a justificativa aparece no formulário, não no objetivo da tarefa |
| Registrar a compra | encontra cadastro de Asset e entende quantidade, preço, data e taxa | “Cadastrar posição” pode sugerir que a posição é criada diretamente, quando o fato é uma operação |
| Conferir o patrimônio | distingue valor investido, patrimônio conhecido e cotação | exige ler textos auxiliares para entender que não há performance histórica |

### Perfil B — Rafael, acompanhamento de múltiplas carteiras

Rafael já mantém mais de uma carteira e entra para saber o que mudou, qual
carteira precisa de atenção e qual valor pode ser considerado conhecido.

| Tarefa | Critério observável de sucesso | Fricção a investigar |
| --- | --- | --- |
| Começar pela visão geral | identifica carteiras, escopo ativo e cobertura das cotações | dashboard mistura resumo e caminhos de trabalho; o escopo de “Atualizar dados” não é explícito |
| Isolar uma carteira | abre a carteira correta a partir da distribuição | diagnóstico de composição/cobertura fica fechado em `<details>` |
| Interpretar dados incompletos | não lê stale/unavailable ou moeda incompatível como zero | “Sem cotação” pode representar causas diferentes em superfícies diferentes |
| Comparar ativa e arquivada | entende que arquivada permanece legível e não aceita novas operações | restauração passa por configurações e a carteira arquivada não aparece no consolidado ativo |

### Perfil C — Joana, conferência e correção

Joana revisa o histórico, tenta lançar uma venda incorreta e precisa saber se
uma falha foi concluída ou não.

| Tarefa | Critério observável de sucesso | Fricção a investigar |
| --- | --- | --- |
| Encontrar o histórico | chega ao ledger da carteira sem procurar em uma área global inexistente | histórico depende da abertura de uma carteira e não há filtro/paginação observável |
| Recuperar uma venda inválida | entende saldo insuficiente e corrige por novo fato | mensagem precisa preservar append-only sem sugerir edição/exclusão do fato |
| Recuperar resultado desconhecido | verifica o histórico uma vez antes de tentar novamente | “Verificar histórico” é a ação correta, mas precisa ser padrão para timeout/conflito |
| Ler uma carteira arquivada | entende o modo somente leitura e encontra restauração quando necessário | leitura financeira e configurações editáveis ficam em superfícies próximas |

## 4. Walkthrough UX-01

### 4.1 Cenário de sucesso — `F-EMPTY` → `F-CLARA`

| Etapa | Comportamento atual observado | Achado de produto | Decisão de discovery |
| --- | --- | --- | --- |
| Login | Google Sign-In mostra loading, popup, cancelamento, bloqueio e erro; após sessão vai para `/dashboard` | a entrada é orientada ao consolidado antes de existir uma carteira | **Simplificar:** manter Google e estados explícitos; encaminhar o primeiro próximo passo para Carteiras |
| Shell | há logo, links Início/Carteiras/Ativos e skip link; logout e item ativo não são visíveis | identidade de localização e encerramento de sessão ficam incompletos | **Reorganizar:** shell deve distinguir Visão geral, Carteiras e Ativos; incluir logout e estado ativo no pacote de shell futuro |
| Dashboard vazio | informa “Nenhuma carteira ativa” e oferece “Ver carteiras” | o usuário precisa de um clique adicional e ainda precisa descobrir criar | **Substituir como entrada inicial:** o dashboard continua como visão geral, mas não deve ser o primeiro destino obrigatório para uma conta vazia |
| Lista de carteiras | lista, criação, estados empty/loading/error e separação ativa/arquivada | corresponde diretamente à tarefa de começar a organizar patrimônio | **Preservar e promover:** Carteiras é o workspace inicial recomendado |
| Detalhe e ação | detalhe oferece “Cadastrar posição”, histórico, configurações e ativos | posição é derivada; a ação começa por um fato patrimonial | **Renomear/simplificar:** “Registrar operação” deve ser a ação primária; Position permanece conceito de leitura |
| Asset | catálogo permite criar/editar/excluir com validação e conflitos | identidade do Asset é uma preparação necessária, mas pode interromper o fluxo | **Reorganizar:** permitir entrada contextual no fluxo de primeira operação sem transformar Asset em Position |
| Transaction | formulário aceita buy/sell, quantidade, preço, data e taxa; ledger é append-only | os campos são coerentes, mas o vocabulário “lançamento/evento/operação” varia | **Preservar e padronizar:** “Registrar operação” para ação e “Histórico de operações” para leitura |
| Leitura patrimonial | detalhe mostra valor investido, patrimônio conhecido, posições e cobertura | a distinção semântica existe, mas é distribuída entre cards e diagnósticos | **Preservar e tornar explícito:** valor conhecido nunca vira zero e ausência de performance deve ser visível |

### 4.2 Cenário vazio e arquivado — `F-EMPTY` e `F-MULTI`

1. Uma conta sem carteira deve chegar a uma ação primária de criação em uma
   única superfície. “Nenhuma carteira” é estado de começo, não falha.
2. Uma conta com somente carteiras arquivadas deve distinguir “não há carteira
   ativa” de “não há carteira”. A lista de carteiras é a fonte de ação para
   restaurar ou criar uma nova.
3. O consolidado global deve excluir carteiras arquivadas, mas explicar o
   escopo. O detalhe arquivado deve continuar legível e informar
   `read-only`/“somente leitura” junto das ações bloqueadas.
4. A restauração é uma ação de lifecycle, não um novo Portfolio. O caminho
   atual via configurações é válido, mas a descoberta deve testar se o contexto
   do card arquivado precisa oferecer essa ação diretamente.

**Decisão:** preservar archive/restore e histórico; simplificar o empty state
com uma ação primária; reorganizar a separação entre carteiras ativas,
arquivadas e criação; não tratar arquivada como erro ou delete.

### 4.3 Cenário de falha e leitura parcial — `F-MULTI` e `F-CONFLICT`

1. O dashboard mantém a última leitura durante refresh/erro e informa quando o
   total é parcial. Isso deve ser preservado.
2. `stale` deve dizer que o dado é utilizável, mas desatualizado; `unavailable`
   deve dizer que não há valor disponível. Nenhum dos dois pode aparecer como
   zero ou como performance.
3. Uma falha isolada de cotação não deve esconder a carteira nem impedir a
   leitura do ledger. O diagnóstico deve apontar ativo/carteira afetados e
   oferecer retry no escopo correto.
4. Uma venda acima do saldo deve ficar junto ao campo/ação que falhou. Timeout,
   conflito ou resultado desconhecido deve oferecer “Verificar histórico” e
   nunca repetir cegamente uma escrita não idempotente.

**Decisão:** preservar `partial`, `stale`, `unavailable`, última leitura válida,
append-only e reconciliação; reorganizar diagnósticos para o contexto da tarefa;
remover qualquer copy que use “sem cotação” como explicação única para causas
distintas.

## 5. Comparação das entradas

| Critério | Dashboard global | Lista de carteiras |
| --- | --- | --- |
| Primeiro passo para conta vazia | Mostra ausência de carteira e envia para outra tela | Oferece criação no próprio contexto |
| Primeiro passo para conta com dados | Resume patrimônio e distribuição | Leva diretamente ao espaço de trabalho |
| Registrar primeira operação | Exige localizar uma carteira antes de agir | Mostra a carteira e suas ações contextuais |
| Entender escopo | Bom para visão consolidada de carteiras ativas | Bom para separar ativa, arquivada e criação |
| Diagnosticar parcial/stale/unavailable | Já possui cobertura, mas concentra muita informação | Diagnóstico depende de abrir detalhe |
| Risco de interpretação | “Patrimônio” pode parecer completo mesmo parcial | Menor distância entre intenção e ação, mas não substitui o resumo global |

### Decisão de entrada

**Carteiras deve ser a entrada autenticada padrão e o workspace principal.** O
dashboard global deve ser preservado como **Visão geral**, acessível pelo shell e
útil para quem já possui dados, mas não deve bloquear a tarefa de criar a
primeira carteira ou registrar a primeira operação.

Essa decisão é uma hipótese de produto baseada no walkthrough, não pesquisa com
usuários. Ela reduz o beco sem saída do dashboard vazio, aproxima a entrada da
primeira tarefa observável e mantém o consolidado para a pergunta “como está meu
patrimônio?”. A hipótese deve ser validada com um protótipo comparando tempo para
criar carteira, localizar uma carteira e interpretar um total parcial.

A decisão é conceitual: não congela `/portfolios`, `/dashboard`, DTOs,
endpoints, envelopes ou o router futuro.

## 6. Decisão por fluxo

| Fluxo | Decisão | Justificativa e dependências |
| --- | --- | --- |
| Login/sessão | **Preservar e simplificar** | Google e estados de entrada são baseline; logout, retorno à origem e sessão expirada exigem 012-04/014 |
| Shell | **Reorganizar** | manter skip link e separação pública/aplicada; explicitar Visão geral, Carteiras, Ativos, item ativo e logout |
| Portfolio/lista | **Preservar e promover** | é o melhor ponto de partida para vazio, criação, ativas e arquivadas; alimenta a slice 017 |
| Portfolio/detail | **Preservar e dividir** | separar resumo acionável de diagnósticos financeiros sem perder leitura, refresh e read-only |
| Portfolio/settings | **Preservar, mas contextualizar** | rename/archive/restore são lifecycle; confirmação e feedback devem permanecer próximos da ação |
| Asset/catalog | **Preservar e reorganizar** | Asset é identidade reutilizável; entrada contextual pode reduzir ruptura antes da Transaction |
| Transaction/ledger | **Preservar e simplificar** | fatos são append-only; padronizar “Registrar operação”, erros acionáveis e reconciliação |
| Quotes | **Preservar e tornar contextual** | stale/unavailable e retry são importantes; diagnóstico deve estar perto do valor afetado |
| Dashboard/global | **Reorganizar, não remover** | manter como Visão geral para múltiplas carteiras; não usar como entrada universal |
| Performance histórica | **Remover da promessa atual** | não há snapshots confiáveis; não apresentar gráfico, rentabilidade ou crescimento como se existissem |
| Busca/filtros/paginação | **Deferir** | são ações ausentes observadas, mas precisam de volume e tarefas medidas antes de virar requisito |

## 7. Backlog priorizado

| Prioridade | Item | Evidência do walkthrough | Destino sugerido | Critério observável |
| --- | --- | --- | --- | --- |
| P0 | Tornar Carteiras a entrada padrão e nomear dashboard como Visão geral | `F-EMPTY` exige desvio para criar; lista corresponde à tarefa | 012-03/017 | pessoa encontra criação sem passar pelo dashboard vazio |
| P0 | Criar ação primária no estado sem carteira | dashboard só oferece “Ver carteiras” | 012-03/017 | estado vazio tem explicação e próximo passo único |
| P0 | Padronizar “Registrar operação” versus “posição/evento/lançamento” | “Cadastrar posição” pode confundir fato com derivação | 012-07/012-09 | tarefa de compra é descrita como operação e leitura como posição |
| P0 | Preservar e expor semântica de parcial/stale/unavailable | componentes já distinguem estados, mas diagnósticos podem ficar ocultos | 012-05/012-10/019 | nenhum estado desconhecido aparece como zero ou valor completo |
| P1 | Expor escopo do refresh e último dado válido | refresh global e por detalhe não explicam sempre o que atualizam | 012-04/012-10 | usuário identifica escopo, horário e se está vendo último dado válido |
| P1 | Tornar conflito/resultado desconhecido um caminho de reconciliação | ledger já orienta “Verificar histórico” | 012-04/012-09/018 | uma falha não dispara retry cego e permite confirmar o estado |
| P1 | Clarificar arquivada: legível, sem novas operações, restaurável | comportamento existe, mas ações ficam separadas | 012-03/012-08/017 | usuário diferencia arquivar de excluir e encontra restaurar |
| P1 | Logout, navegação ativa e retorno à origem | gaps do shell observados | 012-03/012-04/014 | usuário sabe onde está e consegue encerrar sessão |
| P2 | Filtros, busca e paginação | ações ausentes em listas | 012-09/016 | decisão baseada em volume sintético e tarefa medida |
| P2 | Revisar profundidade de diagnósticos no detalhe | cobertura está em `<details>` | 012-05/012-10 | diagnóstico crítico é descoberto sem depender de elemento fechado |

## 8. Perguntas abertas e riscos residuais

1. Usuários reais preferem Carteiras como entrada padrão ou uma visão geral
   contextual para quem já possui dados?
2. “Visão geral” comunica melhor o consolidado do que “Início” sem aumentar a
   carga de navegação?
3. O primeiro Asset deve ser criado dentro da tarefa de primeira operação ou em
   um passo explícito do catálogo?
4. Qual volume torna filtros, busca e paginação necessários no ledger e no
   catálogo?
5. Como apresentar uma cotação stale em 320 px e zoom 200% sem esconder o valor
   conhecido?
6. A ação de restaurar deve aparecer no card arquivado ou permanecer em
   configurações?
7. Quais métricas do protótipo indicarão compreensão de “patrimônio conhecido”
   sem sugerir performance histórica?

Riscos que permanecem: ausência de pesquisa com usuários reais; walkthrough
baseado em implementação legada; falta de teste React/E2E; possível confusão
entre indisponibilidade de carteira, ativo sem cotação e falha de provedor; e
decisões de navegação ainda dependentes de acessibilidade, estados de sessão e
protótipos responsivos.

## 9. Handoff

- **012-03:** usar Carteiras como hipótese de entrada, Visão geral como resumo e
  shell com navegação ativa, logout e retorno coerente.
- **012-04:** especificar sessão expirada, refresh único, offline e resultado
  desconhecido sem retry cego.
- **012-05/012-06:** validar linguagem, contraste, 320 px, zoom 200%, foco e
  descoberta dos diagnósticos financeiros.
- **012-07:** tratar Portfolio/lista como slice de referência, incluindo vazio,
  conflito, archive/restore e criação.
- **012-08:** preservar Asset referenciado e tornar lifecycle compreensível sem
  trocar `assetId`, reescrever Transactions ou fazer cascade.
- **012-09:** usar “Registrar operação”, ledger append-only e reconciliação de
  venda/conflito como requisitos de fluxo, não como endpoints congelados.
- **012-10:** manter dashboard como Visão geral e testar hierarquia, partial,
  stale, unavailable, cobertura e ausência de performance histórica.
- **017–019:** derivar capabilities das tarefas aprovadas; nenhum URL, DTO,
  OpenAPI ou schema é congelado por este documento.
