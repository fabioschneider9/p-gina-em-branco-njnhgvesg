# Evidência F1-T005 — Qualivida (contrato de campos mínimos)

**Task:** F1-T005 — Registrar contrato de campos mínimos
**SPEC:** SPEC-1-002 — Registro operacional de prontuário/produção
**Data:** 2026-09-01
**Champion/aprovador:** Fábio Schneider — CEO, líder do projeto e único responsável
**Status:** decisões coletadas e contrato fechado; aguardando autorização para implementar a fixture (F1-T006 usa este contrato)

## Decisões do champion (2026-09-01, 17:45 e 19:59)

| #   | Decisão                 | Resposta de Fábio                                                                                                                                                                                                                                                      | Estado        |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Serviço (`service_ref`) | **Catálogo próprio**, fonte: planilha `Valores_Qualivida.xlsx` (enviada 2026-09-01 19:59); códigos TUSS como identificador técnico; pagadores por coluna; subtipos de rede (ex.: Bradesco Nacional/Efetivo) e valores especiais (desconto, combo) reservados no modelo | ✅ registrada |
| 2   | Identidade oficial      | **Nº de guia individual + `record_id` técnico**                                                                                                                                                                                                                        | ✅ registrada |
| 3   | Retenção                | **Para sempre**; correção somente por nova versão                                                                                                                                                                                                                      | ✅ registrada |
| 4   | Superfície autorizada   | **Skip + GitHub + ETHOS**                                                                                                                                                                                                                                              | ✅ registrada |

## Contrato registrado (F1-FIELDS-BASELINE)

### Identidade do registro

- `record_id` — identificador técnico interno, estável e único.
- `guide_number` — **nº de guia individual** oficial, obrigatório.

### Catálogo de serviços (`service_ref`)

- Fonte oficial: planilha de valores Qualivida (2026-09-01). Os **valores estão desatualizados e não são usados** — a planilha serve de catálogo de serviços/pagadores, não de tabela de preços vigente.
- Identificador técnico: **código TUSS** quando disponível; serviço sem código fica `BLOQUEADO` até receber código.
- **27 serviços distintos** identificados — 23 com código TUSS, 4 sem código:
  - Com código: Consulta (10101012), ECG (40101010), ECO (40901106), ECO-Stress (40901076), Carótidas (40901360), TE (40101037), MAPA (20102038), Holter (20102020), EEG rotina (40103170), EEG Quantitativo (40103196), EEG Sono/Vigilia (40103234), EEG Prolongado (40103200), EEG Fotoestímulo (40103218), VEEG (40103757), PSG noite inteira (40103528), PSG com EEG (40103536), PSG com CPAP (40103544), Doppler Transcraniano (40901602), US Globo Ocular (40901025), Infiltração de ponto gatinho (20103301), Bloqueio anestésico de nervo (31602118), US vascular c/ contraste (40901823), Bloqueio fenólico/alcoólico (20103140).
  - Sem código (ficam `BLOQUEADO` até receber código): Holter-EEG 12hs, Holter-EEG 24hs, VEEG prol 1 hora, VEEG prol 2 hora.

### Pagadores (fontes pagadoras)

- **21 pagadores** distintos nas 4 abas: Bradesco (Emp/Ind), Mediservice, Sulamérica, GEAP, INB, Particular, Particular VR/BM, Salvus, Salutem, Saúde CAIXA, UNIMED, Golden Cross, Fusex, CASSI, Postal Saúde, Real Grandeza, Plamer, Amil, Abertta, Liv.
- Cada clínica/unidade tem **pacote próprio**; **subtipos de rede** (ex.: Bradesco Nacional × Efetivo) admitem valores diferentes; **valores especiais** (desconto solicitado por paciente, combo de serviços) têm espaço reservado no modelo.

### Fronteira clínico/administrativo e estados

- Proibido no MVP: nome de paciente, diagnóstico, laudo, prescrição, presença (já fechado na SPEC).
- Estados: `RASCUNHO` / `VALIDO` / `BLOQUEADO`; status de origem preservado (`AGENDADO`, `ATENDIDO`, `CANCELADO`, `FALTOU`); valores condicionais nulos explícitos, nunca zero silencioso.

## Pendências de qualidade do arquivo-fonte (não bloqueiam o contrato; tratam-se na fixture)

- 4 serviços sem código TUSS — ficam `BLOQUEADO` até receber código.
- Células com "NÃO", "-" e 0 (ex.: ECO-Stress/Salvus = 0) — zero real, não conversão silenciosa.
- Abas duplicadas/derivadas (Planilha1 duplicada, ECO-stress com média, Planilha3 com PROPOSTA/Média) — o catálogo consolidado resolve.

## Verificação

- **PASSOU:** decisões 1–4 do champion registradas com fonte e data.
- **PENDENTE:** autorização para implementar a fixture da F1-T006 (usa este contrato).
- Nenhum dado real de paciente foi tocado — somente catálogo de serviços e pagadores.
