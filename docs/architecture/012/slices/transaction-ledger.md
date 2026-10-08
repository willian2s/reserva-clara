# 012 — Pacote de decisão e freeze semântico de Transaction e ledger

- **Ticker:** `012`
- **Subtarefa:** `012-09`
- **Estado da decisão:** freeze semântico preparado; boundary confiável, URLs,
  DTOs, OpenAPI e implementação permanecem provisórios
- **Dados:** somente fixtures sintéticas; nenhum dado patrimonial real ou write
- **Owner de revisão:** Produto/UX, com revisão técnica de 015/016/018 e
  acessibilidade de 013

## 1. Escopo e decisão

Este pacote executa UX-07 e UX-08 para **Registrar operação** e **Histórico de
operações**. A tela comunica fatos do ledger sem transformar posição, saldo ou
qualquer projeção em fonte de verdade. O protótipo standalone em
[`transaction-ledger-prototype.html`](transaction-ledger-prototype.html) simula
os fluxos com fixtures descartáveis e não chama API, Firestore ou persistência
real.

### Decisões congeladas para a descoberta

1. A V1 aceita somente `Compra` e `Venda`. A ação primária é **Registrar
   operação**; “lançamento” fica como termo legado que não deve aparecer como
   nome principal da jornada. O histórico usa **Histórico de operações**.
2. A ordem do formulário é: ativo, operação, quantidade, preço unitário, moeda,
   data da operação, taxa opcional e moeda da taxa. A taxa é um valor fixo
   informado pelo usuário, não uma porcentagem implícita. Campo vazio e valor
   zero significam ausência de taxa; nenhum arredondamento ou conversão é
   inventado pela UI.
3. Quantidade e preço são decimais positivos em texto canônico, sem expoente,
   com até 30 dígitos inteiros e 18 fracionários. Taxa é decimal não negativo
   com os mesmos limites. Zeros finais podem ser normalizados pelo domínio, mas
   a intenção comparada na reconciliação é a forma canônica; `number`, `float`,
   `double` e `Date` não são fontes financeiras.
4. A data da operação é uma **data civil** `YYYY-MM-DD`, apresentada como
   `dd/mm/aaaa`. A validação rejeita datas inexistentes, inclusive dias que não
   existem no mês, sem aplicar timezone. `createdAt` é metadado do fato e
   preserva segundos e nanos; não substitui a data civil.
5. A autoridade para aceitar `Venda` é o caso de uso transacional futuro. Ele
   valida o ledger inteiro do Asset e serializa a decisão no boundary confiável.
   A UI pode mostrar saldo conhecido apenas quando a leitura estiver completa;
   nunca autoriza uma venda usando contador local, cache parcial ou `assetUsages`.
   Venda insuficiente não cria fato e devolve foco ao campo Quantidade.
6. Carteira arquivada mantém o histórico legível, mas não oferece o formulário
   nem aceita nova operação. A mensagem é **“Esta carteira está arquivada e não
   aceita novas operações. O histórico continua disponível.”** Restaurar a
   carteira é uma ação de Portfolio, não um retry de Transaction.
7. Transaction é append-only. Não há editar ou excluir no histórico. Correção
   futura será outro fato compensatório, com capability explícita de 018; a UI
   não promete estorno automático nem altera `assetId`.
8. Cada submissão cria uma chave estável antes do primeiro dispatch. O mesmo ID
   com payload canônico igual é idempotente/no-op; o mesmo ID com payload
   divergente é conflito e nunca sobrescreve o fato. `createdAt` não participa da
   igualdade do payload.
9. Não há optimistic write nem escrita offline. Depois do dispatch, timeout,
   desconexão ou resposta ilegível é **resultado desconhecido**: a UI preserva
   os dados, oferece **Verificar histórico** pelo ID e não repete cegamente.
   Somente depois de uma reconciliação negativa o usuário pode revisar a
   operação e iniciar uma nova tentativa com decisão consciente.
