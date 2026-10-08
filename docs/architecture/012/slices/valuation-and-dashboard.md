# 012 — Pacote de decisão e freeze semântico de Quotes, valuation e dashboard

- **Ticker:** `012`
- **Subtarefa:** `012-10`
- **Estado da decisão:** freeze semântico preparado; URLs, DTOs, OpenAPI e implementação permanecem provisórios
- **Dados:** somente fixtures sintéticas; nenhum dado patrimonial real, token ou write
- **Owner de revisão:** Produto/UX, com revisão técnica de 019, contratos de 016 e acessibilidade de 013

## 1. Escopo, invariantes e decisão

Este pacote transforma o handoff de Quotes/Positions da 011, a linguagem de
`012-05` e as decisões de Portfolio/Transaction em uma leitura coerente para duas
superfícies: **Visão geral** (consolidado das carteiras ativas) e **detalhe da
carteira**. O artefato congela intenção, hierarquia, semântica financeira,
estados, recovery, copy, critérios de acessibilidade e dependências. Não congela
URL, DTO, OpenAPI, cache, provider ou modelo persistido.

As regras não negociáveis são:

1. **Transaction é o fato; Position, valuation, allocation e dashboard são
   derivações.** Nenhuma `Position` é persistida ou tratada como fonte
   autoritativa pela tela.
2. **Carteiras ativas** entram na Visão geral. Carteiras arquivadas continuam
   legíveis no detalhe, em somente leitura, mas ficam fora do consolidado ativo e
   da distribuição global.
3. **Patrimônio conhecido** soma somente valores correntes conhecidos na
   moeda-base. `unavailable`, moeda incompatível e carteira ilegível não são
   estimados como zero.
4. **Custo de aquisição remanescente** é uma derivação do ledger para posições
   abertas. Não é aporte, saldo em conta, patrimônio, ganho ou performance.
5. **Cotação stale** é utilizável, mas desatualizada: mantém o valor conhecido e
   exibe horário/frescor. **Cotação unavailable** não fornece valor e deixa o
   item fora do patrimônio conhecido.
6. **Cobertura das cotações** conta unidades consultadas (`fresh`, `stale`,
   `unavailable`); nunca é percentual do patrimônio nem garantia de preço.
7. Sem snapshots confiáveis não há performance histórica, rentabilidade, retorno,
   ganho ou gráfico de evolução nesta slice.
8. Refresh preserva o último snapshot válido, informa escopo e não substitui uma
   lacuna por zero. Resultado atrasado de outra leitura não pode sobrescrever a
   leitura mais nova.

### Decisão de hierarquia

| Ordem | Superfície | Pergunta respondida | Conteúdo primário | Não fazer |
| --- | --- | --- | --- | --- |
| 1 | Visão geral | “Como está o patrimônio que consigo conhecer?” | título/escopo, patrimônio conhecido, custo de aquisição remanescente, estado global e próxima ação | não ser entrada obrigatória para criar a primeira carteira; não parecer patrimônio total quando parcial |
| 2 | Visão geral — distribuição | “Qual carteira compõe o conhecido?” | carteiras ativas, valor conhecido por carteira e link para detalhe | não incluir arquivadas nem dar participação quando o denominador conhecido é zero |
| 3 | Visão geral — atenção | “O que ficou de fora e por quê?” | gaps de carteira/ativo, cobertura, stale, unavailable e moeda incompatível | não esconder o diagnóstico crítico em um disclosure fechado |
| 4 | Detalhe da carteira | “O que forma esta carteira?” | contexto/lifecycle, patrimônio conhecido, custo, posições abertas e alocação | não chamar custo de valor investido sem qualificador; não mostrar operação em arquivada |
| 5 | Detalhe — diagnóstico | “Posso confiar nesta leitura?” | último horário, frescor, causa sanitizada, escopo do retry e moeda | não chamar cotação de garantia nem expor provider/stack trace |

**Carteiras continua sendo a entrada autenticada padrão**, conforme `012-02` e
`012-07`; a Visão geral permanece uma superfície nomeada do shell para a pergunta
de consolidado. O protótipo compara ambas sem transformar esta decisão conceitual
em uma rota obrigatória.

## 2. Protótipo e fixtures sintéticas

