# 012-08 — Decidir lifecycle de Asset

- **Ticker:** `012`
- **Número:** `08`
- **Status:** `completed`

## Objetivo e resultado esperado

Executar UX-06 e revisar a ADR 021 para decidir como o produto comunica criação,
edição, archive/retire e tentativa de exclusão de Asset referenciado.

## Requisitos cobertos

Estabilidade de `assetId`, identidade econômica, histórico, referências,
duplicidade e decisão de produto para Asset usado.

## Escopo incluído e excluído

Incluído: protótipo de catálogo, estados de referência e política de identidade.
Excluído: FK, locks, enforcement, migração e implementação de comandos.

## Dependências

`012-02`, `012-05`, `012-07`, ADR 021 e `src/components/asset/*`.

## Arquivos e símbolos prováveis

`docs/architecture/012/slices/asset-lifecycle.md`,
`docs/decisions/021-lifecycle-de-asset-referenciado.md`, `AssetCatalog`,
`AssetCreateForm`, `AssetEditForm`.

## Passos de implementação

1. Testar editar, duplicidade, arquivar/retirar e apagar Asset não usado/usado.
2. Decidir se identidade usada é imutável ou exige correção explícita auditada.
3. Definir mensagens, histórico legível e capability provisória.
4. Encaminhar enforcement para 016/018 sem copiar registries Firestore.

## Testes e comandos de validação

Walkthrough de conflitos e referências com fixtures sintéticas; validar que não
há troca de ID, cascade ou mutação silenciosa.

## Definição de pronto

ADR 021 revisada com decisão/hipótese, impacto em 017/018 e pacote de estados e
copy do lifecycle.

## Riscos e cuidados

Não tratar `assetUsages` como autoridade, não remover contexto histórico e não
prometer correção automática de fatos antigos.

## Registro da execução

### Status e resultado

`completed` — UX-06 foi executado como walkthrough heurístico documental com
fixtures sintéticas. A ADR 021 foi revisada: `assetId` permanece estável,
identidade usada fica imutável na edição comum, retirada/reativação substitui
archive como linguagem do Asset, delete só é permitido sem uso confirmado e
correção futura exige comando explícito e auditado. Nenhum dado real, write,
FK, lock, enforcement ou migração foi implementado.

### Arquivos alterados

- `docs/architecture/012/slices/asset-lifecycle.md` — pacote de decisão,
  walkthrough, estados, copy, capabilities provisórias, a11y e handoff.
- `docs/architecture/012/slices/asset-lifecycle-prototype.html` — protótipo
  standalone com fixtures e simulação local do lifecycle.
- `docs/decisions/021-lifecycle-de-asset-referenciado.md` — decisão de produto
  da 012, alternativas rejeitadas e encaminhamento para 017/018.
- este arquivo — status, decisões, evidências, validações, riscos e handoff.
- `docs/tasks/012-product-ux-ui-ia-api-discovery/012-00-overview.md` — checklist,
  progresso e observação desta conclusão.

### Decisões e desvios

- O estado visível do Asset é **Ativo** ou **Retirado**, e a ação usa
  “Retirar do catálogo”; não foi criado um segundo conceito de archive para
  evitar confusão com o lifecycle de Portfolio.
- A identidade de Asset usado é imutável na edição comum. Uma correção
  excepcional é apenas uma capability futura, explícita e auditada de 018; não
  foi inventado um fluxo de correção ou migração nesta fase.
- O protótipo é HTML standalone e usa somente fixtures descartáveis. Ele é um
  walkthrough interativo local, não componente de produção nem contrato HTTP.
- O comportamento legado permite editar identidade usada; isso foi registrado
  como gap e não foi alterado, pois a spec 012 proíbe alterar produção nesta
  fase.

### Comandos executados e resultados

- Conferência da spec, overview, subtarefa, `AGENTS.md` e dependências
  `012-02`/`012-05`/`012-07` — passou; C1 aceito, C0 restrito a dev/testes e
  fixtures sintéticas.
- Conferência de ticker — passou: spec, pasta, overview e as 13 subtarefas usam
  `012`; a subtarefa `012-08` foi selecionada explicitamente pelo caminho
  informado.
- Conferência do overview — passou antes da edição: uma única seção
  `## Checklist`, 13 itens, exatamente um por subtarefa; somente `012-08` foi
  selecionada.
