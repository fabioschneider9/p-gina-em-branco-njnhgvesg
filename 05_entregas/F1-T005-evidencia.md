# Evidência F1-T005 — Qualivida (rascunho — contrato em coleta)

**Task:** F1-T005 — Registrar contrato de campos mínimos
**SPEC:** SPEC-1-002 — Registro operacional de prontuário/produção
**Data:** 2026-09-01
**Champion/aprovador:** Fábio Schneider — CEO, líder do projeto e único responsável
**Status:** decisões parciais registradas; 1 pendência bloqueante

## Decisões do champion (2026-09-01 17:45)

| #   | Decisão                 | Resposta de Fábio                                    | Estado                                                                  |
| --- | ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Serviço (`service_ref`) | **Tabela de referência**                             | ⚠️ PENDENTE — tabela não informada (ex.: TUSS, catálogo próprio, outra) |
| 2   | Identidade oficial      | **Número de guia individual + `record_id` técnico**  | ✅ registrada                                                           |
| 3   | Retenção                | **Para sempre** (registro + auditoria)               | ✅ registrada                                                           |
| 4   | Superfície autorizada   | **Skip + GitHub + ETHOS**, como nas tasks anteriores | ✅ registrada                                                           |

## Contrato derivado (rascunho — sujeito à decisão 1)

- Campos estruturais: `record_id`, `entity_id`, `unit_id`, `professional_id`, `service_ref`, `event_date`, `competency`, `status_source`, `responsible_user_id`, `evidence_ref` + auditoria (`version`, `created_at/by`, `updated_at/by`).
- **Novo campo de identidade:** `guide_number` (nº de guia oficial) — único por atendimento, além do `record_id` técnico.
- **Retenção:** permanente; nada é apagado — correção por nova versão (alinhado à RN-1-004 e CA-1-009).
- **Fronteira clínico/administrativo:** nome de paciente, diagnóstico, laudo, prescrição e presença permanecem proibidos no MVP (já fechado na SPEC).
- **Estados:** `RASCUNHO` / `VALIDO` / `BLOQUEADO`; status de origem preservado.

## Pendência bloqueante

- **D1:** qual é a tabela de referência oficial de serviços? (TUSS, catálogo próprio, outra — informar)
- Responsável: Fábio Schneider. Sem essa definição, `service_ref` fica ambíguo e a SPEC-1-002 exige bloqueio.

## Verificação

- **PENDENTE:** contrato completo aguarda decisão 1; fixture e implementação não iniciadas.
- Nenhum dado real ou conteúdo clínico foi tocado.