10. O histórico começa sem filtros ocultos e preserva a ordenação determinística
    `effectiveDate ASC`, `createdAt.seconds ASC`, `createdAt.nanoseconds ASC` e
    `transactionId ASC`. Filtros de ativo, tipo e intervalo de data são
    auxiliares e devem informar quando estão ativos; paginação física é
    provisória e só é necessária quando o volume justificar.

## 2. Jornada e fixtures

### 2.1 Jornada principal

1. A pessoa entra em uma carteira ativa e encontra o contexto, o estado da
   carteira e o histórico antes do formulário.
2. Seleciona um Asset disponível, escolhe Compra ou Venda e informa os valores
   com a unidade explicitada. O resumo não calcula patrimônio, performance ou
   total de aporte.
3. Ao submeter, o formulário fica bloqueado enquanto o comando está em trânsito;
   nenhum card provisório é inserido no histórico.
4. Em confirmação, o fato aparece no histórico ordenado e o foco vai para a
   confirmação **“Operação confirmada no histórico.”**
5. Em validação ou recusa de domínio, o diagnóstico aparece antes da ação e o
   primeiro campo relevante recebe foco. Em conflito ou resultado desconhecido,
   os valores permanecem preservados até a reconciliação.

### 2.2 Fixtures sintéticas

| Fixture | Estado inicial | Tarefa observável |
| --- | --- | --- |
| `F-BUY` | Carteira ativa e Asset selecionado | Registrar compra sem taxa e localizar o novo fato após confirmação |
| `F-SELL` | Ledger com quantidade suficiente | Registrar venda com taxa fixa e conferir quantidade, moeda e data |
| `F-EXTREME` | Formulário vazio | Aceitar decimal no limite de 30/18, rejeitar expoente e preservar texto |
| `F-INVALID-DATE` | Formulário com `31/02/2026` | Receber erro de data civil e voltar ao campo sem enviar |
| `F-INSUFFICIENT` | Ledger com `2,5` unidades | Tentar vender `3`; nada é anexado e Quantidade recebe foco |
| `F-ARCHIVED` | Histórico legível em carteira arquivada | Ler o histórico e entender que novas operações estão bloqueadas |
| `F-CONFLICT` | ID da operação já existe com payload divergente | Ver conflito, manter dados e não sobrescrever o fato existente |
| `F-UNKNOWN` | Dispatch sem resposta confirmável | Verificar histórico pelo mesmo ID antes de qualquer nova submissão |
| `F-SMALL` | 12 fatos | Ler a lista sem paginação; filtros continuam opcionais |
| `F-MEDIUM` | 120 fatos | Aplicar tipo/Asset/data e carregar a próxima janela de forma explícita |
| `F-LARGE` | 1.200 fatos | Usar cursor e filtros no servidor conceitual; não renderizar tudo de uma vez |

Walkthrough documental:

1. Em `F-BUY` e `F-SELL`, navegar só com teclado por todos os campos, confirmar
   a mensagem e localizar a operação no histórico sem aparecer uma linha
   otimista durante o envio.
2. Em `F-EXTREME` e `F-INVALID-DATE`, testar `0,000000000000000001`, um decimal
   com 31 dígitos inteiros, expoente e `31/02/2026`; erros apontam para o campo e
   não limpam os demais valores.
3. Em `F-INSUFFICIENT`, submeter uma venda maior que a quantidade conhecida. A
   resposta explica **“Esta venda excede a quantidade disponível no histórico.”**;
   nenhum fato é criado e nenhuma posição é apresentada como corrigida.
4. Em `F-ARCHIVED`, confirmar que o histórico permanece legível e que não existe
   ação habilitada para registrar operação.
5. Em `F-CONFLICT`, manter o formulário e informar **“Esta operação conflita
   com um fato existente. Atualize o histórico e revise os dados antes de tentar
   novamente.”**. Em `F-UNKNOWN`, usar **Verificar histórico**, nunca o botão
   “Tentar novamente” como replay automático.
