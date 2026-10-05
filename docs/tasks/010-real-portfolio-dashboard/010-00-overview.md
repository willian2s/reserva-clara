# 010 — Real Portfolio Dashboard

- **Status geral:** completed
- **Spec:** [010-real-portfolio-dashboard.md](../../specs/010-real-portfolio-dashboard.md)
- **Progresso:** 7/7 subtarefas concluídas

## Objetivo

Entregar dashboards global e por carteira sobre o ledger, Positions e Quotes já
existentes, com totais conhecidos honestos, estados parciais explícitos,
atualização manual e nenhuma fonte patrimonial paralela.

## Checklist

- [x] [010-01-fechar-contratos-e-semantica.md](010-01-fechar-contratos-e-semantica.md)
- [x] [010-02-refatorar-projecao-de-carteira.md](010-02-refatorar-projecao-de-carteira.md)
- [x] [010-03-compor-read-side-global.md](010-03-compor-read-side-global.md)
- [x] [010-04-criar-apresentacao-patrimonial.md](010-04-criar-apresentacao-patrimonial.md)
- [x] [010-05-entregar-dashboard-da-carteira.md](010-05-entregar-dashboard-da-carteira.md)
- [x] [010-06-entregar-dashboard-global.md](010-06-entregar-dashboard-global.md)
- [x] [010-07-validar-gates-e-handoff.md](010-07-validar-gates-e-handoff.md)

## Observações

- 010-07 concluída após confirmação do smoke manual autenticado e anônimo nos
  dois dashboards, estados, interações e viewports exigidos.
- Após a validação visual do detalhe, o header foi alinhado ao padrão das demais
  telas e `Cadastrar posição` passou a aparecer sempre em carteiras ativas,
  no topo e acima das métricas/tabela, levando ao formulário de novo lançamento;
  o histórico continua separado e carteiras arquivadas permanecem somente
  leitura.
- O botão `Atualizar dados` agora pertence ao header de conteúdo dos dashboards,
  não ao shell global condicional; a navegação superior mantém a mesma
  geometria nas demais áreas do sistema.
- O dashboard global foi simplificado: a contagem de carteiras está no header
  de `Distribuição das carteiras`, sem cards redundantes de contagem ou bloco
  recolhível de detalhes de cotações; as tabelas globais também não exibem o
  diagnóstico detalhado, que permanece no dashboard individual. Cobertura e
  ativos indisponíveis seguem visíveis diretamente, e a quantidade de posições
  fica no header do resumo de posições.
- Dependências: fases 007, 008 e 009 concluídas; 010 deve consumir o read-side
  existente sem persistir Position ou alterar o ledger.
- O consolidado inclui somente carteiras ativas. Arquivadas permanecem
  consultáveis no detalhe e são marcadas como read-only.
- Quote stale é valorizável com aviso; unavailable e moeda incompatível ficam
  fora dos totais, que passam a ser explicitamente conhecidos/parciais.
- Não há migration, mudança de Rules, índice, secret, deploy, target allocation,
  histórico, FX ou read model persistido nesta fase.
- 010-02 concluída com projeção individual compartilhável, totals conhecidos,
  metadados de Asset/Quote e facade legada compatível.
- 010-03 concluída com composição global ativa, Quotes deduplicadas, falhas
  isoladas e reconciliação decimal; a integração visual permanece nas próximas
  subtarefas.
- 010-04 concluída com formatadores exatos pt-BR, copy sanitizada centralizada,
  peças acessíveis de métricas/cobertura/composição/posição e reducer/hook de
  refresh concorrente; a integração nas rotas permanece em 010-05 e 010-06.
- 010-05 concluída com o detalhe conectado ao read-side individual real,
  métricas, composição, posições abertas em tabela responsiva, estados de Quote,
  refresh resiliente, archive read-only e navegação preservada. Smoke manual
  visual permanece para 010-07.
- 010-06 concluída com o consolidado global client-only de carteiras ativas,
  integração real do read-side, métricas, distribuição, posições preservando
  carteira/ativo, Assets sem cotação deduplicados e refresh/retry resilientes.
  A apresentação global replica a estrutura da dashboard de carteira, com
  tabela responsiva por carteira e composição/cobertura recolhidas. Smoke
  manual e gates finais permanecem em 010-07.
