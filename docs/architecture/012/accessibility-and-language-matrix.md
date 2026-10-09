# 012 — Matriz de acessibilidade, densidade e linguagem financeira

- **Ticker:** `012`
- **Subtarefa:** `012-05`
- **Experimentos:** UX-03, UX-04, UX-09 e A11Y-01
- **Estado:** auditoria documental concluída; validação manual em protótipo ainda necessária
- **Dados:** fixtures sintéticas; nenhum dado patrimonial real ou write

## 1. Escopo e limite da evidência

Esta matriz audita o shell e as superfícies representativas existentes para
Portfolio, Transaction, Quotes, posições e consolidado. Ela combina inspeção
estática dos componentes com critérios observáveis para o próximo walkthrough
responsivo. Não é declaração de conformidade WCAG, não substitui teste com
tecnologia assistiva e não altera componentes de produção.

O baseline já tem skip link, foco visível global, regiões de status, formatação
decimal exata e copy explícita para lacunas. A ausência de um resultado manual
na coluna **Evidência/status** é um risco, não uma aprovação implícita.

### 1.1 Fixtures de auditoria

| Fixture | Conteúdo sintético | Superfícies e riscos exercitados |
| --- | --- | --- |
| `A11Y-LONG` | Carteira com nome de 120 caracteres, símbolo/mercado longos, quantidade `12345678901234567890.125` e valor `999999999999999999.995` | Reflow, quebra de texto, tabela, anúncio de números e densidade |
| `A11Y-PARTIAL` | Uma carteira legível, uma indisponível, ativo sem cotação e posição com moeda incompatível | `partial`, `unavailable`, cobertura, cor e distinção de patrimônio conhecido |
| `A11Y-STALE` | Snapshot conhecido mantido durante refresh/erro, com horários distintos de cotação e busca | `stale`, atualização, live region, escopo do retry e último dado válido |
| `A11Y-NO-PERFORMANCE` | Compra e venda que formam posição aberta, sem série temporal nem histórico de retorno | custo remanescente, patrimônio, aporte e ausência de performance histórica |
| `A11Y-KEYBOARD` | Login, entrada em Carteiras, detalhe, histórico, formulário, erro e retorno | ordem de tabulação, foco após navegação/erro, diálogo e 404 |

Estas fixtures são contrato de walkthrough, não dados de usuário. Os testes
existentes comprovam a formatação de alguns valores extensos e a preservação de
snapshot (`tests/financial-presentation.test.mjs:16-20,43-62`), mas não
comprovam viewport, zoom, teclado ou leitor de tela.

## 2. Matriz de achados priorizados

Severidades: **bloqueador** impede localizar/compreender/recuperar uma tarefa
crítica; **alta** pode causar perda de contexto ou interpretação financeira
incorreta; **média** degrada eficiência ou robustez assistiva; **baixa** é
melhoria sem impacto esperado na conclusão da tarefa.

