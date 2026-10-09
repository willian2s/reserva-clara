# 012 — Pacote de decisão e freeze semântico de Portfolio

- **Ticker:** `012`
- **Subtarefa:** `012-07`
- **Estado da decisão:** freeze semântico preparado; URLs, DTOs, OpenAPI e implementação permanecem provisórios
- **Dados:** somente fixtures sintéticas; nenhum dado patrimonial real ou write
- **Owner de revisão:** Produto/UX, com revisão técnica de 017 e acessibilidade de 013

## 1. Escopo e decisão

Este pacote transforma a decisão de Carteiras como workspace em um protótipo de
baixa fidelidade responsivo, walkthrough e matriz de estados para a primeira
slice. A decisão congela intenção, semântica, ações seguras, copy, estados,
acessibilidade e dependências; não congela a forma física do contrato HTTP.

### Decisões congeladas para a slice

1. **Carteiras** é a entrada autenticada padrão e a lista é o workspace. A lista
   distingue `Ativas` e `Arquivadas`; uma conta vazia oferece **Criar carteira**
   na própria superfície.
2. Uma carteira ativa abre um detalhe com leitura do resumo, **Registrar
   operação**, histórico e configurações. A posição é derivada; não é criada
   diretamente pela tela de Portfolio.
3. Arquivar preserva histórico e não é excluir. Carteira arquivada continua
   encontrável e legível, mas o detalhe é **somente leitura**: não oferece
   operação, rename ou outro write patrimonial. A exceção de lifecycle é
   **Restaurar carteira**, que devolve a carteira ao estado ativo.
4. Recurso inexistente e recurso não acessível têm a mesma recuperação sanitizada.
   Deep link preserva apenas a intenção interna allowlisted; após sessão, o foco
   chega ao título do contexto uma única vez.
5. Conflito, erro de transporte e resultado desconhecido nunca repetem
   cegamente um comando. A ação de recuperação é atualizar, verificar a lista ou
   revisar o detalhe antes de tentar de novo.
6. A alternativa escolhida para o protótipo é a lista com grupos persistentes
   de ativas e arquivadas (Alternativa A). A alternativa B, um filtro com grupos,
   permanece válida para teste de volume, mas não pode esconder arquivadas nem
   converter ausência de ativas em lista vazia sem explicação.

O comportamento legado permite renomear uma carteira arquivada. Isso não foi
promovido ao freeze: o protótipo trata o estado arquivado como somente leitura e
encaminha a decisão de enforcement para 017, evitando que “legível” seja
interpretado como “mutável”.

## 2. Protótipo responsivo

O artefato executável independente de Next está em
[`portfolio-prototype.html`](portfolio-prototype.html). Ele simula localmente as
duas alternativas de listagem, detalhe ativo/arquivado, vazio, erro, conflito,
resultado desconhecido, restore, retorno à lista e foco de títulos. Não usa
tokens, sessão, API ou dados reais.

### 2.1 Alternativas de listagem

| Alternativa | Estrutura | Benefício | Risco | Decisão |
| --- | --- | --- | --- | --- |
| **A — grupos persistentes** | Título `Carteiras`; seção `Ativas`; seção `Arquivadas`; cada card informa estado e próxima ação | Torna lifecycle e diferença entre vazio e “somente arquivadas” visíveis em uma varredura | Cresce verticalmente com muitas carteiras | **Escolhida para a primeira slice** |
| B — filtro com grupos | Select `Ativas e arquivadas`/`Somente ativas`/`Somente arquivadas`; resultado ainda agrupado | Pode reduzir densidade quando houver volume | Filtro pode esconder uma carteira arquivada e criar falso vazio | Validar somente após volume sintético e tarefa medida |

Em ambas, o card ativo abre o detalhe; o card arquivado abre o detalhe em
somente leitura e oferece restaurar. A ação de archive não aparece como delete.
Não há busca, paginação ou filtro de domínio congelado nesta slice.

### 2.2 Alternativas de detalhe

| Estado | Cabeçalho e status | Ações permitidas | Ações ausentes/explicação |
| --- | --- | --- | --- |
| Ativa | `Carteira Clara` + `Carteira ativa` | `Registrar operação`, `Histórico de operações`, `Configurações` | Archive fica em configurações e exige confirmação explícita |
| Arquivada | nome + `Carteira arquivada · somente leitura` | Ler resumo, histórico, configurações de leitura, `Restaurar carteira` | Não mostrar `Registrar operação`; rename só após restore |
| Vazia | nome + ausência de posições | Criar/registrar a próxima tarefa conforme o contexto | Não mostrar patrimônio como zero se a leitura ainda estiver indisponível |
| Indisponível | título do contexto + diagnóstico sanitizado | `Tentar novamente`, voltar à lista | Não revelar se o ID pertence a outro owner |

