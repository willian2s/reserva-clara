# 007-06 — Implementar catálogo de Assets

- **Ticker:** `007`
- **Número:** `06`
- **Status:** `pending`

## Objetivo

Entregar `/assets` protegido, simples e acessível para listar e criar
identidades de Asset sem misturar cotação ou posição.

## Dependências

- 007-03 persistência Asset concluída.
- 007-05 Rules de Asset/registry verdes.
- Documentação local Next 16 lida antes de criar/alterar rotas.

## Escopo

- Incluir `/assets/:path*` no matcher/bridge quando necessário.
- Criar página/componentes Client seguindo loading/error/retry de Portfolio.
- Formulário com symbol, market, assetType e currency; mostrar normalização e
  resultado existente quando identidade já estiver cadastrada.
- Listar somente Assets reais do owner, com empty state e mensagens sanitizadas.
- Reaproveitar AuthGate, shell, Button/Card/Input/Label e acessibilidade atual.

## Fora de escopo

- Editar/deletar Asset, logo de empresa, provider, preço, posição ou busca global.

## Critérios de aceite

- Anônimo não vê dados nem formulário acionável.
- Submit inválido não toca Firestore; double submit não cria duplicata.
- Mesma identidade retorna Asset existente; erro de persistência oferece
  reconciliação sem retry cego.
- Mobile, teclado, foco e live regions são verificáveis.
- Server Components não importam SDK Firestore.

## Arquivos prováveis

- `src/app/(app)/(protected)/assets/page.tsx`
- `src/components/asset/*`
- `src/app/(app)/(protected)/layout.tsx`
- `src/proxy.ts`

## Validação

Manual local/preview com sessão sintética/autorizada, seguido de lint, typegen,
TypeScript, build e `git diff --check`.

## Registro de execução

- **Arquivos alterados:** preencher ao executar.
- **Decisões/desvios:** registrar rota e comportamento de identidade existente.
- **Comandos/resultados/evidências:** preencher ao executar.
- **Riscos residuais:** ausência de teste automatizado de UI.