| ID | Superfície/estado | Critério WCAG ou observável | Evidência concreta e status | Severidade | Recomendação | Critério de aceite observável |
| --- | --- | --- | --- | --- | --- | --- |
| A11Y-01 | Shell, navegação ativa | 2.4.3, 2.4.4, 4.1.2; a superfície atual deve ser identificável visual e semanticamente | `src/app/(app)/(protected)/layout.tsx:27-54` possui links, mas não `aria-current` e não possui logout visível. A IA exige ambos em `docs/architecture/012/information-architecture.md:19-21,75-79`. Inspeção estática; runtime pendente. | alta | Derivar item ativo da rota e expor logout com nome, foco e confirmação de estado. | Em qualquer rota aplicada, teclado e leitor de tela identificam um único item ativo e alcançam logout sem mouse; nenhuma cor é o único indicador. |
| A11Y-02 | Mudança de rota/deep link | 2.4.3, 2.4.6; foco deve chegar à tarefa sem perder contexto | `main` é focável em `layout.tsx:57-59`, mas não há evidência de foco após navegação em `GlobalDashboard`/`PortfolioDetail`. A política de foco está em `information-architecture.md:202-210`. Inspeção estática; walkthrough pendente. | alta | Focar título/região principal após navegação e resumo de erro após falha, devolvendo foco ao originador quando aplicável. | Após abrir detalhe, histórico, deep link e 404, o foco anunciado é o título/região correta; após erro de formulário, chega ao resumo e ao primeiro campo inválido em ordem previsível. |
| A11Y-03 | Loading, refreshing, partial, stale e unavailable | 4.1.3, 1.3.1; mudanças de estado devem ser anunciadas sem apagar o snapshot | Dashboard anuncia loading/refresh/error em `global-dashboard.tsx:334-376`, mas `partial`, `stale` e `unavailable` aparecem no conteúdo financeiro sem uma região de status transversal. A taxonomia e copy esperadas estão em `state-and-session-recovery.md:53-66,230-238`. Não executado em runtime. | alta | Padronizar status polite/alert por impacto, escopo e timestamp; manter o dado conhecido e anunciar lacunas uma vez. | Leitor de tela ouve o estado e o escopo do retry; refresh com snapshot não repete toda a página; indisponibilidade nunca é anunciada como zero. |
| A11Y-04 | Diagnósticos de cotação | 1.3.1, 2.4.6, 4.1.2; informação necessária não pode depender apenas de conteúdo recolhido | `PositionTable:75-108` e `PortfolioDetail:183-191` deixam diagnóstico/cobertura em `<details>`. A IA determina que item essencial não dependa de `<details>` fechado (`information-architecture.md:277-280`). Inspeção estática; teste de leitor de tela pendente. | alta | Expor resumo mínimo de frescor, lacuna e impacto junto ao valor; usar `<details>` apenas para explicação complementar. | Com `<details>` fechado, a pessoa sabe se o valor é conhecido, parcial, stale ou indisponível; aberto, o diagnóstico tem nome, relação e ordem de leitura compreensíveis. |
| A11Y-05 | `PositionTable` em desktop e 320 px | 1.3.1, 1.3.2, 4.1.2; cabeçalhos, células e relação entre ativo e valores | Tabela é montada com `div`/roles em `position-table.tsx:134-154`; cada célula também possui `aria-label` em `:46-69`, com potencial de anúncio redundante. Não há teste de leitor de tela. | média | Validar a semântica com NVDA/VoiceOver e reduzir rótulos duplicados; preferir tabela nativa se a responsividade permitir. | O leitor anuncia ativo, valor atualizado, custo remanescente, quantidade e participação uma vez, com cabeçalho associado, sem perder o estado “Indisponível”. |
| A11Y-06 | Contraste e estados financeiros | 1.4.3, 1.4.11, 1.4.1; texto, foco, borda e estado devem ser distinguíveis sem cor isolada | Tokens `muted-foreground`, `destructive`, `positive` e `negative` estão em `globals.css:78-90,118-125`; não há matriz de contraste nem medição para ambos os temas. Copy usa texto, mas isso ainda não foi exercitado. | alta | Medir combinações de texto/fundo, foco e controles nos temas claro/escuro; manter rótulo/ícone além de cor para positivo, negativo, stale e indisponível. | Todas as combinações de texto normal atingem 4.5:1, texto grande 3:1 e componentes/foco 3:1; remover cor mantém a distinção de estado. |
| A11Y-07 | 320 px e zoom 200% | 1.4.4, 1.4.10, 1.4.12; reflow sem perda de função ou rolagem horizontal indevida | Há `break-words`/`overflow-wrap:anywhere` em valores e nomes (`global-dashboard.tsx:121-136`, `position-table.tsx:44-69`), mas grids, tabela e ledger ainda não foram exercitados em 320 px/200%. | alta | Executar os fixtures `A11Y-LONG` e `A11Y-PARTIAL` em 320 CSS px e zoom 200%; tratar overflow por bloco, não truncar valores essenciais. | Não há sobreposição, corte, scroll horizontal para ler uma célula ou ação inacessível; ordem de leitura e submit permanecem possíveis. |
| A11Y-08 | Densidade do consolidado | 1.3.1, 1.4.10; resumo, trabalho e diagnóstico devem ter hierarquia compreensível | `GlobalDashboardContent` renderiza cards, distribuição, posições, cobertura e ativos sem cotação (`global-dashboard.tsx:286-309`). A hipótese de mistura já foi registrada em `journeys-and-product-findings.md:64-69`. Avaliação de tarefa ainda pendente. | média | Separar resumo primário de diagnósticos e explicitar escopo; validar revelar progressivamente sem esconder lacunas críticas. | Em `A11Y-PARTIAL`, a pessoa localiza patrimônio conhecido, lacunas e próxima ação em até uma varredura, sem confundir cobertura com patrimônio. |
| A11Y-09 | Ordem visual e de teclado no ledger | 2.4.3, 1.3.2; ordem de foco deve acompanhar a tarefa | Em `transaction-ledger.tsx:335-391`, o formulário usa `order-1` no mobile e `order-2` no desktop, enquanto o histórico faz o inverso. Não há teste de ordem por teclado/leitor de tela. | alta | Definir ordem DOM orientada à tarefa e validar a relação entre “Registrar operação”, feedback e histórico em cada breakpoint. | Em 320 px e desktop, Tab percorre contexto → formulário/ação primária → feedback → histórico (ou ordem explicitamente justificada), sem saltos ou foco fora da tela. |
| A11Y-10 | Atualização e escopo | 2.4.6, 3.3.2; ação deve dizer o que será atualizado | `DashboardRefreshButton` mostra apenas “Atualizar dados” em `dashboard-refresh-button.tsx:29-42`, embora seja usado no consolidado e no detalhe. O estado é anunciado por telas diferentes. | média | Nomear o escopo (“Atualizar patrimônio das carteiras” ou “Atualizar dados desta carteira”) e informar último horário/frescor quando houver snapshot. | O nome do botão, status e resultado permitem prever qual leitura mudou; em erro, o retry não parece atualizar outro escopo. |
| A11Y-11 | Linguagem de operação | 3.2.4, 3.3.2; mesma ação deve ter identificação consistente | IA aprova “Registrar operação” (`information-architecture.md:40-43`), mas o código usa “Cadastrar posição” em `portfolio-detail.tsx:41-47,169-174`; ledger alterna “Novo lançamento”, “evento” e “lançamento” em `transaction-ledger.tsx:337-379`. | alta | Adotar “Registrar operação” para a ação e “Histórico de operações” para a lista; reservar “posição” para holding derivada. | A mesma tarefa tem um único nome em link, título, formulário, erro, confirmação e leitor de tela; “cadastrar posição” não aparece para criar Transaction. |
| A11Y-12 | Custo, patrimônio e performance | 3.3.2; rótulo e instrução não podem induzir uma interpretação falsa | O código já explica “Custo de aquisição remanescente” e exclui aporte/performance em `global-dashboard.tsx:294-303` e `portfolio-detail.tsx:123-133`, mas o título ainda é “Valor investido”. Não existe série histórica no fluxo auditado. | alta | Usar “Custo de aquisição remanescente” como termo principal ou manter “Valor investido” somente com essa explicação; não usar lucro, retorno, rentabilidade ou performance sem fonte. | Em `A11Y-NO-PERFORMANCE`, a pessoa consegue dizer qual é custo, qual é patrimônio conhecido e que não existe performance histórica; “aporte” não aparece como sinônimo de custo. |
| A11Y-13 | Patrimônio conhecido e cobertura | 1.3.1, 3.3.2; escopos e unidades devem ser explícitos | `KnownAmountCard` informa “Patrimônio conhecido — leitura parcial” e lacunas (`known-amount-card.tsx:25-47`). `QuoteCoverageCard` afirma que cobertura conta ativos consultados e não percentual patrimonial (`quote-coverage-card.tsx:10-34`). Baseline sem validação de compreensão. | média | Preservar a explicação junto ao número e diferenciar quantidade de cotações de valor/percentual; não esconder a nota em diagnóstico. | Em `A11Y-PARTIAL`, nenhum leitor interpreta “cobertura” como percentual de patrimônio; itens sem cotação permanecem fora do valor conhecido e explicitamente listados. |
| A11Y-14 | Empty state e 404 | 2.4.4, 3.2.4; recuperação deve oferecer a próxima tarefa no contexto | Dashboard vazio oferece apenas “Ver carteiras” (`global-dashboard.tsx:268-281`); 404 aplicado retorna `/dashboard` (`not-found.tsx:7-27`), enquanto a decisão conceitual prefere Carteiras (`information-architecture.md:224-235`). | média | Fazer o vazio apontar para criar/localizar carteira e alinhar retorno do 404 aplicado à entrada Carteiras, mantendo decisão sujeita a protótipo. | Conta vazia e rota inexistente oferecem uma próxima ação única, contextual e nomeada; o retorno não cria um desvio para dashboard vazio. |
| A11Y-15 | Números, nomes e anúncio de precisão | 1.4.10, 1.3.1; informação financeira não pode ser truncada ou ambígua | `financial-value` usa `tabular-nums` (`globals.css:213-215`), formatos preservam strings decimais e testes cobrem valores longos (`tests/financial-presentation.test.mjs:16-20`). A leitura visual/assistiva de `A11Y-LONG` ainda não foi observada. | média | Validar quebra, moeda, separadores e anúncio; não reduzir decimal canônico nem substituir indisponível por `—` sem texto contextual. | O valor completo permanece legível em 320 px/200%; leitor anuncia moeda e estado; números longos não causam sobreposição nem são arredondados indevidamente. |

