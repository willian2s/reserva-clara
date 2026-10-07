# 012 — Pacote de decisão e freeze semântico de Asset

- **Ticker:** `012`
- **Subtarefa:** `012-08`
- **Estado da decisão:** freeze semântico preparado; enforcement, URLs, DTOs,
  OpenAPI e implementação permanecem provisórios
- **Dados:** somente fixtures sintéticas; nenhum dado patrimonial real ou write
- **Owner de revisão:** Produto/UX, com revisão técnica de 018 e acessibilidade
  de 013

## 1. Escopo e decisão

Este pacote executa o walkthrough de UX-06 sobre o catálogo de Asset e revisa a
ADR 021. Asset é uma identidade econômica owner-scoped compartilhável entre
carteiras; não é uma posição e não deve ser recriado para representar uma
alteração de cadastro.

### Decisões congeladas para a descoberta

1. **`assetId` é opaco e estável.** Criar, editar, retirar, reativar ou corrigir
   um Asset não troca seu ID. Nenhuma Transaction é reescrita e nenhuma operação
   histórica sofre cascade.
2. **A identidade usada é imutável na edição comum.** Depois que existir a
   primeira Transaction referenciando o Asset, símbolo, mercado, tipo e moeda
   ficam somente leitura no catálogo. A correção excepcional, se necessária, é
   um comando futuro, explícito e auditado, com motivo, identidade anterior e
   posterior e revisão de 018; ela não é mutação inline e não troca o ID.
3. **Antes do uso, a identidade pode ser editada ou excluída.** A edição exige
   validação de unicidade; a exclusão exige confirmação explícita e somente
   remove um cadastro sem Transactions. Em ambos os casos, conflito ou resultado
   desconhecido preserva o formulário e exige verificação antes de nova ação.
4. **A prevenção de duplicidade é por identidade, não por cópia.** A tupla
   `(symbol, market, assetType, currency)` é owner-scoped. Cadastrar a mesma
   tupla reconcilia com o Asset existente; não cria outro ID. “Duplicar” não é
   uma ação de produto. Um cadastro parecido só pode ser criado quando a
   identidade realmente for diferente.
5. **O produto usa “Retirar do catálogo”, não “Arquivar”, para Asset.** Há um
   único estado de lifecycle `retired`: o histórico continua legível, o Asset
   permanece no catálogo com o marcador **Retirado · histórico preservado** e
   ele não aparece como opção para uma nova Transaction. A ação reversível é
   **Reativar Asset**. Não existe hard delete de Asset referenciado.
6. **Retirada é owner-scoped e global às carteiras do owner.** A confirmação
   informa que novas operações deixarão de selecionar o Asset em todas as
   carteiras, sem sugerir que o histórico foi apagado. Para registrar uma nova
   operação depois disso, o usuário reativa explicitamente o Asset.
7. **Referência é fato do ledger, não `assetUsages`.** A interface pode exibir
   um resumo de uso fornecido pela capability, mas `assetUsages` legado é
   somente evidência de compatibilidade/auditoria. Delete, imutabilidade e
   autorização futura devem usar a autoridade transacional definida em 016/018.

“Retirado” não significa “inexistente”, “sem patrimônio” ou “excluído”. O
`assetId`, a identidade histórica e as Transactions continuam encontráveis no
contexto de leitura autorizado.

## 2. Protótipo responsivo e fixtures

O protótipo standalone está em
[`asset-lifecycle-prototype.html`](asset-lifecycle-prototype.html). Ele troca
fixtures sintéticas localmente, apresenta o estado de referência e simula
editar, duplicidade, retirar/reativar e excluir. Não chama API, Firestore ou
persistência real.