6. Em `F-SMALL`, `F-MEDIUM` e `F-LARGE`, medir descoberta do primeiro fato,
   compreensão dos filtros e custo de carregar mais. A decisão inicial é sem
   paginação física para pequeno, cursor para grande e filtros server-side
   quando o conjunto crescer; os limiares não são contrato final.

O protótipo é evidência de hipótese. Não declara validação real de navegador,
leitor de tela, contraste, 320 px, zoom de 200% ou concorrência.

## 3. Precisão, semântica e copy

| Campo | Regra de produto | Erro canônico e foco |
| --- | --- | --- |
| Ativo | ID opaco; somente Assets ativos e selecionáveis | “Selecione um ativo válido.” → Ativo |
| Operação | `buy`/`sell`; exibir Compra/Venda | “Selecione compra ou venda.” → Operação |
| Quantidade | positiva, decimal textual, sem expoente | “Informe uma quantidade positiva em formato decimal, sem expoente.” → Quantidade |
| Preço unitário | positivo, decimal textual e moeda explícita | “Informe um preço positivo em formato decimal, sem expoente.” → Preço unitário |
| Moeda | código ISO 4217 em maiúsculas | “Informe um código de moeda com três letras, como BRL ou USD.” → Moeda |
| Data da operação | data civil real; `dd/mm/aaaa` | “Informe uma data civil real.” → Data da operação |
| Taxa | fixa, opcional, não negativa; zero vira ausência | “Informe uma taxa fixa não negativa ou deixe o campo vazio.” → Taxa |
| Moeda da taxa | sempre visível quando taxa for informada | “Informe a moeda da taxa.” → Moeda da taxa |

O resumo deve dizer **Taxa: sem taxa** ou mostrar valor e moeda, nunca apenas
“custos”. Se a moeda da taxa for incompatível com a regra da capability, o erro
deve ser explícito; não converter para BRL nem arredondar silenciosamente. A UI
não soma preço × quantidade para produzir saldo, custo ou patrimônio durante o
registro.

## 4. Matriz de estados, erros e recovery

| Superfície | Estado | Semântica e ação segura |
| --- | --- | --- |
| Formulário | `loading/disabled` | carregar carteira e Assets; não inventar seleção, saldo ou zero |
| Formulário | `ready` | aceitar intenção local e validar antes do dispatch |
| Formulário | `validation` | nada enviado; manter valores; diagnóstico e foco no primeiro campo |
| Formulário | `submitting` | bloquear campos e botão; não inserir card otimista nem permitir duplo dispatch |
| Formulário | `confirmed` | anexar somente o fato devolvido; limpar campos de entrada e focar status |
| Formulário | `insufficient` | comando rejeitado; não anexar; focar Quantidade e manter demais valores |
| Formulário | `archived` | histórico continua legível; ocultar/bloquear Registrar operação |
| Formulário | `conflict` | payload/estado divergiu; preservar dados; reler e revisar, sem replay |
| Formulário | `resultado desconhecido` | pode ter sido enviado; verificar pelo ID; não afirmar sucesso nem repetir |
| Histórico | `loading` | primeira leitura sem linhas inventadas |
| Histórico | `ready` | fatos confirmados em ordem determinística; sem editar/excluir |
| Histórico | `empty` | “Ainda não há operações nesta carteira.”; não é saldo zero |
| Histórico | `refreshing/stale` | preservar snapshot e marcar atualização; não remover fatos nem chamar atual |
| Histórico | `partial` | mostrar escopo/lacuna; não afirmar saldo completo |
| Histórico | `unavailable/offline` | diagnóstico sanitizado e retry de leitura; nunca transformar ausência em zero |
| Sessão | `unauthorized` | um refresh conforme 012-04; depois login; não repetir write sem chave |