## 3. Vocabulário financeiro aprovado

Os termos abaixo são o vocabulário de referência para protótipos e slices. A
aprovação aqui é semântica para a descoberta; cópia final pode receber revisão
editorial sem alterar os significados.

| Conceito | Usar | Definição observável | Evitar ou marcar como ambíguo |
| --- | --- | --- | --- |
| Fato de compra/venda | **Operação**; ação **Registrar operação** | Evento append-only informado pelo usuário; não é a posição derivada. | “Cadastrar posição”, quando cria uma Transaction; “evento” sem contexto. |
| Holding derivada | **Posição aberta** | Resultado composto do ledger para um ativo ainda aberto em uma carteira. | Usar “posição” como sinônimo de lançamento. |
| Custo | **Custo de aquisição remanescente** | Custo associado às posições abertas depois da composição; não é depósito, aporte ou retorno. | “Valor investido” sem explicação; “aporte”; “saldo”. |
| Valor atual incompleto | **Patrimônio conhecido** / **Patrimônio conhecido — leitura parcial** | Soma somente dos valores correntes conhecidos, com escopo e lacunas explícitos. | “Patrimônio total” quando há indisponibilidade; completar lacuna com zero. |
| Preço externo | **Cotação** | Preço fornecido por fonte externa para um ativo em momento identificável. | Chamar cobertura de cotação de cobertura patrimonial. |
| Cobertura | **Cobertura das cotações** | Contagem/status das cotações solicitadas, atualizadas, stale e indisponíveis. | “Percentual do patrimônio”, “valor coberto” ou qualquer percentual implícito. |
| Dados fora da janela | **Cotação desatualizada** / **dados desatualizados (stale)** | Snapshot utilizável, mas fora da janela de frescor ou mantido após falha de atualização. | “Atual” ou “performance” sem qualificar o horário. |
| Ausência de leitura | **Indisponível (unavailable)** | Valor/recurso não disponível nesta leitura; não informa que a rede está offline. | Zero, vazio ou “sem patrimônio”. |
| Lacuna conhecida | **Leitura parcial (partial)** | Parte dos dados é conhecida e parte tem causa/escopo explicitados. | “Completo” ou estimativa silenciosa. |
| Histórico de retorno | **Sem performance histórica** | Não há série temporal e não se calcula rentabilidade, ganho ou retorno nesta slice. | “Performance”, “rentabilidade”, “rendimento” ou “ganho” sem fonte temporal. |
| Dinheiro adicionado | **Aporte** | Conceito de entrada de recursos; não é representado pelo custo de aquisição remanescente nesta tela. | Usar aporte como tradução de compra ou valor investido. |
| Resultado não confirmado | **Resultado desconhecido** | Comando pode ter sido enviado, mas o cliente não confirmou sua aceitação. | “Falhou” ou “salvo” sem reconciliação; retry cego. |

