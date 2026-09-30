/**
 * F1-T006 — Criar registro operacional válido (SPEC-1-002)
 * Recorte mínimo: criação de um registro operacional sintético com as dimensões
 * mínimas da SPEC-1-002, validação VALIDO/BLOQUEADO, auditoria e versionamento.
 *
 * Bloqueios/bordas/versionamento completo e entrega ao contrato de saída são
 * F1-T007 e F1-T008 — não implementados aqui.
 *
 * Fonte: SPEC-1-002 (registro operacional de prontuário/produção) e contrato
 * F1-FIELDS-BASELINE fechado na F1-T005 (catálogo próprio por clínica,
 * guide_number + record_id, retenção permanente, TUSS opcional).
 */

import { catalogPayers, isServiceOffered } from './service-catalog'
import { rlsFixture, type SyntheticUser } from './rls-fixture'

/** Status de origem preservado — o sistema não reinterpreta (SPEC-1-002, fluxo 3). */
export type StatusSource = 'AGENDADO' | 'ATENDIDO' | 'CANCELADO' | 'FALTOU'

/** Estado de validação do sistema (SPEC-1-002). */
export type ValidationState = 'RASCUNHO' | 'VALIDO' | 'BLOQUEADO'

/** Dimensões mínimas do registro operacional (SPEC-1-002, tabela de campos lógicos). */
export type OperationalRecordInput = {
  recordId: string
  entityId: string
  unitId: string
  professionalId: string
  serviceRef: string
  eventDate: string
  competency: string
  statusSource: StatusSource
  responsibleUserId: string
  evidenceRef: string
  /** Condicionais: nulos quando não disponíveis — nunca convertidos em zero (CA-1-008). */
  quantity?: number | null
  unitValue?: number | null
  grossValue?: number | null
}

/** Registro versionado e auditado (SPEC-1-002). */
export type OperationalRecord = OperationalRecordInput & {
  validationState: ValidationState
  missingFields: string[]
  mappingStatus: 'MAPEADO' | 'NAO_MAPEADO'
  version: number
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

/** Evento de auditoria do registro (append-only). */
export type RecordAuditEvent = {
  eventId: string
  actorId: string
  action: 'RECORD_CREATED' | 'RECORD_REVISED'
  recordId: string
  version: number
  reason?: string
  occurredAt: string
}

/** Resultado de validação das dimensões mínimas. */
export type RecordValidation =
  | {
      state: 'VALIDO'
      missingFields: []
      mappingStatus: 'MAPEADO'
    }
  | {
      state: 'BLOQUEADO'
      missingFields: string[]
      mappingStatus: 'MAPEADO' | 'NAO_MAPEADO'
    }

const REQUIRED_FIELDS: Array<{ key: keyof OperationalRecordInput; label: string }> = [
  { key: 'recordId', label: 'record_id' },
  { key: 'entityId', label: 'entity_id' },
  { key: 'unitId', label: 'unit_id' },
  { key: 'professionalId', label: 'professional_id' },
  { key: 'serviceRef', label: 'service_ref' },
  { key: 'eventDate', label: 'event_date' },
  { key: 'competency', label: 'competency' },
  { key: 'statusSource', label: 'status_source' },
  { key: 'responsibleUserId', label: 'responsible_user_id' },
  { key: 'evidenceRef', label: 'evidence_ref' },
]

/** Catálogo da F1-T005: serviço existe se tem vínculo de valor (RN-1-005). */
export function isServiceMapped(serviceRef: string): boolean {
  return catalogPayers.some((payer) => isServiceOffered(serviceRef, payer.payerId, 'UNIT-TEST-001'))
}

/** Valida as dimensões mínimas sem reinterpretar status nem preencher vazio com zero. */
export function validateRecord(input: OperationalRecordInput): RecordValidation {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = input[field.key]
    return value === undefined || value === null || value === ''
  }).map((field) => field.label)

  // Identidade: entidade, unidade e profissional devem coincidir com a fixture da F1-T002.
  const identityOk =
    input.entityId === rlsFixture.entity.id &&
    input.unitId === rlsFixture.unit.id &&
    input.professionalId === rlsFixture.professional.id

  if (!identityOk) {
    missingFields.push('identidade (entidade/unidade/profissional) não confirmada')
  }

  // Serviço deve estar mapeado no catálogo da F1-T005 (RN-1-005/RN-1-006).
  const mapped = isServiceMapped(input.serviceRef)
  if (!mapped) {
    missingFields.push('service_ref não mapeado no catálogo da clínica')
  }

  if (missingFields.length > 0) {
    return { state: 'BLOQUEADO', missingFields, mappingStatus: mapped ? 'MAPEADO' : 'NAO_MAPEADO' }
  }
  return { state: 'VALIDO', missingFields: [], mappingStatus: 'MAPEADO' }
}