Para `401`, uma capability pode fazer no máximo um refresh forçado e repetir uma
vez somente leitura idempotente ou comando com chave estável. Timeout depois do
dispatch, conflito, `503` e resposta ilegível exigem reconciliação. O retry da
leitura do histórico é diferente do retry do comando de escrita.

## 5. Idempotência, append-only e SELL

O view model conceitual do comando contém `transactionId` estável e o payload
canônico da intenção, mas não expõe `ownerId`, UID, provider ou detalhes de
persistência ao browser. A reconciliação compara:

```text
kind + assetId + quantity + unitPrice.currency + unitPrice.decimal
+ fee.currency + fee.decimal + effectiveDate
```

`createdAt` é excluído dessa comparação. As respostas conceituais são:

| Situação | Resultado | UI |
| --- | --- | --- |
| ID ausente, pré-condições válidas | fato append-only confirmado | mostrar no histórico |
| mesmo ID e payload igual | no-op idempotente, fato existente | mostrar “já confirmado” sem duplicar |
| mesmo ID e payload diferente | conflito | bloquear replay e revisar |
| carteira arquivada no boundary | rejeição | ocultar formulário após atualizar Portfolio |
| `SELL` deixaria quantidade negativa | rejeição de saldo | focar Quantidade, nenhum fato |
| dispatch sem confirmação | resultado desconhecido | consultar status/histórico pelo ID |

O boundary futuro deve ler Portfolio, Asset e ledger, validar ownership/lifecycle,
recalcular o reducer decimal e serializar concorrentes antes do append. A UI não
declara que o reducer legado ou Rules isoladas garantem saldo em concorrência.
Uma correção não atualiza nem exclui Transaction: cria fato compensatório com
auditoria quando a capability existir.

## 6. Query conceitual e volume

Os nomes abaixo são intenções e view models, não endpoints, DTOs ou OpenAPI:

| Capability | Input conceitual | Saída/view model | Regra |
| --- | --- | --- | --- |
| `transaction.list` | `{ portfolioId, assetId?, kind?, dateFrom?, dateTo?, cursor?, limit? }` | itens, `state`, `hasMore`, cursor opaco, diagnostics | filtros explícitos; owner vem do token |
| `transaction.get` | `{ portfolioId, transactionId }` | fato ou resultado indistinguível de inexistente | ID opaco; leitura autorizada |
| `transaction.create` | `{ transactionId, portfolioId, input }` | fato confirmado, conflito, rejeição ou desconhecido | append-only; chave estável |
| `transaction.reconcile` | `{ portfolioId, transactionId }` | `found`, `notFound`, `conflict` ou estado indisponível | não cria fato; reconcilia o dispatch |

O ordenamento lógico da lista é a tupla completa de data civil, segundos,
nanos e ID. Um cursor deve representar essa tupla, não apenas uma página ou
offset. Para o protótipo, `F-SMALL` demonstra lista inteira, `F-MEDIUM`
carregamento explícito de janela e `F-LARGE` cursor com filtros. A decisão de
limiar, tamanho de página, busca textual, snapshot de consulta e retenção fica
aberta para 016/018 depois da medição.

Não há filtro padrão por “posição aberta”, “saldo” ou cotação. Filtro de tipo,
Asset e data reduz a leitura, mas nunca muda o reducer de autoridade. O estado
de filtro deve ser anunciado e os resultados não podem parecer um ledger
completo quando são apenas uma janela.

## 7. Acessibilidade, responsividade e critérios de freeze