### 3.1 Copy de estados

Copy aprovada para os protótipos, alinhada à taxonomia de
`state-and-session-recovery.md:230-243`:

| Estado | Copy principal | Ação e restrição |
| --- | --- | --- |
| `partial` | “Patrimônio conhecido; alguns dados ainda não estão disponíveis.” | “Ver detalhes”/retry no escopo; manter valores conhecidos. |
| `stale` | “Última atualização em [horário]. Esses dados podem estar desatualizados.” | “Atualizar”; não chamar de atual ou performance. |
| `unavailable` | “Não foi possível obter este valor agora. Ele não foi considerado zero.” | Retry nomeado; não mostrar zero. |
| Sem performance | “Não há performance histórica disponível nesta visão.” | Não oferecer gráfico ou percentual de retorno como se existisse. |
| Resultado desconhecido | “O resultado não foi confirmado. Verifique o histórico antes de tentar de novo.” | Verificar histórico; não repetir automaticamente. |

## 4. Roteiro de validação manual e critérios por slice

O roteiro abaixo deve ser executado quando os protótipos das slices estiverem
disponíveis. Cada passagem deve registrar tecnologia assistiva, navegador,
viewport/zoom, fixture, foco inicial/final, anúncio e falha; nenhum item pode ser
marcado como aprovado somente por inspeção estática.

