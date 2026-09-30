# Evidência F1-T005 — Qualivida (contrato de campos mínimos)

**Task:** F1-T005 — Registrar contrato de campos mínimos
**SPEC:** SPEC-1-002 — Registro operacional de prontuário/produção
**Data:** 2026-09-01
**Champion/aprovador:** Fábio Schneider — CEO, líder do projeto e único responsável
**Teste humano:** pendente

## Critério binário

Campos mínimos, identidade oficial, fronteira clínico/administrativo e retenção registrados.

## Decisões do champion (2026-09-01, 17:45 → 20:11)

| #   | Decisão                              | Resposta de Fábio                                                                                                                                                                                                | Estado |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Serviço (`service_ref`)              | **Catálogo próprio**, fonte: planilha `Valores_Qualivida.xlsx` (enviada 19:59); códigos TUSS como identificador técnico; pagadores por coluna; subtipos de rede e valores especiais (desconto, combo) reservados | ✅     |
| 2   | Identidade oficial                   | **Nº de guia individual + `record_id` técnico**                                                                                                                                                                  | ✅     |
| 3   | Retenção                             | **Para sempre**; correção somente por nova versão                                                                                                                                                                | ✅     |
| 4   | Superfície autorizada                | **Skip + GitHub + ETHOS**                                                                                                                                                                                        | ✅     |
| 5   | Célula em branco (serviço × pagador) | **Serviço não atendido** → indisponível para marcação/agendamento; disponível só com vinculação na tabela de preços                                                                                              | ✅     |
| 6   | Escopo do catálogo                   | **Por clínica/unidade** — tabela atual = Clínica Qualivida Resende/RJ (exemplo para avançar)                                                                                                                     | ✅     |
| 7   | Alteração de valores                 | **Histórico lançado não muda**; novo valor com **data de vigência** — imediata, futura programada (convênios) ou retroativa (demonstrativo de mês anterior)                                                      | ✅     |
| 8   | Código do serviço (correção 21:02)   | **Código TUSS não é obrigatório** — serviço pode não ter código ou ter código de **pacote contratualizado** com a operadora; o que define existência/agendabilidade é a **vinculação de valor** (RN-1-005)       | ✅     |

## Contrato registrado (F1-FIELDS-BASELINE)

### Identidade do registro

- `record_id` — identificador técnico interno, estável e único.
- `guide_number` — **nº de guia individual** oficial, obrigatório.

### Catálogo de serviços (`service_ref`)

- **27 serviços** — código TUSS **opcional** (decisão 8): pode não haver código ou ser código de pacote contratualizado com a operadora. Serviço existe e é agendável quando tem valor vinculado.
- **21 pagadores**: Bradesco (Emp/Ind), Mediservice, Sulamérica, GEAP, INB, Particular, Particular VR/BM, Salvus, Salutem, Saúde CAIXA, UNIMED, Golden Cross, Fusex, CASSI, Postal Saúde, Real Grandeza, Plamer, Amil, Abertta, Liv.
- Valores da planilha: **desatualizados/informativos** — não são tabela vigente; a vinculação (existência de valor) é que habilita o serviço.
- **RN-1-005:** sem vínculo → não atendido, fora da marcação/agendamento.
- **RN-1-006:** catálogo por clínica (Resende/RJ é o pacote de exemplo).
- **RN-1-007:** linha do tempo de valores com vigência imediata/futura/retroativa; histórico lançado preservado.

### Fronteira clínico/administrativo e estados

- Proibido no MVP: nome de paciente, diagnóstico, laudo, prescrição, presença.
- Estados: `RASCUNHO` / `VALIDO` / `BLOQUEADO`; status de origem preservado; valores condicionais nulos explícitos, nunca zero silencioso.

## Implementação entregue (após autorização de 20:42)

| Artefato                           | Conteúdo                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/service-catalog.ts`       | Catálogo estruturado: 27 serviços, 21 pagadores, pacote Resende/RJ com linha do tempo de valores; `isServiceOffered` (RN-1-005), `getPriceAt` (RN-1-007), `availableServices`, `isServiceBlockedByMissingCode` |
| `src/pages/Index.tsx`              | Seção "F1-T005 · Contrato de campos mínimos": regras RN-1-005/006/007 + matriz serviço × pagador com disponibilidade e vigências demonstradas (ECG/INB retroativa; Consulta/Particular futura)                 |
| `05_entregas/F1-T005-evidencia.md` | Este documento                                                                                                                                                                                                 |

## Verificação

- **PASSOU:** campos mínimos registrados (contrato + catálogo estruturado).
- **PASSOU:** identidade oficial registrada (`guide_number` + `record_id`).
- **PASSOU:** fronteira clínico/administrativo registrada (proibições do MVP).
- **PASSOU:** retenção registrada (para sempre; correção por nova versão).
- **PENDENTE:** teste humano de Fábio.

## Limites respeitados

- Nenhum dado real de paciente; somente catálogo de serviços/pagadores.
- Valores da planilha não usados como tabela vigente.
- `.skip.config.json` pré-existente não foi tocado.
