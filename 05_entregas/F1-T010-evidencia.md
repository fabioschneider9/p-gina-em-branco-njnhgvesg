# F1-T010 — Evidência: gerar envelope válido versionado

**Data:** 2026-09-30 · **SPEC:** SPEC-1-003 · **Skip:** v0.0.41 · **Teste humano:** pendente

## O que foi implementado

- `src/lib/operational-record.ts`:
  - tipo `ProductionEnvelopeV1` espelhando o JSON mínimo do contrato aprovado na F1-T009;
  - `buildProductionEnvelope(record)` — transformador determinístico: só registro elegível (VALIDO + ATENDIDO) gera envelope; não-elegível retorna rejeição com motivo (bateria completa de rejeições é a F1-T011);
  - `idempotency_key = nova-aplicacao-prontuario-producao:record_id:versão`;
  - `service_ref` resolvido do catálogo da F1-T005 ({id: SRV-002, label: ECG});
  - valores ausentes preservados como `null` (nunca estimados — CA-1-015).
- `src/pages/Index.tsx` — seção "F1-T010 · Envelope production-record.v1": botão gera o envelope do F1-VALID-001; botão "Gerar novamente (comparar)" produz segunda cópia e compara na tela, provando o determinismo.

## Verificação automática (pipeline Skip v0.0.41)

Setup, análise estática, build, integrações e testes — todos ok.

## Verificação no caminho real (preview v0.0.41)

- "Envelope gerado com chave: nova-aplicacao-prontuario-producao:F1-VALID-001:1"
- JSON completo exibido: `contract_version`, `record_id`, `source` (system/source_record_id/version/evidence_ref), `entity_id`, `unit_id`, `professional_id`, `service_ref` {id: SRV-002, label: ECG}, `event_date`, `competency`, `quantity: 1`, `unit_value: null`, `gross_value: null`, `status_source: ATENDIDO`, `validation_state: VALIDO`, `responsible_user_id`, `audit` {created_by, updated_by, version}, `idempotency_key`.
- "Segunda geração idêntica à primeira — determinismo provado (mesma chave: nova-aplicacao-prontuario-producao:F1-VALID-001:1)".

## Limitações

- Rejeição, duplicidade e privacidade no contrato são a **F1-T011** (`F1-BLOCKED-001`, `F1-DUPLICATE-001`, `F1-PRIVACY-001`) — aqui só o caminho principal com determinismo.
- Sem API, credencial ou escrita externa (CA-1-017); fixtures sintéticas.