| Fixture | Estado inicial | Walkthrough observável |
| --- | --- | --- |
| `F-EMPTY` | catálogo vazio | entender que não há cadastro e localizar **Cadastrar ativo** |
| `F-UNUSED` | ativo, sem Transactions | editar identidade; confirmar exclusão permitida; verificar que não há fato a apagar |
| `F-DUPLICATE` | identidade já cadastrada | enviar a mesma tupla e receber o Asset existente, sem novo ID |
| `F-DUPLICATE-RETIRED` | identidade já cadastrada e retirada | receber o Asset existente e escolher reativá-lo; nunca criar um segundo ID |
| `F-USED` | ativo referenciado em duas carteiras | tentar editar e excluir; receber bloqueio legível; retirar e confirmar preservação do histórico |
| `F-RETIRED` | Asset usado e retirado | ler o histórico, distinguir retirada de exclusão e reativar explicitamente |
| `F-CONFLICT` | catálogo alterado durante a ação | manter os dados do formulário e atualizar/revisar antes de reenviar |
| `F-UNKNOWN` | dispatch sem confirmação | verificar catálogo/estado antes de repetir qualquer comando |

Walkthrough documental:

1. Em `F-UNUSED`, editar `BOVA11` para outra identidade válida, observar o
   mesmo `assetId` e excluir após confirmação. Nenhuma Transaction é criada ou
   removida.
2. Em `F-DUPLICATE`, cadastrar a tupla já existente. A mensagem informa
   “Este Asset já está cadastrado; usamos o cadastro existente” e oferece abrir
   o item, não “criar cópia”. Em `F-DUPLICATE-RETIRED`, a mensagem informa que
   o cadastro existente está retirado e oferece **Reativar Asset** antes de
   voltar a selecioná-lo.
3. Em `F-USED`, tentar editar a identidade e excluir. As duas ações são
   recusadas sem mutar o item. O motivo explica que há operações vinculadas e
   que o histórico foi preservado.
4. Ainda em `F-USED`, retirar o Asset. A confirmação nomeia o alcance global
   às carteiras do owner; depois, o catálogo o marca como retirado e o ledger
   continua legível.
5. Em `F-RETIRED`, reativar explicitamente e verificar que o Asset volta a ser
   selecionável, com o mesmo ID.
6. Em `F-CONFLICT` e `F-UNKNOWN`, não reenviar cegamente: atualizar o catálogo,
   verificar o estado e somente então apresentar uma nova ação.

O protótipo é evidência de hipótese. Não declara validação real de navegador,
leitor de tela, contraste, 320 px ou zoom de 200%.

## 3. Intenções, pré-condições e copy

| Intenção | Pré-condições | Resultado observável | Copy principal |
| --- | --- | --- | --- |
| Listar catálogo | sessão válida; owner derivado do token | ativos e retirados distinguíveis; vazio explicado | “Ativos” / “Ainda não há ativos cadastrados.” |
| Cadastrar | identidade válida; owner autenticado | novo `assetId` ou reconciliação com item existente | “Cadastrar ativo” / “Este Asset já está cadastrado; usamos o cadastro existente.” |
| Editar identidade | Asset sem Transaction; tupla válida e não conflitante | mesmos ID e histórico do cadastro; nova tupla | “Editar identidade do ativo” |
| Editar Asset usado | existir referência no ledger | nada é alterado; campos ficam somente leitura | “Este Asset tem operações vinculadas. A identidade econômica não pode ser editada aqui.” |
| Retirar | confirmação explícita; Asset ativo | `retired`; histórico permanece legível; novas Transactions não selecionam o Asset | “Retirar do catálogo” / “Isso não exclui o histórico.” |
| Reativar | Asset retirado; confirmação da ação | `active`; mesmo ID; volta à seleção de nova operação | “Reativar Asset” |
| Excluir não usado | Asset ativo, confirmação explícita e zero Transactions | cadastro e índice de identidade removidos; sem fatos relacionados | “Excluir cadastro” / “Este cadastro não tem operações vinculadas.” |
| Excluir usado | qualquer referência no ledger | operação bloqueada; nenhum dado removido | “Não é possível excluir este Asset porque existem operações vinculadas. Retire-o do catálogo para preservar o histórico.” |
| Excluir retirado sem uso | reativar primeiro; depois confirmação e zero Transactions | não excluir diretamente um estado retirado; após reativar, segue a regra de não usado | “Reative o Asset para revisar o cadastro antes de excluir.” |
| Corrigir identidade usada | motivo, revisão e capability futura de 018 | comando auditado ou rejeitado; nunca mutação silenciosa | “Correção de identidade — revisar impacto” |