- Exploração read-only de `AssetCatalog`, `AssetCreateForm`, `AssetEditForm`,
  domínio/repositories, Rules, ADRs 005/006/021 e handoff 011 — passou; foram
  registrados deduplicação, edição, reconciliação e bloqueio de delete legado.
- Walkthrough documental das fixtures `F-EMPTY`, `F-UNUSED`, `F-DUPLICATE`,
  `F-USED`, `F-RETIRED`, `F-CONFLICT` e `F-UNKNOWN` — passou; cobre sucesso,
  vazio, duplicidade, referência, retirada, conflito e resultado desconhecido.
- `git diff --check` — passou após a edição final dos artefatos.
- `git diff --no-index --check /dev/null docs/architecture/012/slices/asset-lifecycle.md`
  e o mesmo comando para `asset-lifecycle-prototype.html` — passaram.
- Compilação do JavaScript inline com `vm.Script` e assertions estruturais de
  confirmação, cancelamento, conflito e duplicidade retirada — passaram.
- Conferência final de links Markdown locais — passou com 29 destinos resolvidos.
- Revisão independente inicial do subagente `review` — **BLOQUEADA** por falta
  de confirmação explícita no protótipo, política indefinida para retirada sem
  uso e deduplicação de identidade retirada; os achados foram corrigidos antes
  da nova revisão.
- Segunda revisão independente — **BLOQUEADA** por três inconsistências
  residuais: a ADR não explicitava “ativo sem uso” versus “retirado sem uso”,
  `asset.restore` não carregava confirmação na capability e Escape/confirmar no
  protótipo não fechavam o ciclo de foco. A ADR, a capability e o tratamento de
  `cancel`/foco foram corrigidos; uma terceira revisão será solicitada.
- Terceira revisão independente do subagente `review` — **APROVADO**; não
  apontou bloqueadores, altos, médios ou baixos obrigatórios e confirmou a
  prontidão do pacote para handoff.
- Lint, typecheck, build e testes de código — não executados: somente Markdown,
  ADR e protótipo standalone de discovery foram alterados; a spec 012 dispensa
  esses comandos quando não há código de produção.
- Validação real em navegador, leitor de tela, contraste, 320 px e zoom de 200%
  — não executada; o protótipo registra os critérios para 013/017.

### Resultados e evidências

- `asset-lifecycle.md` registra a política de identidade, os estados
  `unused/referenced/retired/partial/unknown`, copy de exclusão/retirada,
  recovery e capabilities sem congelar DTO ou endpoint.
- O walkthrough prova conceitualmente que o mesmo `assetId` atravessa edição
  pré-uso, retiro e reativação; nenhuma ação exclui Transactions.
- A tentativa de delete usado é comunicada como bloqueio seguro, enquanto
  delete sem uso exige confirmação e não remove fatos.
- A revisão da ADR 021 encaminha FK/restrict, autoridade de referência,
  concorrência, correção auditada e enforcement para 016/018.
- O protótipo agora exige confirmação para retirar, reativar e excluir, devolve
  foco ao originador ao cancelar, bloqueia ações de lifecycle em conflito e
  apresenta `F-DUPLICATE-RETIRED` com reativação explícita. Asset retirado sem
  uso deve ser reativado antes de exclusão, em alinhamento com o pacote. Escape
  também cancela pelo mesmo caminho, e confirmações focam o diagnóstico após a
  mutação.

### Riscos residuais e bloqueios

- Não há bloqueio documental de execução. Ainda falta validar a compreensão da
  retirada e seu alcance global com usuários/protótipo de 017.
- O catálogo legado ainda permite editar identidade de Asset usado e usa
  reconciliação client-side no delete; isso não é enforcement e deve ser
  substituído nas verticais futuras.
- Não houve validação runtime de a11y nem pesquisa com usuários reais.
- O formato de correção auditada, locks, idempotência, FK e fonte transacional de
  referência continuam decisões de 016/018; não são considerados resolvidos.

### Handoff

- `013` deve validar status, diálogos, foco, copy e responsividade do catálogo.
- `016` deve traduzir a decisão em requisitos de modelo/consulta sem copiar
  registries Firestore.
- `017` deve implementar a jornada do catálogo, incluindo deduplicação,
  edição pré-uso, retirada/reativação e bloqueio de usado.
- `018` deve fechar enforcement, concorrência, idempotência e correção auditada
  sem trocar `assetId` ou reescrever Transactions.
- Não avançar automaticamente para `012-09` ou qualquer outra subtarefa.