| Critério | Resultado esperado |
| --- | --- |
| Teclado | ordem título/status → formulário → histórico/filtros; a tarefa primária vem antes da consulta, e todos os campos e ações têm nome e foco visível |
| Foco | erro vai ao campo; saldo insuficiente vai a Quantidade; resultado desconhecido vai ao diagnóstico; confirmação vai ao status |
| Leitor de tela | `Compra`/`Venda`, quantidade, preço, moeda, taxa, data civil e estado da carteira são anunciados juntos |
| Status | conflito, desconhecido, arquivada, stale e partial usam texto, `role` e ação; cor não é o único significado |
| Append-only | cada fato não oferece editar/excluir; correção futura é explicitamente outro evento |
| 320 px/200% | formulário vira uma coluna, valores quebram sem corte e filtros não escondem o escopo |
| Financeiro | “saldo disponível” só aparece como conhecido e datado; indisponível/partial não vira zero; não prometer rentabilidade |

O pacote está pronto para revisão de 018 quando a implementação consegue
expressar, sem nova decisão de produto, compra, venda suficiente/insuficiente,
taxa, precisão extrema, data inválida, carteira arquivada, histórico vazio,
conflito, resultado desconhecido, reconciliação, append-only e necessidade de
query por volume. O gate não congela URL, DTO, schema, lock, paginação física,
rounding de taxa ou biblioteca de data layer.

## 8. Handoff, questões e riscos residuais

### Handoff

- **013:** transformar formulário, diagnósticos, status, foco e filtros em
  primitives testáveis em 320 px e zoom de 200%.
- **015:** preservar strings decimais, data civil, timestamp bruto, ordenação e
  fixtures/golden masters de precisão e igualdade de payload.
- **016:** definir capability HTTP, cursores, erros sanitizados, compatibilidade,
  contrato de taxa e boundary confiável para saldo/append.
- **018:** implementar idempotência, lock/serialização, archive versus insert,
  reducer de `SELL`, resultado desconhecido, reconciliação e append-only.
- **017:** integrar a jornada de Portfolio ativa/arquivada sem reabrir operação
  em carteira arquivada.
- **019:** consumir somente fatos confirmados e distinguir histórico de posição,
  patrimônio conhecido, cotação e performance.

### Questões deliberadamente abertas

1. A taxa aceita moeda diferente da moeda do preço ou exige mesma moeda? A
   capability deve resolver e explicitar a política antes do contrato final.
2. Qual limite de volume justifica cursor, busca e filtros adicionais? Medir com
   fixtures reais da vertical, sem congelar `limit` nesta fase.
3. O status de reconciliação será uma consulta dedicada ou composição de leitura?
   016/018 devem manter a semântica de ID estável em ambas as opções.
4. Qual formato de fato compensatório atende correção auditada? Não criar
   “estorno” como novo kind V1 por hábito.

Riscos residuais: não houve pesquisa com usuários reais, execução de navegador,
leitor de tela, medição de contraste, 320 px/zoom real ou teste concorrente.
O repository legado ainda executa leituras client-side e não é boundary confiável
contra SDK direto. A política final de rounding/currency da taxa, os limiares de
paginação e a autoridade de reconciliação permanecem encaminhados a 015/016/018.

## Referências

- [`Spec 012`](../../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-04 — estados e recovery`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-04-definir-estados-sessao-e-recovery.md)
- [`012-05 — acessibilidade e linguagem`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [`012-08 — lifecycle de Asset`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-08-decidir-lifecycle-de-asset.md)
- [`ADR 006 — Asset e ledger`](../../../decisions/006-assets-transactions-ledger.md)
- [`ADR 012 — precisão temporal`](../../../decisions/012-precisao-temporal-e-ordenacao.md)
- [`ADR 014 — concorrência e idempotência`](../../../decisions/014-concorrencia-idempotencia-e-append-only.md)
- [`ADR 016 — HTTP e compatibilidade`](../../../decisions/016-contrato-http-openapi-e-compatibilidade.md)
- [`TransactionForm`](../../../../src/components/transaction/transaction-form.tsx)
- [`TransactionLedger`](../../../../src/components/transaction/transaction-ledger.tsx)
- [`Domínio Transaction`](../../../../src/domain/transaction.ts)
- [`Reducer decimal`](../../../../src/domain/decimal-reducer.ts)