O artefato executável independente está em
[`valuation-and-dashboard-prototype.html`](valuation-and-dashboard-prototype.html).
Ele alterna Visão geral/detalhe e simula todos os estados críticos localmente. Não
usa Next, API, Firebase, Firestore, BRAPI, cache ou persistência.

### 2.1 Fixtures

| Fixture | Conteúdo sintético | Estado e tarefa observável |
| --- | --- | --- |
| `F-READY` | Clara e Aurora ativas; 2 posições BRL; cotações recentes | localizar valor conhecido, custo e abrir o detalhe correto |
| `F-PARTIAL` | uma cotação conhecida e uma lacuna de cotação | dizer qual valor é conhecido, qual ficou fora e onde atualizar |
| `F-STALE` | posições com último preço válido fora da janela de frescor | reconhecer que o valor é utilizável, mas não atual; encontrar horário e refresh |
| `F-TIMEOUT` | uma cotação não respondeu no limite; posição e custo continuam legíveis | recuperar sem ler indisponível como zero |
| `F-RATE-LIMITED` | provedor recusou temporariamente uma cotação | distinguir indisponibilidade temporária de ausência de posição; retry nomeado |
| `F-CURRENCY` | posição/quote em USD em carteira BRL | entender “moeda incompatível”, exclusão sem conversão cambial e custo parcial |
| `F-PORTFOLIO-UNAVAILABLE` | Aurora ativa não pôde ser lida; Clara continua conhecida | interpretar total parcial e carteira sem valor, sem removê-la silenciosamente |
| `F-ARCHIVED` | Reserva de longo prazo arquivada, legível e fora do global | abrir detalhe somente leitura e confirmar que não entra na Visão geral |
| `F-REFRESH` | snapshot conhecido durante uma atualização | observar escopo, último horário e resolução do refresh sem apagar o snapshot |

Valores como `R$ 13.400,00`, `R$ 8.300,00` e `USD 1.200,00` são didáticos e não
representam usuários. A moeda-base BRL é uma escolha da fixture, não uma enumeração
final de contrato.

### 2.2 Walkthrough de compreensão e recuperação

1. **`F-READY`:** identificar que “Patrimônio conhecido” e “Custo de aquisição
   remanescente” respondem perguntas diferentes; abrir Clara pela distribuição.
2. **`F-PARTIAL`:** apontar o valor que não entrou no total, localizar a causa e
   escolher “Atualizar cotações desta carteira”; não procurar um zero para a
   lacuna.
3. **`F-STALE`:** explicar que stale não é unavailable, localizar a hora da
   cotação e confirmar que o botão atualiza apenas o escopo anunciado.
4. **`F-TIMEOUT`/`F-RATE-LIMITED`:** ler a causa sanitizada, reconhecer que a
   posição continua no ledger mas sem valor corrente e acionar retry uma vez.
5. **`F-CURRENCY`:** identificar ativo, moeda da posição, moeda-base e exclusão
   dos totais; confirmar que não houve conversão cambial silenciosa.
6. **`F-PORTFOLIO-UNAVAILABLE`:** distinguir “carteira não lida” de “carteira
   vazia”; interpretar a Visão geral como parcial e abrir o detalhe para retry.
7. **`F-ARCHIVED`:** alternar para detalhe, confirmar “somente leitura” e que
   `Registrar operação` não existe; voltar à Visão geral e confirmar ausência da
   carteira arquivada no consolidado.
8. **`F-REFRESH`:** iniciar uma atualização global e outra no detalhe; manter o
   snapshot visível, anunciar escopo e concluir com um horário sintético.

O critério heurístico de sucesso é a pessoa conseguir responder, sem cálculo
externo: “qual valor é conhecido?”, “o que ficou fora?”, “a cotação está fresca?”
e “qual ação recupera este estado?”. Isso é evidência de walkthrough documental,
não pesquisa com usuários nem declaração de conformidade WCAG.

## 3. Copy e semântica financeira

### 3.1 Vocabulário aprovado

