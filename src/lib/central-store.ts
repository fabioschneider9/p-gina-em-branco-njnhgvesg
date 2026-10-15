/**
 * F2-T002 — SPEC-2-001: persistência durável do ciclo na central (PocketBase).
 *
 * Fluxo da SPEC (itens 2–6): staging do lote → validação total → persistência
 * atômica (lote + itens + registro de idempotência) → visibilidade só após
 * confirmação → consulta com origem/versão e nulls preservados.
 *
 * Rejeições estruturadas (RN-2-002/RN-2-003/RN-2-004):
 *  - DUPLICADO: mesma chave + mesmo conteúdo → devolve a emissão persistida.
 *  - CONFLITO_IDEMPOTENCIA: mesma chave + conteúdo divergente → rejeita, zero sobrescrita.
 *  - LOTE_INCOMPLETO: nenhum item validado → nada é persistido.
 *
 * Não calcula repasse, não reinterpreta status e não converte null em zero.
 */

import pb from './pocketbase/client'
import { getErrorMessage } from './pocketbase/errors'
import type { ProductionEnvelopeV1 } from './operational-record'

/** Estado do lote na central (SPEC-2-001, fluxo item 5). */
export type LotState = 'STAGING' | 'CONFIRMADO' | 'REVERTIDO'

/** Origem declarada do ciclo (SPEC-2-001, tabela de dados). */
export type SourceKind = 'PRODUCTION_API' | 'PDF_FALLBACK'

/** Lote na central — espelha a collection f2_lots. */
export type CentralLot = {
  id: string
  lot_id: string
  state: LotState
  source_kind: SourceKind
  source_ref: string
  source_version: number
  source_hash: string
  entity_id: string
  unit_id: string
  professional_id: string
  competency: string
  evidence_ref: string
  contract_version: string
  item_count: number
  actor_id: string
  created: string
  updated: string
}

/** Emissão na central — espelha a collection f2_idempotency. */
export type CentralEmission = {
  id: string
  idempotency_key: string
  lot_id: string
  contract_version: string
  envelope: ProductionEnvelopeV1
  record_id: string
  source_version: number
  entity_id: string
  unit_id: string
  professional_id: string
  competency: string
  actor_id: string
  created: string
}

/** Resultado da importação de um lote (RN-2-002/RN-2-003). */
export type ImportResult =
  | { outcome: 'CONFIRMADO'; lot: CentralLot; emissions: CentralEmission[] }
  | { outcome: 'DUPLICADO'; lot: CentralLot; emissions: CentralEmission[] }
  | {
      outcome: 'REJEITADO'
      code: 'CONFLITO_IDEMPOTENCIA' | 'LOTE_INCOMPLETO' | 'ERRO_PERSISTENCIA'
      detail: string
    }

/** Consulta da central — somente lotes confirmados (barreira de leitura). */
export async function listConfirmedLots(): Promise<CentralLot[]> {
  const records = await pb.collection('f2_lots').getFullList({
    filter: "state = 'CONFIRMADO' || state = 'REVERTIDO'",
    sort: '-created',
  })
  return records as unknown as CentralLot[]
}

/** Consulta as emissões de um lote confirmado (envelope íntegro, nulls preservados). */
export async function listEmissionsByLot(lotId: string): Promise<CentralEmission[]> {
  const records = await pb.collection('f2_idempotency').getFullList({
    filter: `lot_id = "${lotId}"`,
    sort: 'created',
  })
  return records.map((r) => ({
    ...(r as unknown as CentralEmission),
    // json field: SDK já desserializa; garantia extra de que nulls permanecem null.
    envelope: r.envelope as ProductionEnvelopeV1,
  }))
}

/**
 * Importa um lote: grava staging, valida o conteúdo integralmente e confirma
 * com emissões + idempotência. Se qualquer emissão já existir com a mesma
 * chave, compara o conteúdo: idêntico → DUPLICADO (devolve o persistido);
 * divergente → CONFLITO_IDEMPOTENCIA sem sobrescrita.
 */
