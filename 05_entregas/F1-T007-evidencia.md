# F1-T007 — Evidência: bloqueios, bordas e versionamento

**Data:** 2026-09-29/30 · **SPEC:** SPEC-1-002 · **Skip:** v0.0.29 e v0.0.30 · **Teste humano:** pendente

## O que foi implementado

- `src/lib/operational-record.ts` (endurecido):
  - validação runtime de `status_source` desconhecido, `event_date` (AAAA-MM-DD) e `competency` (AAAA-MM) — nunca reinterpretados;
  - registro com ausência/ambiguidade é **persistido como `BLOQUEADO`** com `missing_fields` (antes era descartado) e fica fora da saída;
  - `detectClinicalContent` varre chaves e valores na fronteira; conteúdo clínico é rejeitado sem persistir nada (só o tipo de bloqueio é reportado);
  - `reviseOperationalRecord` aceita correção de registro `VALIDO` **ou** `BLOQUEADO` — nova versão com revalidação completa;
  - `isEligibleForCentral`: somente `VALIDO` segue para SPEC-1-003;
  - escopo RLS compara apenas dimensões **presentes**: dimensão ausente vira `missing_fields` (bloqueio), dimensão presente e divergente vira negação de RLS.
- `src/pages/Index.tsx` — seção "F1-T007 · Bloqueios, bordas e versionamento" com botões por cenário (`F1-INVALID-001`, `F1-EDGE-001..003`), correção de bloqueado, payload do registro e tabela de auditoria com motivo.
- Handler da F1-T006 ajustado ao novo retorno (mensagem "registrado como ...").

## Verificação automática (pipeline Skip v0.0.29/v0.0.30)

| Etapa            | Resultado |
| ---------------- | --------- |
| Setup            | ok        |
| Análise estática | ok        |
| Build            | ok        |
| Integrações      | ok        |
| Testes           | ok        |

## Verificação no caminho real (preview)

| Cenário                                                           | Resultado observado                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `F1-INVALID-001` (RED: sem unit_id, serviço ambíguo, STATUS_NOVO) | `BLOQUEADO` v1 com ausências: unit_id; identidade não confirmada; service_ref não mapeado; status_source desconhecido (STATUS_NOVO) |
| `F1-EDGE-001` (condicionais nulos)                                | `VALIDO` v1 com `quantity/unitValue/grossValue: null` — elegível para a central                                                     |
| `F1-EDGE-002` (AGENDADO pós-data)                                 | `VALIDO` v1 com `statusSource: AGENDADO` preservado — não convertido                                                                |
| `F1-EDGE-003` (conteúdo clínico)                                  | `Conteúdo clínico rejeitado (nome do paciente) — nada foi persistido`                                                               |
| Correção de bloqueado                                             | `F1-INVALID-001: VALIDO (v2, REC-EVT-0007)` — v1 (BLOQUEADO) e v2 (RECORD_REVISED) preservadas na auditoria                         |
| Regressão F1-T006                                                 | `F1-VALID-001 registrado como VALIDO (v1, REC-EVT-0008)`                                                                            |

## Correção durante a task (debug interno)

- v0.0.29: `F1-INVALID-001` (unit_id vazio) era negado por RLS antes da validação — a SPEC exige `BLOQUEADO` com `missing_fields`. Corrigido em v0.0.30: escopo compara apenas dimensões presentes; ausência vira bloqueio de validação, divergência continua sendo negação de RLS.

## Limitações

- Entrega de evidência para o contrato de saída é a **F1-T008** — aqui só o gate `isEligibleForCentral` foi implementado.
- Nenhum dado real foi tocado; fixtures sintéticas.