Em telas estreitas, o contexto, status e ação primária permanecem antes das
ações secundárias. Cards passam a uma coluna; ações podem ocupar a largura
disponível; nomes longos quebram sem truncar. Em desktop, listagem e detalhe
usam uma coluna de conteúdo legível, sem exigir comparação lado a lado.

### 2.3 Fixtures e walkthrough de produto

| Fixture | Lista | Detalhe e tarefa observável |
| --- | --- | --- |
| `F-EMPTY` | Nenhuma ativa nem arquivada | Identificar **Criar carteira** sem passar pela Visão geral |
| `F-CLARA` | Uma ativa | Abrir, ler contexto, localizar registrar operação e voltar à lista |
| `F-MULTI` | Duas ativas e uma arquivada | Comparar estados, abrir a arquivada e localizar restore sem confundir com delete |
| `F-CONFLICT` | Carteira ativa | Receber conflito, manter contexto e escolher atualizar/revisar |
| `F-ERROR` | Falha de leitura | Ver copy sanitizada, foco no resumo e retry nomeado |
| `F-UNKNOWN` | Comando sem confirmação | Verificar carteira/lista antes de tentar novamente |

Walkthrough documental:

1. Em `F-EMPTY`, navegar apenas por teclado até o título e **Criar carteira**;
   a ausência é apresentada como começo, não erro.
2. Em `F-CLARA`, abrir o detalhe por link/card, confirmar o título focado,
   localizar as três ações e voltar preservando o contexto da lista.
3. Em `F-MULTI`, abrir a arquivada, confirmar o aviso persistente, verificar que
   `Registrar operação` não existe como ação habilitada e restaurar explicitamente.
4. Em `F-CONFLICT`, manter a carteira e o contexto, anunciar “Atualize e revise”
   e não reenviar o comando.
5. Em `F-ERROR` e `F-UNKNOWN`, distinguir falha de leitura de resultado não
   confirmado e oferecer retry/verificação no escopo correto.
6. Repetir os cenários com deep link de ID opaco, 320 CSS px e zoom de 200%; o
   protótipo é evidência de hipótese, não declaração de conformidade WCAG.

## 3. Intenções, pré-condições e copy

| Intenção | Pré-condições | Resultado observável | Copy principal |
| --- | --- | --- | --- |
| Listar carteiras | Sessão válida; owner derivado do token | Ativas/arquivadas ou estado vazio | “Carteiras” / “Ainda não há carteiras. Este é um começo, não um erro.” |
| Abrir carteira | ID opaco e recurso legível pelo owner | Detalhe ativo ou arquivado | “Carteira ativa” / “Carteira arquivada · somente leitura” |
| Criar carteira | Nome válido; moeda-base disponível na capability | Nova carteira e abertura do detalhe somente após confirmação | “Criar carteira” |
| Renomear | Carteira ativa e nome diferente, válido e confirmado | Nome atualizado; sem alteração de fatos | “Renomear carteira” |
| Arquivar | Carteira ativa; confirmação explícita do nome atual | Histórico preservado; carteira sai do escopo ativo | “Arquivar carteira” e “Arquivar não exclui a carteira nem seu histórico.” |
| Restaurar | Carteira arquivada; confirmação explícita da ação | Carteira volta à lista ativa e pode receber próxima tarefa | “Restaurar carteira” |
| Recuperar erro | Leitura falha ou comando sem confirmação | Retry de leitura ou verificação antes de nova ação | “Não foi possível carregar suas carteiras. Tente novamente.” / “O resultado não foi confirmado. Verifique as carteiras antes de tentar de novo.” |

O protótipo usa `BRL` como fixture de moeda-base, coerente com o domínio atual,
mas não congela uma enumeração HTTP ou a política futura de moedas. Nomes têm a
validação do domínio atual (não vazios e até 100 caracteres); a mensagem final e
o formato de erro ficam para a capability.

## 4. Matriz de estados, erros e recovery