export async function importLot(input: {
  lotId: string
  sourceKind: SourceKind
  sourceRef: string
  sourceVersion: number
  sourceHash: string
  envelopes: ProductionEnvelopeV1[]
  actorId: string
}): Promise<ImportResult> {
  const { lotId, sourceKind, sourceRef, sourceVersion, sourceHash, envelopes, actorId } = input

  // RN-2-004: lote sem itens validados não é confirmado — nada é persistido.
  if (envelopes.length === 0) {
    return {
      outcome: 'REJEITADO',
      code: 'LOTE_INCOMPLETO',
      detail: 'nenhum envelope elegível no lote — nada persistido (RN-2-004)',
    }
  }

  // Identidade: todas as emissões do lote devem compartilhar a mesma identidade
  // (entidade/unidade/profissional) — identidade ambígua vira exceção (RN-2-004).
  const identity = envelopes[0]
  const sameIdentity = envelopes.every(
    (e) =>
      e.entity_id === identity.entity_id &&
      e.unit_id === identity.unit_id &&
      e.professional_id === identity.professional_id,
  )
  if (!sameIdentity) {
    return {
      outcome: 'REJEITADO',
      code: 'CONFLITO_IDEMPOTENCIA',
      detail:
        'identidade ambígua no lote (entidade/unidade/profissional divergentes) — nada persistido (RN-2-004)',
    }
  }

  const competency = identity.competency
  const evidenceRef = identity.source.evidence_ref

  try {
    // 1) Idempotência consultada ANTES de gravar: mesma chave já existente?
    //    (a unicidade real é garantida pelo índice único no servidor).
    const existingByLot = await pb.collection('f2_lots').getFullList({
      filter: `lot_id = "${lotId}"`,
    })
    if (existingByLot.length > 0) {
      // Lote já importado: comparar conteúdo das emissões.
      const existingLot = existingByLot[0] as unknown as CentralLot
      const existingEmissions = await listEmissionsByLot(existingLot.id)
      const sameContent =
        existingEmissions.length === envelopes.length &&
        envelopes.every((env) => {
          const match = existingEmissions.find((em) => em.idempotency_key === env.idempotency_key)
          return match !== undefined && JSON.stringify(match.envelope) === JSON.stringify(env)
        })
      if (sameContent) {
        return { outcome: 'DUPLICADO', lot: existingLot, emissions: existingEmissions }
      }
      return {
        outcome: 'REJEITADO',
        code: 'CONFLITO_IDEMPOTENCIA',
        detail: `mesma chave com conteúdo divergente — original preservado (RN-2-003)`,
      }
    }

    // 2) Cria o lote em STAGING (invisível para consulta — barreira de leitura).
    const lotRecord = await pb.collection('f2_lots').create({
      lot_id: lotId,
      state: 'STAGING',
      source_kind: sourceKind,
      source_ref: sourceRef,
      source_version: sourceVersion,
      source_hash: sourceHash,
      entity_id: identity.entity_id,
      unit_id: identity.unit_id,
      professional_id: identity.professional_id,
      competency,
      evidence_ref: evidenceRef,
      contract_version: identity.contract_version,
      item_count: envelopes.length,
      actor_id: actorId,
    })

    // 3) Persiste as emissões (envelope íntegro + idempotência no servidor).
    const emissions: CentralEmission[] = []
    try {
      for (const env of envelopes) {
        const rec = await pb.collection('f2_idempotency').create({
          idempotency_key: env.idempotency_key,
          lot_id: lotId,
          contract_version: env.contract_version,
          envelope: env,
          record_id: env.record_id,
          source_version: env.source.version,
          entity_id: env.entity_id,
          unit_id: env.unit_id,
          professional_id: env.professional_id,
          competency: env.competency,
          actor_id: actorId,
        })
        emissions.push(rec as unknown as CentralEmission)
      }

      // 4) Confirma o lote — só agora ele se torna visível (barreira de leitura).
      //    Se a confirmação falhar, o lote fica em STAGING (invisível) e pode
      //    ser reprocessado com a mesma chave (retry seguro, fluxo item 6).
      const confirmed = await pb.collection('f2_lots').update(lotRecord.id, { state: 'CONFIRMADO' })
      const lot = confirmed as unknown as CentralLot
      return { outcome: 'CONFIRMADO', lot, emissions }
    } catch (emissionError) {
      // Falha no meio do lote: nenhum parcial visível. O lote fica em STAGING
      // (invisível) — retry seguro com a mesma chave (SPEC fluxo 6).
      // Observação: a limpeza definitiva do staging é da F2-T004 (rollback).
      console.warn(
        '[F2-T002] falha na persistência das emissões — lote permanece em STAGING (invisível)',
        emissionError,
      )
      throw emissionError
    }
  } catch (error) {
    // Erro de unicidade do servidor (chave já emitida por outra chamada) ou
    // qualquer falha de rede/persistência: rejeição estruturada, zero sobrescrita.
    const message = getErrorMessage(error)
    if (/unique|UNIQUE/i.test(message)) {
      return {
        outcome: 'REJEITADO',
        code: 'CONFLITO_IDEMPOTENCIA',
        detail: `chave já emitida no servidor — original preservado (RN-2-003): ${message}`,
      }
    }
    return {
      outcome: 'REJEITADO',
      code: 'ERRO_PERSISTENCIA',
      detail: message,
    }
  }
}
