# Evidência F1-T003 — Qualivida

**Task:** F1-T003 — Exercitar negações e privacidade
**SPEC:** SPEC-1-001 — Governança de responsáveis e acesso por escopo
**Data:** 2026-08-31
**Champion/aprovador:** Fábio Schneider — CEO, líder do projeto e único responsável
**Critério binário:** Usuários sem entidade, unidade ou profissional recebem negação; payload clínico não é persistido.

## Escopo da prova

- Fixture sintética reutilizada da F1-T002: `ENTITY-TEST-001`, `UNIT-TEST-001`, `PROF-TEST-001`, registro `RECORD-TEST-001`.
- Três usuários sintéticos adicionais, cada um com escopo parcial (sem entidade, sem unidade, sem profissional).
- Nenhum dado real de paciente, nome, CPF, diagnóstico, laudo ou conteúdo clínico foi utilizado.

## Cenários executados (automação + tela)

| Cenário         | Usuário          | Dimensão ausente | Resultado esperado          | Resultado observado |
| --------------- | ---------------- | ---------------- | --------------------------- | ------------------- |
| RLS-ALLOW       | `PROF-USER-001`  | —                | Leitura permitida (F1-T002) | Permitida           |
| RLS-ENTITY-DENY | `USER-NO-ENTITY` | entidade         | DENIED (`NO_ENTITY`)        | DENIED              |
| RLS-UNIT-DENY   | `USER-NO-UNIT`   | unidade          | DENIED (`NO_UNIT`)          | DENIED              |
| RLS-PROF-DENY   | `USER-NO-PROF`   | profissional     | DENIED (`NO_PROFESSIONAL`)  | DENIED              |

Todos os três cenários de negação retornam apenas o motivo da dimensão ausente — o payload do registro não é revelado em nenhum deles (CA-1-002).

## Privacidade (CA-1-004 / RN-1-003)

- Payload administrativo (`número do procedimento`, `quantidade`, `competência`): **VALIDO** — pode ser persistido.
- Payload clínico (`nome do paciente`, `diagnóstico`, `laudo`): **REJEITADO** — `validatePayload` detecta os marcadores clínicos e retorna `persisted: false`. Nenhum conteúdo clínico é persistido no MVP.

## TDD

- **RED:** o cenário de negação `RLS-UNIT-DENY` é executado com usuário sem `UNIT-TEST-001`; a operação nega sem retornar o payload.
- **GREEN:** `authorizeRecordRead` retorna `DENIED` nos três cenários e `granted` apenas no `RLS-ALLOW`; `validatePayload` rejeita o payload clínico.

## Verificação

- **PASSOU:** três negações (entidade, unidade, profissional) demonstradas, sem vazamento de payload.
- **PASSOU:** payload clínico não é persistido.
- **PASSOU:** nenhum dado real ou conteúdo clínico foi tocado.
- **AGUARDANDO:** teste humano de Fábio.

## Limites respeitados

- Não foram criadas integrações externas, regras financeiras, pagamentos ou permissões fora da fixture.
- Não houve alteração no MDMED nem em arquivos originais.
- RLS-ALLOW (F1-T002) permanece funcional.