| Conceito | Copy principal | Regra de interpretação |
| --- | --- | --- |
| soma corrente incluída | **Patrimônio conhecido** | soma dos valores disponíveis na moeda-base; pode ser parcial |
| custo da posição | **Custo de aquisição remanescente** | derivado das posições abertas; não é aporte ou patrimônio |
| preço externo | **Cotação** | preço com `quotedAt`, `fetchedAt` e frescor; não é garantia |
| contagem de leituras | **Cobertura das cotações** | contagem de solicitadas/fresh/stale/unavailable; não é valor coberto |
| cotação fora da janela | **Cotação desatualizada (stale)** | última leitura utilizável, marcada e datada |
| valor ausente | **Indisponível (unavailable)** | não há valor nesta leitura; nunca renderizar `0` |
| lacuna com itens conhecidos | **Leitura parcial (partial)** | conhecido e desconhecido aparecem juntos, com causa |
| retorno não calculável | **Sem performance histórica** | não há série de snapshots nesta visão |
| fato do ledger | **Operação** / **Registrar operação** | não usar “cadastrar posição” |

### 3.2 Copy de estado e ação

| Estado | Mensagem mínima | Ação segura |
| --- | --- | --- |
| `loading` | “Carregando patrimônio das carteiras…” | aguardar; não mostrar zero |
| `refreshing` | “Atualizando o patrimônio das carteiras. A última leitura continua visível.” | manter snapshot; não duplicar refresh |
| `ready` | “Patrimônio conhecido” | abrir carteira, ler posições ou atualizar escopo |
| `partial` | “Patrimônio conhecido; alguns dados ainda não estão disponíveis.” | “Ver detalhes” e retry no escopo afetado |
| `stale` | “Última atualização em [horário]. Esses dados podem estar desatualizados.” | “Atualizar [escopo]” |
| `unavailable` | “Não foi possível obter este valor agora. Ele não foi considerado zero.” | retry nomeado ou voltar à lista |
| timeout | “A cotação demorou demais e está indisponível.” | retry manual; manter operação/posição |
| rate limit | “A cotação está temporariamente indisponível.” | aguardar e tentar novamente; não prometer atualização |
| moeda incompatível | “Moeda incompatível; este item ficou fora do patrimônio conhecido.” | corrigir configuração/contrato futuro; não converter silenciosamente |
| carteira indisponível | “Não foi possível ler esta carteira; seu valor não foi estimado como zero.” | abrir detalhe/retry; preservar a entrada no diagnóstico |
| `archived/read-only` | “Carteira arquivada · somente leitura.” | ler/restaurar; não registrar operação |
| sem performance | “Não há performance histórica disponível nesta visão.” | não oferecer retorno, ganho ou gráfico histórico |

`Valor investido`, `cobertura do patrimônio`, `rentabilidade`, `ganho`, `retorno`
e `cadastrar posição` não são labels da slice. Podem aparecer somente em conteúdo
histórico explicitamente qualificado por outra decisão, nunca como sinônimos.

## 4. Matriz de estados, falhas e recovery

| Superfície | Estado/cenário | Snapshot e semântica | Diagnóstico visível | Ação e foco |
| --- | --- | --- | --- | --- |
| global/detalhe | `loading` | sem leitura válida; nenhum número inventado | escopo em carregamento | região de status; foco não salta repetidamente |
| global/detalhe | `ready` | leitura completa para o escopo | horário quando relevante | título → resumo → ação primária |
| global/detalhe | `refreshing` | snapshot permanece enquanto nova leitura ocorre | “Atualizando [escopo]” | botão ocupado; resultado retorna ao título/status |
| global/detalhe | `partial` | conhecido permanece; gaps não são imputados | carteira/ativo e causa sanitizada | “Ver detalhes”/retry local; diagnóstico não fica só em `<details>` |
| global/detalhe | `stale` | último valor utilizável, fora da janela | `quotedAt`, `fetchedAt`, stale | “Atualizar [escopo]”; nunca chamar atual |
| posição | `unavailable` | posição/ledger permanece; valor corrente não existe | código traduzido para copy | “Tentar novamente”; valor textual “Indisponível” |
| quote | `TIMEOUT` | não há quote nova; snapshot anterior pode continuar stale | timeout, sem stack/provider | retry manual limitado; sem zero |
| quote | `RATE_LIMITED` | não há quote nova; não indica ausência de ativo | temporariamente indisponível | aguardar/retry; telemetria redigida |
| quote/posição | `CURRENCY_MISMATCH` | quote ou posição não pode compor BRL | moedas e ausência de FX | corrigir dependência; não converter |
| global | carteira indisponível | demais carteiras continuam; total é parcial | nome e motivo sanitizado; arquivada não aparece | abrir/retry no detalhe; foco no resumo |
| detalhe | `archived/read-only` | leitura corrente permitida, writes patrimoniais bloqueados | lifecycle persistente | restaurar; sem Registrar operação |
| global/detalhe | offline com snapshot | snapshot vira `stale` + offline | conexão e horário separados | retry quando online; conservar contexto |
| global/detalhe | offline sem snapshot | não há valor conhecido | indisponibilidade de leitura | retry; não apresentar empty |
| sessão | `unauthorized` | limpar/invalidar leitura do owner anterior | copy sanitizada | um recovery de sessão, depois login |