let auditSequence = 0

function nextAuditEventId(): string {
  auditSequence += 1
  return `REC-EVT-${String(auditSequence).padStart(4, '0')}`
}

/** Cria o registro versão 1 com auditoria; falha de auditoria impede a gravação (SPEC-1-002). */
export function createOperationalRecord(
  input: OperationalRecordInput,
  actor: SyntheticUser,
  now = new Date().toISOString(),
): { record: OperationalRecord | null; audit: RecordAuditEvent | null; created: boolean } {
  // RLS da SPEC-1-001: somente usuário com escopo coberto cria registro.
  const scopeCovered = actor.scopes.some(
    (scope) =>
      scope.entityId === input.entityId &&
      scope.unitId === input.unitId &&
      scope.professionalId === input.professionalId,
  )
  if (!scopeCovered) {
    return { record: null, audit: null, created: false }
  }

  const validation = validateRecord(input)
  if (validation.state === 'BLOQUEADO') {
    // Registro incompleto não vira produção válida (SPEC-1-002, fluxo 4).
    return { record: null, audit: null, created: false }
  }

  const event: RecordAuditEvent = {
    eventId: nextAuditEventId(),
    actorId: actor.id,
    action: 'RECORD_CREATED',
    recordId: input.recordId,
    version: 1,
    occurredAt: now,
  }
  const record: OperationalRecord = {
    ...input,
    validationState: 'VALIDO',
    missingFields: [],
    mappingStatus: 'MAPEADO',
    version: 1,
    createdAt: now,
    createdBy: actor.id,
    updatedAt: now,
    updatedBy: actor.id,
  }
  return { record, audit: event, created: true }
}

/**
 * Correção cria nova versão, relaciona a anterior e preserva o histórico (CA-1-009).
 * Recorte F1-T006: disponível para a demonstração do registro válido; o exercício
 * completo de bloqueios/bordas é F1-T007.
 */
export function reviseOperationalRecord(
  previous: OperationalRecord,
  changes: Partial<OperationalRecordInput>,
  actor: SyntheticUser,
  reason: string,
  now = new Date().toISOString(),
): { record: OperationalRecord | null; audit: RecordAuditEvent | null; created: boolean } {
  if (previous.validationState !== 'VALIDO') {
    return { record: null, audit: null, created: false }
  }
  const scopeCovered = actor.scopes.some(
    (scope) =>
      scope.entityId === previous.entityId &&
      scope.unitId === previous.unitId &&
      scope.professionalId === previous.professionalId,
  )
  if (!scopeCovered) {
    return { record: null, audit: null, created: false }
  }
  const merged: OperationalRecordInput = { ...previous, ...changes }
  const validation = validateRecord(merged)
  if (validation.state === 'BLOQUEADO') {
    return { record: null, audit: null, created: false }
  }
  const event: RecordAuditEvent = {
    eventId: nextAuditEventId(),
    actorId: actor.id,
    action: 'RECORD_REVISED',
    recordId: previous.recordId,
    version: previous.version + 1,
    reason,
    occurredAt: now,
  }
  const record: OperationalRecord = {
    ...merged,
    validationState: 'VALIDO',
    missingFields: [],
    mappingStatus: 'MAPEADO',
    version: previous.version + 1,
    createdAt: previous.createdAt,
    createdBy: previous.createdBy,
    updatedAt: now,
    updatedBy: actor.id,
  }
  return { record, audit: event, created: true }
}

/** Fixtures da SPEC-1-002 (TDD): sem dados pessoais reais. */
export const recordFixtures = {
  /** Cenário principal (GREEN): todas as dimensões mínimas presentes. */
  valid: {
    recordId: 'F1-VALID-001',
    entityId: rlsFixture.entity.id,
    unitId: rlsFixture.unit.id,
    professionalId: rlsFixture.professional.id,
    serviceRef: 'ECG',
    eventDate: '2026-09-15',
    competency: '2026-09',
    statusSource: 'ATENDIDO' as const,
    responsibleUserId: 'PROF-USER-001',
    evidenceRef: 'EVID-TEST-001',
    quantity: 1,
    unitValue: null,
    grossValue: null,
  },
}