A palavra “posição” fica reservada à leitura derivada. O catálogo usa “Asset”
ou “identidade do ativo”; o ledger usa “operação”. “Retirar” não é sinônimo de
“excluir” e “cobertura de cotação” não é evidência de uso patrimonial.

## 4. Matriz de estados, referência e recovery

| Superfície | Estado | Semântica e ação segura |
| --- | --- | --- |
| Catálogo | `loading` | carregar sem inventar ativos, uso ou zeros; foco permanece no título |
| Catálogo | `empty` | começo válido; oferecer **Cadastrar ativo**, sem mensagem de erro |
| Asset | `active · unused` | editar identidade e excluir cadastro são possíveis após validação/confirmação |
| Asset | `active · referenced` | identidade somente leitura; retirar é possível; excluir fica bloqueado |
| Asset | `retired · referenced` | histórico legível; não selecionar nova operação; oferecer reativar |
| Asset | `retired · unused` | cadastro preservado; reativar é necessário antes de editar ou excluir |
| Asset | `partial` | uso ou metadados incompletos; não afirmar “sem uso” nem habilitar delete |
| Catálogo | `stale` | manter snapshot rotulado como desatualizado; atualizar antes de comando destrutivo |
| Catálogo | `unavailable` | recurso inexistente ou não acessível é indistinguível; não revelar owner |
| Comando | `conflict` | estado mudou ou identidade ficou ocupada; preservar formulário e pedir atualização/revisão |
| Comando | `resultado desconhecido` | pode ter sido enviado; consultar catálogo/estado antes de novo comando |
| Sessão | `unauthorized` | um recovery de sessão conforme 012-04; depois autenticação explícita |

“Sem uso” só pode ser afirmado quando a capability de autoridade responder de
forma completa. Se houver erro de reconciliação, o produto deve bloquear delete
por segurança e dizer: **“Não foi possível confirmar todas as operações
vinculadas. O cadastro permanece preservado.”**

Para `401`, a capability pode fazer no máximo um refresh forçado e repetir
somente leitura idempotente ou comando com chave estável, uma vez. Timeout,
conflito, desconexão após dispatch e resposta ilegível não repetem
`retire`/`restore`/`delete` cegamente.

## 5. Capability provisória e dados conceituais

Os nomes abaixo representam intenção e view model, não endpoint, DTO ou schema.
O owner vem do token verificado; `ownerId`, UID e provider não entram no input
do cliente. IDs são opacos e estáveis.

| Capability | Input conceitual | Saída/view model | Restrição |
| --- | --- | --- | --- |
| `asset.list` | filtro `active`/`retired`/`all` | item com ID, identidade, lifecycle, `referenceState`, estado e diagnostics | `referenceState=unknown/partial` não libera delete |
| `asset.get` | `{ assetId }` | identidade, lifecycle, resumo de referências e estado | recurso não acessível indistinguível de inexistente |
| `asset.create` | `{ symbol, market, assetType, currency }` | Asset criado ou existente por identidade; se retirado, oferece reativação | unicidade owner-scoped; nunca cria duplicado; reativação é ação explícita |
| `asset.updateIdentity` | `{ assetId, identity, expectedState }` | Asset atualizado ou `conflict` | permitido somente sem Transaction; mesmo ID |
| `asset.retire` | `{ assetId, confirmation, expectedState }` | lifecycle `retired` ou `conflict` | preserva fatos; alcance global informado |
| `asset.restore` | `{ assetId, confirmation, expectedState }` | lifecycle `active` ou `conflict` | confirmação explícita; não cria novo Asset |
| `asset.deleteUnused` | `{ assetId, confirmation, expectedState }` | remoção do cadastro ou bloqueio | Asset ativo sem uso; estado retirado precisa ser reativado; nunca cascade |
| `asset.correctIdentity` | motivo, identidade anterior/nova, revisão | decisão auditada futura | capacidade não disponível no freeze; owner de 018 |