Para `401`, aplica-se o limite transversal de `012-04`: um refresh forçado de token
e, no máximo, uma repetição da mesma leitura idempotente. Timeout, rate limit,
offline, resposta atrasada e qualquer falha de composição não são autorização e
não iniciam loop de login. Nenhuma leitura global pode substituir uma resposta
válida de outro owner ou de outro request.

### 4.1 Erros sanitizados e causas

| Código/categoria provisória | Copy de UI | Preservação |
| --- | --- | --- |
| `TIMEOUT` | “A cotação demorou demais e está indisponível.” | posição, custo e ledger permanecem; valor corrente fora |
| `RATE_LIMITED` | “A cotação está temporariamente indisponível.” | não afirmar falha definitiva ou ausência do ativo |
| `CURRENCY_MISMATCH` | “Cotação incompatível; este item ficou fora do patrimônio conhecido.” | moeda/FX são decisão explícita, sem arredondamento silencioso |
| `NOT_FOUND`/`UNSUPPORTED_ASSET` | “Não foi possível obter esta cotação para o ativo.” | símbolo/provider não vazam como autoridade de identidade |
| `PROVIDER_UNAVAILABLE`/`INVALID_PROVIDER_RESPONSE` | “A cotação está indisponível no momento.” | detalhes técnicos ficam em telemetria redigida |
| leitura de Portfolio falha | “Não foi possível ler esta carteira; seu valor não foi estimado como zero.” | entrada continua no diagnóstico global |
| composição/ledger inválido | “O histórico desta carteira não pôde ser composto; seu valor não foi estimado como zero.” | não esconder a carteira nem fabricar posição |

O código de erro é uma classificação provisória de capability, não um contrato
HTTP. A UI não mostra mensagem de provider, token, UID, stack trace, query ou
existência de recurso de outro owner.

## 5. Dados conceituais e capabilities provisórias

Os nomes abaixo expressam intenção de produto. Não são endpoints, DTOs, schema,
paginação física ou promessa de que o backend repetirá a composição client-side.
Owner é derivado do token verificado; IDs são opacos; decimais e timestamps
preservam representação canônica.

| Capability | Intenção/input conceitual | Saída/view model mínima | Dependências e limites |
| --- | --- | --- | --- |
| `valuation/portfolio` | `{ portfolioId, refreshIntent? }` | contexto/lifecycle, moeda-base, posições abertas, custo, patrimônio conhecido, allocation, quotes, gaps e estado | Portfolio legível; Transaction/Asset/Quote; sem Position persistida; arquivada é read-only |
| `valuation/global` | `{ scope: "active-portfolios", refreshIntent? }` | carteiras ativas, total conhecido, custo conhecido, distribuição, cobertura, gaps por carteira/ativo | exclui `archivedAt != null`; sem FX implícito; uma falha isolada produz parcial |
| `quote/read` | `{ assetIds, portfolioCurrency? }` | por ativo: preço decimal, moeda, `quotedAt`, `fetchedAt`, freshness ou código sanitizado | BRAPI backend-only; lote/deduplicação são hipóteses; unavailable não vira zero |

### Dependências de query orientadas à tarefa

| Leitura | Mínimo necessário | O que não deve ser exigido da UI |
| --- | --- | --- |
| detalhe | Portfolio/lifecycle; operações necessárias para derivar posições; identidade dos Assets; quotes dos ativos abertos; alocação | coleção Position persistida, scan de todos os owners ou provider BRAPI |
| global | lista de carteiras ativas; composição/ledger por carteira; catálogo de Assets referenciados; conjunto deduplicado de quotes; gaps | carteiras arquivadas no total, conversão FX ou valor imputado |
| refresh global | mesmo escopo da leitura global, com request identity | invalidar detalhe não solicitado ou apagar snapshot durante loading |
| refresh detalhe | mesmo `portfolioId` e dependências daquele detalhe | atualizar todas as carteiras ou mudar contexto silenciosamente |