| Superfície | Estado | Semântica e preservação | Ação segura e foco |
| --- | --- | --- | --- |
| Lista | `loading` | Primeira leitura; não inventar carteiras nem zeros | Anunciar “Carregando carteiras…”; foco permanece na tarefa |
| Lista | `ready` | Grupos ativos/arquivados visíveis | Abrir, criar ou atualizar; título recebe foco após navegação |
| Lista | `empty` | Nenhuma carteira; não é erro | Focar título e oferecer `Criar carteira` |
| Lista | somente arquivadas | Não há ativas, mas há histórico legível | Explicar diferença e oferecer abrir/restaurar ou criar |
| Lista | `refreshing` | Manter snapshot enquanto atualiza | Anunciar escopo sem remover cards; não duplicar foco |
| Detalhe | `partial` | Patrimônio conhecido com lacunas identificadas; não completar com zero | “Patrimônio conhecido; alguns dados ainda não estão disponíveis.”; atualizar no escopo da carteira |
| Detalhe | `stale` | Snapshot utilizável, mas desatualizado ou mantido após falha de refresh | Informar última atualização e oferecer “Atualizar”; não chamar o dado de atual |
| Lista | `error`/`offline` | Falha de leitura; snapshot anterior permanece se existir | `Tentar novamente`; sem retry infinito; foco no resumo após submit |
| Detalhe | `ready` ativa | Leitura e ações de Portfolio disponíveis | Registrar operação, histórico e configurações |
| Detalhe | `archived/read-only` | Leitura permitida; novos fatos e metadata writes bloqueados | Restaurar; não exibir ação de operação |
| Detalhe | `unavailable` | Recurso inexistente ou não acessível indistinguível | Voltar para Carteiras ou retry limitado; não revelar owner |
| Comando | `validation` | Nome ou confirmação inválida; nada foi enviado | Resumo de erro + primeiro campo inválido |
| Comando | `conflict` | Estado mudou, versão divergiu ou carteira foi arquivada durante a ação | “Este dado mudou antes de concluir. Atualize e revise os campos.”; não reenviar |
| Comando | `resultado desconhecido` | Pode ter sido enviado, mas não confirmado | “O resultado não foi confirmado. Verifique as carteiras antes de tentar de novo.” |
| Sessão | `unauthorized` | Sessão não pode sustentar a leitura/comando | Um refresh de token conforme 012-04; depois login; não expor motivo técnico |

Para `401`, a capability pode fazer no máximo um refresh forçado e repetir apenas
a leitura idempotente ou comando com chave estável, uma vez. Timeout, desconexão
após dispatch, conflito e resposta ilegível não repetem archive/restore/rename/
create cegamente. A reconciliação preferida é reler a lista ou o detalhe; uma
capability específica de status permanece decisão de 014/017.

## 5. Capability provisória e dados conceituais

Os exemplos abaixo descrevem intenção e view model, não DTO, endpoint ou OpenAPI.
O owner é sempre derivado do token verificado; `ownerId`, UID e provider não entram
no input do cliente. IDs são opacos e estáveis.

| Capability | Input conceitual | Saída/view model | Dependências de leitura/comando |
| --- | --- | --- | --- |
| `portfolio.list` | filtro de lifecycle opcional (`active`, `archived`, `all`) | `{ items: [{ id, name, baseCurrency, archivedAt, updatedAt }], state, diagnostics }` | Sessão/Auth; owner; listagem separada por lifecycle |
| `portfolio.get` | `{ portfolioId }` | `{ portfolio, lifecycle, state, diagnostics }` | Sessão; owner; ID opaco; recurso não acessível indistinguível |
| `portfolio.create` | `{ name, baseCurrency }` + intenção de submissão | `{ portfolio }` ou resultado não confirmado | Validação; sessão; política de idempotência/reconciliação a definir |
| `portfolio.rename` | `{ portfolioId, name }` + precondição de estado | `{ portfolio }` ou `conflict` | `portfolio.get`; carteira ativa; versão/concorrência a definir |
| `portfolio.archive` | `{ portfolioId }` + confirmação explícita | lifecycle arquivado ou `conflict` | `portfolio.get`; carteira ativa; preservar histórico |
| `portfolio.restore` | `{ portfolioId }` + confirmação explícita | lifecycle ativo ou `conflict` | `portfolio.get`; carteira arquivada; permitir nova operação após confirmação |

`archivedAt: null` representa ativa e valor não nulo representa arquivada no
view model; a precisão e serialização de timestamp continuam sob 015/016. A
listagem do detalhe financeiro pode compor transações, posições e cotações, mas
essa composição não é requisito para confirmar o lifecycle de Portfolio.

### Erros sanitizados e retry

| Classe conceitual | Copy de UI | Retry/reconciliação |
| --- | --- | --- |
| validação | “Informe um nome de carteira.” / “Confirme digitando o nome atual.” | Corrigir campo; nenhum request |
| não encontrado/não acessível | “Não foi possível localizar esta carteira.” | Voltar à lista; não distinguir owner |
| conflito | “Este dado mudou antes de concluir. Atualize e revise os campos.” | Relê; usuário confirma nova ação |
| sessão | “Sua sessão expirou. Entre novamente para continuar.” | Um recovery; depois autenticação explícita |
| rede/indisponibilidade | “Não foi possível carregar suas carteiras agora.” | Retry manual nomeado, preservando snapshot |
| resultado desconhecido | “O resultado não foi confirmado. Verifique as carteiras antes de tentar de novo.” | List/get; nunca afirmar sucesso ou repetir cegamente |