O view model pode apresentar `referenceState` para orientar copy, mas a UI não
deve consultar ou tratar `assetUsages` como autorização. A forma de versão,
idempotência, paginação e confirmação de estado pertence a 016/018.

## 6. Acessibilidade e critérios de freeze

| Critério | Resultado esperado |
| --- | --- |
| Teclado | ordem título → filtro/estado → cadastro → item → ação; editar, retirar, reativar e excluir têm nomes únicos |
| Foco | abrir formulário foca o primeiro campo; erro foca diagnóstico; confirmação devolve foco ao originador após fechar |
| Leitor de tela | anunciar `ativo`, `retirado`, `sem operações` ou `operações vinculadas`; nunca comunicar referência somente por cor |
| Confirmação | excluir e retirar mostram identidade e alcance; retiro diz explicitamente que não apaga histórico |
| 320 px/200% | identidade longa quebra sem corte; status, bloqueio e ação continuam visíveis sem rolagem horizontal |
| Contraste/estado | status e bloqueios usam texto, rótulo e token semântico; contraste/foco devem ser medidos em 013/017 |
| Financeiro | não usar patrimônio, posição ou cotação para alegar que um Asset está referenciado |

O pacote está pronto para a revisão de 017 quando a implementação consegue
expressar, sem nova decisão de produto, cadastro, deduplicação, edição segura,
retirada/reativação, delete bloqueado, delete permitido sem uso, conflito e
resultado desconhecido. O gate não congela URLs, DTOs, OpenAPI, schema, locks ou
enforcement.

## 7. Handoff, questões e riscos residuais

### Handoff

- **013:** transformar estados, status, diálogos, diagnósticos e retorno de foco
  em primitives testáveis; validar teclado, contraste, 320 px, zoom e leitor de
  tela.
- **016:** modelar unicidade owner-scoped, FK `RESTRICT`, lifecycle e consulta
  confiável de referência sem copiar `assetUsages` como registry de autorização.
- **017:** implementar catálogo, deduplicação, edição pré-uso, retiro/reativação,
  mensagens e modo somente leitura para Asset usado.
- **018:** fechar enforcement, concorrência, locks, idempotência e a capacidade
  excepcional de correção auditada; preservar Transaction append-only e
  `assetId` estável.
- **019:** não confundir cotação, cobertura ou unavailable com uso e lifecycle do
  Asset.

### Questões que permanecem deliberadamente fora do freeze

1. O formato físico do evento de correção e o papel de aprovação pertencem à
   autoridade de 018; a UX não deve improvisar uma edição inline.
2. Paginação, busca e filtros avançados dependem de volume sintético e ficam
   para o protótipo da vertical, sem alterar a política de identidade.
3. A confirmação por nome para retirar/reativar deve ser validada em 017; a
   confirmação explícita da retirada e da exclusão já é obrigatória.

Riscos residuais: o walkthrough não é pesquisa com usuários reais; não houve
execução de navegador, tecnologia assistiva, contraste, 320 px ou zoom real;
`assetUsages` legado pode divergir da autoridade futura; e a implementação
legada ainda permite editar identidade de Asset usado e só descobre uso no
fluxo de exclusão. Esses gaps foram encaminhados a 016–018 e não são tratados
como resolvidos por este documento.

## Referências

- [`Spec 012`](../../../specs/012-product-ux-ui-ia-api-discovery.md)
- [`012-05 — acessibilidade e linguagem`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-05-auditar-acessibilidade-densidade-e-microcopy.md)
- [`012-07 — Portfolio`](../../../tasks/012-product-ux-ui-ia-api-discovery/012-07-prototipar-e-freezar-portfolio.md)
- [`ADR 021 — lifecycle de Asset referenciado`](../../../decisions/021-lifecycle-de-asset-referenciado.md)
- [`ADR 006 — Asset e ledger`](../../../decisions/006-assets-transactions-ledger.md)
- [`AssetCatalog`](../../../../src/components/asset/asset-catalog.tsx)
- [`AssetCreateForm`](../../../../src/components/asset/asset-create-form.tsx)
- [`AssetEditForm`](../../../../src/components/asset/asset-edit-form.tsx)