### Limites e decisões encaminhadas

- O limite atual de lote 20, timeout de provider, cache process-local e uma única
  tentativa são baseline de implementação; não são contrato da capacidade.
- `quote/read` deve declarar se uma resposta stale veio de snapshot válido ou se a
  nova leitura falhou; o consumidor não pode inferir frescor só pela presença do
  preço.
- 019 deve decidir query, paralelismo, paginação de operações, TTL, deduplicação,
  correlation ID e performance observável após medir payloads sintéticos.
- 016 deve definir serialização, erros, compatibilidade N/N-1, owner e políticas de
  retry; não copiar os objetos TypeScript como DTO final.
- 015 deve preservar decimal string, moeda, precisão temporal, `partial/stale` e
  distinção entre fato, snapshot e derivação.

## 6. Refresh, telemetria percebida e métricas

### Contrato de percepção

1. O rótulo diz **Atualizar patrimônio das carteiras** na Visão geral e
   **Atualizar patrimônio desta carteira** no detalhe.
2. Durante refresh, números conhecidos, gaps, posição e último horário continuam
   visíveis; uma região `polite` anuncia somente escopo e progresso.
3. Em sucesso, atualizar o horário e remover o estado transitório; em falha,
   manter o snapshot e marcar stale/offline/unavailable conforme a evidência.
4. Um segundo clique enquanto a mesma leitura está pendente não cria request
   concorrente. Resposta velha não substitui a mais nova.
5. O diagnóstico informa o resultado percebido, não a latência interna ou o
   provider. O usuário consegue decidir se deve aguardar, retry ou abrir detalhe.

### Eventos conceituais de observabilidade

| Evento redigido | Campos permitidos | Pergunta de produto |
| --- | --- | --- |
| `valuation_viewed` | capability, scope, state, fixture/test flag, item counts | a hierarquia permite localizar o resumo? |
| `valuation_refresh_started` | capability, scope, visibleSnapshot, requestSequence | o refresh preserva contexto e escopo? |
| `valuation_refresh_finished` | capability, scope, finalState, durationBucket, gapCount | a leitura resolve ou fica presa em loading? |
| `quote_state_seen` | freshness/status/cause class, asset count, synthetic flag | stale/unavailable são compreendidos sem zero? |
| `valuation_recovery_selected` | scope, state, action (`retry`, `open-detail`, `back`) | a ação oferecida recupera o estado? |
| `valuation_copy_check` | concept, expectedClassification, observedClassification, synthetic flag | custo, patrimônio e performance foram distinguidos? |

Não registrar símbolo, preço, quantidade, nome de carteira, ID, token, UID,
payload financeiro ou texto de provider. Duração deve ser agrupada, e qualquer
telemetria real exige decisão de privacidade posterior. Essas métricas são de
feedback percebido; não representam rentabilidade, ganho ou performance do
usuário.

## 7. Acessibilidade, densidade e critérios de freeze

| Critério | Decisão/critério observável |
| --- | --- |
| Teclado/foco | skip link → shell → título → status/escopo → resumo → ação de refresh → distribuição/posições; após retry, foco vai ao status/resultado sem saltos |
| Leitor de tela | `h1` nomeia Visão geral ou carteira; estado, escopo e horário são anunciados uma vez; indisponível não é “zero” |
| Diagnóstico | partial/stale/unavailable, causa e próxima ação ficam visíveis junto do resumo; disclosure só complementa |
| Tabela | ativo, valor conhecido/indisponível, custo, quantidade e participação têm cabeçalhos associados; valores longos não dependem de truncamento |
| Cor/contraste | estado sempre tem texto/rótulo; medir texto, borda e foco nos temas em 013/019 |
| 320 px/200% | cards em uma coluna, nomes/números quebram, ações permanecem alcançáveis, sem scroll horizontal para ler diagnóstico ou agir |
| Mobile/densidade | resumo vem antes de distribuição e tabela; diagnósticos têm hierarquia sem ocultar impacto financeiro |
| Arquivada | “somente leitura” e ausência de Registrar operação são texto persistente, não apenas botão desabilitado |
| Refresh | nomeia escopo e resultado; não usa somente spinner nem remove o snapshot |

