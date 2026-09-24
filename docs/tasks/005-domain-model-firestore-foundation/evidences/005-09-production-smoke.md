# 005-09 — Production smoke

- **Data:** 2026-09-24
- **Cliente:** Firebase Web SDK no browser, sem Admin
- **Fixture:** Portfolio sintético temporário; removido ao final
- **Contas:** uma conta de teste autorizada; nenhum identificador registrado

| Caso | Resultado |
| --- | --- |
| owner create | PASS |
| owner read | PASS |
| owner update | PASS |
| cross-user read em path sintético de outro owner | DENIED |
| cross-user write em path sintético de outro owner | DENIED |
| anonymous read | DENIED |
| anonymous write | DENIED |
| cleanup | PASS |

Cross-user foi validado com request autenticado da conta disponível contra
namespace sintético diferente. Não houve segunda identidade autenticada nem
dados permanentes.
