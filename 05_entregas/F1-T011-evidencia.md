# F1-T011 — Evidência: rejeição, idempotência e privacidade

**Data:** 2026-10-01 · **SPEC:** SPEC-1-003 · **Skip:** v0.0.43 · **Teste humano:** pendente

## O que foi implementado

- `src/lib/operational-record.ts`:
  - `issueEnvelope(record)` — camada do contrato: valida privacidade (defesa em profundidade), identidade oficial e elegibilidade ANTES de gerar; rejeições estruturadas com código (`NAO_ELEGIVEL`, `IDENTIDADE_AMBIGUA`, `CLINICAL_CONTENT`), detalhe e recordId — nunca saída parcial (RN-1-006/RN-1-007);
  - registro de idempotência em memória (`issuedEnvelopes`): chave já emitida devolve o MESMO envelope como `DUPLICADO`, sem criar nova saída (RN-1-005/CA-1-013); `resetIssuedEnvelopes` e `issuedEnvelopeCount` para a demonstração;
  - fixtures `F1-NULL-VALUE-001` (valores condicionais nulos) — `F1-BLOCKED-001` reutilizada da F1-T008.
- `src/pages/Index.tsx` — seção "F1-T011 · Rejeição, idempotência e privacidade": botões por cenário, contador de envelopes emitidos (prova de não-duplicação) e tabela de resultados com código/detalhe.

## Verificação automática (pipeline Skip v0.0.43)

Setup, análise estática, build, integrações e testes — todos ok.

## Verificação no caminho real (preview v0.0.43)

| Cenário                       | Resultado observado                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `F1-BLOCKED-001` (bloqueado)  | `REJEITADO (NAO_ELEGIVEL)` — "registro BLOQUEADO (service_ref não mapeado no catálogo...)"; contador permaneceu 0        |
| `F1-DUPLICATE-001` 1ª emissão | `EMITIDO` — chave `nova-aplicacao-prontuario-producao:F1-VALID-001:1`; contador 1                                        |
| `F1-DUPLICATE-001` 2ª emissão | `DUPLICADO (sem nova saída)` — mesma chave devolvida; contador permaneceu **1**                                          |
| `F1-NULL-VALUE-001` (nulos)   | `EMITIDO` — chave própria, envelope com valores `null` preservados; contador 2                                           |
| `F1-PRIVACY-001` (clínico)    | `REJEITADO (CLINICAL_CONTENT)` — "conteúdo clínico detectado (nome do paciente)"; nada persistido; contador permaneceu 2 |

## Limitações

- O registro de idempotência é em memória (suficiente para fixture da Fase 1, sem persistência externa — CA-1-017). Persistência real pertence à Fase 2.
- Handoff do pacote completo é a **F1-T012**.
- Nenhum dado real foi tocado; fixtures sintéticas.