### Gate de freeze semântico

019 consegue implementar, sem nova decisão de Produto, os fluxos: detalhe pronto,
global pronto, parcial, stale, unavailable, timeout, rate limit, moeda
incompatível, carteira indisponível, arquivada fora do global, refresh global e
refresh por carteira. O gate **não** autoriza congelar URL, DTO, OpenAPI, banco,
cache, provider, lote ou posição persistida.

## 8. Handoff, decisões abertas e riscos residuais

### Handoff

- **013:** transformar hierarquia, headings, live regions, tabela, foco,
  responsividade e disclosure em primitives testáveis; executar 320 px, zoom e
  leitor de tela.
- **014:** manter sessão/owner separados da leitura, um recovery de `401`, erros
  sanitizados e nenhum loop de autenticação causado por timeout/rate limit.
- **015:** preservar decimal string, timestamps, moeda, último snapshot e
  distinção de fato/read model/quote; criar fixtures/golden masters.
- **016:** derivar queries/capabilities, limites, erros, N/N-1, owner, retry,
  correlation e compatibilidade sem copiar a forma do protótipo.
- **017:** integrar o detalhe à carteira, lifecycle arquivado/read-only e ação
  contextual sem tratar Position como write.
- **018:** manter Transaction/ledger como fonte para composição e comunicar
  resultado desconhecido sem apagar fatos.
- **019:** implementar Quotes, valuation, alocação e dashboards com as regras de
  partial/stale/unavailable, moeda e arquivadas; medir o refresh e fechar o
  contrato da slice após nova evidência.

### Questões abertas para 019

1. Qual janela de frescor e política stale-if-error é compreensível para cada
   mercado sem apresentar o valor como atual?
2. A Visão geral precisa de atualização automática ou somente refresh explícito?
3. Qual query mínima fornece gaps por ativo sem overfetch e com isolamento por
   owner?
4. Como expor rate limit sem incentivar repetição em massa: retry manual,
   backoff, horário sugerido ou ação de suporte?
5. Qual volume sintético exige paginação/filtros na tabela de posições e na
   distribuição?
6. Uma posição em moeda não compatível deve ser apenas excluída do total ou
   também exigir configuração de carteira antes de qualquer leitura?
7. Qual evidência de navegador/tecnologia assistiva aprova que o diagnóstico
   crítico não ficou dependente de `<details>`?

### Riscos residuais e bloqueios

Não há bloqueio documental de execução. Ainda não houve pesquisa com usuários,
execução real de navegador/leitor de tela, medição de contraste, teste concorrente
ou medição de payload/performance. O componente legado modela apenas
`loading/ready/refreshing/error` de forma transversal e deixa diagnósticos em
`<details>`; isso é gap encaminhado a 013/019, não corrigido por este pacote.

O read model continua derivado e não autoritativo. Cache, provider, TTL, lote,
conversão cambial, paginação, formato de erro e contrato HTTP permanecem abertos.
O walkthrough usa fixtures descartáveis e não prova conformidade WCAG nem
compreensão universal.

## Referências

- [`Spec 012`](../../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-02 — jornadas e achados`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-02-mapear-jornadas-e-problemas-de-produto.md)
- [`012-04 — estados e recovery`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-04-definir-estados-sessao-e-recovery.md)
- [`012-05 — acessibilidade e linguagem`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [`012-07 — Portfolio`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-07-prototipar-e-freezar-portfolio.md)
- [`012-09 — Transaction e ledger`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-09-prototipar-transaction-e-ledger.md)
- [`Handoff de Quotes/Positions 011`](../../011/frontend-ux-contract-discovery.md)
- [`Mapa de jornadas`](../journeys-and-product-findings.md)
- [`Matriz de acessibilidade`](../accessibility-and-language-matrix.md)
- [`Estados e recovery`](../state-and-session-recovery.md)
- [`portfolio-summary.ts`](../../../../src/domain/portfolio-summary.ts)
- [`dashboard-read.ts`](../../../../src/data/positions/dashboard-read.ts)
- [`portfolio-projection.ts`](../../../../src/data/positions/portfolio-projection.ts)
- [`GlobalDashboard`](../../../../src/components/dashboard/global-dashboard.tsx)
- [`PortfolioDetail`](../../../../src/components/portfolio/portfolio-detail.tsx)
