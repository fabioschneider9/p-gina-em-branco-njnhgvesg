# Debug — 2026-09-29 — F1-T007: elegibilidade da central e correção de registro

**Task:** F1-T007 (SPEC-1-002) · **Skip:** v0.0.32 · **Sintoma:** champion reportou "não me pareceu correto" no teste da seção F1-T007.

**Reprodução:** clicar F1-EDGE-002 (AGENDADO pós-data) → registro `VALIDO` exibia "Elegível para a central: SIM".

**Causa raiz:** `isEligibleForCentral` checava apenas `validationState === 'VALIDO'`, ignorando o status de origem. A SPEC (cenário "Status antigo") exige que `AGENDADO` pós-data mantenha pendência — um atendimento não realizado não é produção a enviar para a central. Problema secundário: o botão "Corrigir bloqueado" atuava sobre qualquer registro em tela, inclusive `VALIDO`.

**Correção (v0.0.32):**

1. `isEligibleForCentral` = `VALIDO` **e** `status_source === 'ATENDIDO'`; badge da tela explica a pendência ("status AGENDADO não é produção enviável à central").
2. "Corrigir bloqueado" recusa registro não-BLOQUEADO com mensagem explicativa.

**Rodada 2 (v0.0.34) — correção da própria correção:**

- Sintoma: champion reportou que a recusa do item 2 ("Registro F1-EDGE-001 está VALIDO — a correção por nova versão se aplica a registro BLOQUEADO") estava incorreta.
- Causa raiz: a recusa era excesso de implementação, não regra da SPEC. CA-1-009 diz "correção gera versão nova, relaciona a anterior, registra autor/motivo" sem restringir ao registro bloqueado; a F1-T006 já corrigia registro VALIDO.
- Correção: removida a restrição — correção vale para qualquer registro (VALIDO ou BLOQUEADO); botão renomeado para "Corrigir registro (nova versão)".
- Verificação: F1-EDGE-001 (VALIDO) corrigido → VALIDO v2 (REC-EVT-0002, RECORD_REVISED) com v1 preservada; pipeline v0.0.34 verde.
- Lição: restrição adicional ao critério de aceite precisa de base na SPEC; se não tem, é escopo a mais.

**Verificação automática:** pipeline Skip v0.0.32 verde (setup, estática, build, integrações, testes).

**Verificação no caminho real (reprodução + regressão):**

- F1-EDGE-002 → `VALIDO` com "Pendência mantida — status AGENDADO não é produção enviável à central" ✓
- F1-EDGE-001 (ATENDIDO com nulos) → "Elegível para a central: SIM" ✓
- F1-INVALID-001 → `BLOQUEADO` v1; correção → `VALIDO` v2 (REC-EVT-0004) com v1 preservada ✓
- Corrigir bloqueado sobre registro `VALIDO` → recusado com mensagem explicativa, nenhum evento criado ✓
- EDGE-003 (clínico) e regressão F1-T006 não afetados pela mudança (elegibilidade não toca criação) ✓

**Gate atual:** aguardando teste humano