## 6. Acessibilidade, mobile e critérios de freeze

| Critério | Decisão/critério observável |
| --- | --- |
| Teclado | Ordem: skip link → shell → título/contexto → status → ação primária → ações secundárias → lista. Todo card tem nome e ação em foco; nenhum controle depende de hover. |
| Foco | Após deep link, abrir detalhe, retry ou erro, focar título/região ou resumo correspondente. Após diálogo de archive/restore, devolver foco ao controle originador ou à confirmação. |
| Leitor de tela | `h1`/`h2` descrevem a tarefa; `aria-current` marca Carteiras; status anuncia lifecycle e escopo; “arquivada”, “somente leitura” e “não é excluir” são texto, não apenas cor. |
| Confirmação | Archive exige confirmação explícita e nome atual; restore é uma ação de lifecycle nomeada. Nenhuma ação é rotulada como delete. |
| 320 px/200% | Cards em uma coluna, nomes quebram, ações continuam alcançáveis e valores não são cortados. Não exigir rolagem horizontal para descobrir status ou ação. |
| Contraste/estado | Usar tokens/semântica da 012-06 com texto e rótulo junto de cor; medir foco, borda e estados em claro/escuro em 013/017. |
| Financeiro | “Patrimônio conhecido” e “Custo de aquisição remanescente” permanecem distintos; não prometer performance histórica nem transformar indisponível em zero. |

### Gate de freeze semântico

O pacote está pronto para revisão quando 017 consegue implementar, sem nova
decisão de produto, os fluxos: lista ativa/arquivada, vazio, criação, abrir,
rename, archive com confirmação, restore, deep link, erro, conflito e detalhe
somente leitura. O gate não autoriza congelar URL, DTO, schema, paginação,
OpenAPI, versão de concorrência ou biblioteca de router.

## 7. Handoff, questões e riscos residuais

### Handoff

- **013:** transformar status/empty/error, foco, confirmação e lista responsiva em
  primitives testáveis; validar 320 px, zoom, leitor de tela e retorno de foco.
- **014:** implementar o limite de recovery de sessão, host/auth separado de
  autorização e erro sanitizado.
- **015/016:** preservar IDs opacos, timestamps, owner derivado e compatibilidade;
  desenhar versionamento/idempotência sem copiar este view model como DTO final.
- **017:** implementar a slice e decidir enforcement de read-only, restauração
  direta no card versus configurações e concorrência de lifecycle com evidência.
- **018:** consumir o estado arquivado e a ausência de `Registrar operação` sem
  permitir novo fato em carteira arquivada.
- **019:** manter o detalhe sem confundir patrimônio conhecido, custo, cotação e
  performance histórica.

### Questões abertas para 017

1. Restore deve permanecer no detalhe/configurações ou também ser ação direta do
   card arquivado após teste de descoberta?
2. A confirmação por nome é necessária para restore ou somente para archive?
3. A versão de concorrência será explícita no comando ou resolvida por outra
   política de capability? Não escolher com base no protótipo.
4. Qual volume sintético justifica a Alternativa B, busca ou paginação?
5. Criação, archive e restore terão chave de idempotência ou apenas consulta de
   reconciliação após resultado desconhecido?

Riscos residuais: não houve pesquisa com usuários reais nem execução de navegador
com leitor de tela/medidor de contraste neste pacote; não há testes React/E2E;
as regras de read-only, concorrência e reconciliação ainda precisam de enforcement
na slice 017. O protótipo não representa dados reais, não chama API e não prova
conformidade WCAG.

## Referências

- [`Spec 012`](../../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-03 — IA e navegação`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-03-definir-ia-navegacao-e-shell.md)
- [`012-04 — estados e recovery`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-04-definir-estados-sessao-e-recovery.md)
- [`012-05 — acessibilidade e linguagem`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [`012-06 — design system`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-06-revisar-design-system-e-componentes.md)
- [`Arquitetura da informação`](../information-architecture.md)
- [`Estados, sessão e recovery`](../state-and-session-recovery.md)
- [`Mapa de jornadas`](../journeys-and-product-findings.md)
- [`Matriz de acessibilidade`](../accessibility-and-language-matrix.md)
- [`Domínio Portfolio`](../../../../src/domain/portfolio.ts)
- [`Componentes legados de Portfolio`](../../../../src/components/portfolio/)