| Passagem | Procedimento | Evidência exigida | Slices consumidoras |
| --- | --- | --- | --- |
| Teclado e foco | Percorrer skip link, shell, Carteiras, detalhe, operação, retry, erro, 404 e logout com Tab/Shift+Tab/Enter/Esc | Ordem, foco após rota/erro/ação, item ativo, ausência de foco invisível | Portfolio, Transaction, shell |
| Leitor de tela | Repetir `A11Y-PARTIAL`, `A11Y-STALE` e `A11Y-NO-PERFORMANCE`; verificar headings, tabela, status e `<details>` | Transcript curto dos anúncios e confirmação de ausência de duplicidade/estado só por cor | Todas; especialmente Quotes e posições |
| Contraste/estado | Medir texto normal/grande, foco, bordas e estados nos temas claro/escuro; remover cor da inspeção | Razões de contraste e captura/registro dos pares token-fundo | Design system, Portfolio, Quotes |
| 320 px | Abrir vazio, detalhe, tabela, ledger e erro com `A11Y-LONG` | Sem overflow/corte; sequência visual/DOM e todas as ações acessíveis | Portfolio e Transaction |
| Zoom 200% | Repetir as telas críticas com zoom de 200% e janela equivalente | Reflow, foco e leitura de valores longos sem perda de função | Todas as slices |
| Microcopy | Pedir para classificar custo, patrimônio conhecido, cobertura, stale, unavailable e performance | Respostas esperadas e termos que geraram dúvida; revisar cópia sem mudar semântica | Quotes, valuation e dashboard |

### Critérios mínimos para o handoff

- **017 Portfolio:** vazio, arquivada/read-only, patrimônio conhecido, custo e
  foco de retorno devem passar em teclado, 320 px e 200%.
- **018 Transaction:** ação “Registrar operação”, ordem do formulário, erro,
  conflito e resultado desconhecido não podem usar “posição” nem retry cego.
- **019 Quotes/valuation/dashboard:** cobertura de cotação, patrimônio conhecido,
  partial/stale/unavailable e ausência de performance devem ser distinguíveis
  por texto e anúncio, sem cor isolada ou zero silencioso.
- **013:** transformar foco, headings, live regions, semântica de tabela e
  reflow em testes de componente/E2E; esta matriz não instala runner nesta fase.

## 5. Riscos residuais e decisões abertas

- Não houve execução com navegador, leitor de tela, medidor de contraste ou
  viewport real neste checkout; os achados de implementação são inspeção estática
  e devem permanecer sinalizados como pendentes até o protótipo.
- Não existe pesquisa com usuários reais. A preferência pelo vocabulário é uma
  decisão de descoberta, não evidência de compreensão universal.
- A correção de `aria-current`, foco, logout, 404 e copy deve ocorrer nas slices
  ou fundação correspondentes, não nesta subtarefa documental.
- A validação final deve incluir nomes e números de tamanho representativo sem
  inserir dados reais, segredos, tokens ou writes patrimoniais.

## Referências

- [`Spec 012`](../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-03 — IA, navegação e shell`](../../tasks/012-product-ux-ui-ia-api-discovery/012-03-definir-ia-navegacao-e-shell.md)
- [`012-04 — estados, sessão e recovery`](../../tasks/012-product-ux-ui-ia-api-discovery/012-04-definir-estados-sessao-e-recovery.md)
- [`Mapa de jornadas`](journeys-and-product-findings.md)
- [`globals.css`](../../../src/app/globals.css)
- [`financial-copy.ts`](../../../src/components/financial/financial-copy.ts)
- [`KnownAmountCard`](../../../src/components/financial/known-amount-card.tsx)
- [`QuoteCoverageCard`](../../../src/components/financial/quote-coverage-card.tsx)
- [`PositionTable`](../../../src/components/financial/position-table.tsx)
