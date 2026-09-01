# Evidência F1-T004 — Qualivida

**Task:** F1-T004 — Auditar alteração e demonstrar rollback de RLS
**SPEC:** SPEC-1-001 — Governança de responsáveis e acesso por escopo
**Data:** 2026-09-01
**Champion/aprovador:** Fábio Schneider — CEO, líder do projeto e único responsável
**Teste humano:** pendente

## Critério binário

Alteração sensível registra versões e rollback restaura política anterior sem apagar auditoria.

## Escopo da prova

- Fixture sintética reutilizada (F1-T002/F1-T003): `ENTITY-TEST-001`, `UNIT-TEST-001`, `PROF-TEST-001`, `RECORD-TEST-001`.
- Política versionada `ScopePolicy` e trilha `AuditEvent` (append-only).
- Administrador sintético `ADMIN-USER-001` para alterações sensíveis (RN-1-002).
- Nenhum dado real de paciente ou conteúdo clínico foi utilizado.

## Cenários executados (automação + tela)

| Cenário            | Ação                                  | Resultado esperado                                                   | Observado                                                                                                 |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Alteração sensível | Aplicar novo escopo a `PROF-USER-001` | Nova versão criada; evento com `before_version` ≠ `after_version`    | vN → vN+1; `SCOPE_CHANGE` / `ALLOWED`                                                                     |
| Auditoria          | Listar eventos                        | Ator, alvo, resultado, versões e ocorrência                          | `AuditEvent` com `actor_id`, `target_user_id`, `result`, `before_version`, `after_version`, `occurred_at` |
| Rollback           | Restaurar a versão anterior           | Política volta ao escopo anterior; auditoria permanece (append-only) | Nova versão com escopo restaurado; `SCOPE_ROLLBACK` adicionado, eventos antigos não removidos             |
| Não-admin negado   | Profissional tenta alterar política   | Operação negada, política intacta (RN-1-002)                         | `SCOPE_CHANGE_DENIED` / `DENIED`                                                                          |
| Rollback inválido  | Restaurar versão inexistente/atual    | Operação negada, política intacta                                    | `DENIED`, sem nova versão                                                                                 |

## TDD

- **RED:** tentativa de alteração por não-admin nega e mantém a política anterior.
- **GREEN:** alteração por admin cria nova versão + evento; rollback restaura versão anterior e preserva auditoria.

## Verificação

- **PASSOU:** alteração sensível registra versão e auditoria (CA-1-003).
- **PASSOU:** rollback restaura política anterior sem apagar auditoria (CA-1-003, RN-1-004).
- **PASSOU:** não-admin e rollback inválido negados (RN-1-002, caminhos de erro).
- **PASSOU:** nenhum dado real ou conteúdo clínico foi tocado.
- **AGUARDANDO:** teste humano de Fábio.

## Limites respeitados

- Nenhuma integração externa, regra financeira, pagamento ou permissão fora da fixture.
- MDMED e arquivos originais não foram alterados.
- F1-T002 (RLS-ALLOW) e F1-T003 (negações/privacidade) permanecem funcionais.
- `.skip.config.json` pré-existente não foi tocado (fora do recorte).
