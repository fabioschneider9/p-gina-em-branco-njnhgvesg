/**
 * F1-T006/F1-T007 — Registro operacional de prontuário/produção (SPEC-1-002)
 *
 * F1-T006: criação de registro válido com dimensões mínimas, auditoria e versão.
 * F1-T007: bloqueios (ausência/ambiguidade/status desconhecido), bordas
 * (condicionais nulos, status antigo preservado), rejeição de conteúdo clínico
 * e correção por nova versão — inclusive de registro bloqueado.
 *
 * Fonte: SPEC-1-002 e contrato F1-FIELDS-BASELINE da F1-T005 (catálogo próprio
 * por clínica, guide_number + record_id, retenção permanente, TUSS opcional).
 */

import { catalogPayers, isServiceOffered } from './service-catalog'
import { rlsFixture, type SyntheticUser } from './rls-fixture'

/** Status de origem preservado — o sistema não reinterpreta (SPEC-1-002, fluxo 3). */
export type StatusSource = 'AGENDADO' | 'ATENDIDO' | 'CANCELADO' | 'FALTOU'

/** Estado de validação do sistema (SPEC-1-002). */
export type ValidationState = 'RASCUNHO' | 'VALIDO' | 'BLOQUEADO'

/** Status conhecidos em runtime; qualquer outro valor bloqueia (F1-T007/CA-1-007). */
const KNOWN_STATUSES: readonly string[] = ['AGENDADO', 'ATENDIDO', 'CANCELADO', 'FALTOU']

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

/** Resultado de uma operação de criação ou correção (F1-T007). */
export type RecordOperationResult = {
  record: OperationalRecord | null
  audit: RecordAuditEvent | null
  created: boolean
  outcome: 'VALIDO' | 'BLOQUEADO' | 'CLINICAL_REJECTED' | 'SCOPE_DENIED' | 'NOTHING_TO_CREATE'
  /** Marcadores clínicos detectados quando outcome = CLINICAL_REJECTED. */
  detected?: string[]
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

/** Marcadores de conteúdo clínico (RN-1-003/D-004) — rejeitados na fronteira. */
const CLINICAL_MARKERS = ['nome do paciente', 'diagnóstico', 'laudo']

/**
 * Detecta conteúdo clínico em chaves ou valores do payload (F1-T007/CA-1-010).
 * Somente o tipo de bloqueio é reportado; o dado proibido não é persistido.
 */
export function detectClinicalContent(input: unknown): string[] {
  const detected = new Set<string>()
  const scan = (value: unknown) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      for (const marker of CLINICAL_MARKERS) {
        if (lower.includes(marker)) detected.add(marker)
      }
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase()
        for (const marker of CLINICAL_MARKERS) {
          if (lowerKey.includes(marker)) detected.add(marker)
        }
        scan(child)
      }
    }
  }
  scan(input)
  return [...detected]
}

/** Catálogo da F1-T005: serviço existe se tem vínculo de valor (RN-1-005). */
export function isServiceMapped(serviceRef: string): boolean {
  return catalogPayers.some((payer) => isServiceOffered(serviceRef, payer.payerId, 'UNIT-TEST-001'))
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
}

function isValidCompetency(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
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

  // F1-T007: status de origem desconhecido bloqueia (nunca é reinterpretado).
  if (!KNOWN_STATUSES.includes(String(input.statusSource))) {
    missingFields.push(`status_source desconhecido (${String(input.statusSource)})`)
  }

  // F1-T007: data e competência explícitas e válidas — sem inferir fuso ou período.
  if (!isValidIsoDate(input.eventDate)) {
    missingFields.push('event_date inválida (AAAA-MM-DD)')
  }
  if (!isValidCompetency(input.competency)) {
    missingFields.push('competency inválida (AAAA-MM)')
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

function isScopeCovered(
  actor: SyntheticUser,
  entityId: string,
  unitId: string,
  professionalId: string,
): boolean {
  return actor.scopes.some(
    (scope) =>
      scope.entityId === entityId &&
      scope.unitId === unitId &&
      scope.professionalId === professionalId,
  )
}

/**
 * Cria o registro versão 1. Registro com dimensões ausentes/ambíguas/status
 * desconhecido é PERSISTIDO como BLOQUEADO (com missing_fields) e fica fora da
 * saída para a central; conteúdo clínico é rejeitado sem persistir nada.
 */
export function createOperationalRecord(
  input: OperationalRecordInput,
  actor: SyntheticUser,
  now = new Date().toISOString(),
): RecordOperationResult {
  // RLS da SPEC-1-001: somente usuário com escopo coberto cria registro.
  if (!isScopeCovered(actor, input.entityId, input.unitId, input.professionalId)) {
    return { record: null, audit: null, created: false, outcome: 'SCOPE_DENIED' }
  }

  // Conteúdo clínico é rejeitado antes de qualquer persistência (CA-1-010).
  const detected = detectClinicalContent(input)
  if (detected.length > 0) {
    return { record: null, audit: null, created: false, outcome: 'CLINICAL_REJECTED', detected }
  }

  const validation = validateRecord(input)
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
    validationState: validation.state,
    missingFields: validation.missingFields,
    mappingStatus: validation.mappingStatus,
    version: 1,
    createdAt: now,
    createdBy: actor.id,
    updatedAt: now,
    updatedBy: actor.id,
  }
  return { record, audit: event, created: true, outcome: validation.state }
}

/**
 * Correção cria nova versão, relaciona a anterior e preserva o histórico
 * (CA-1-009). Aceita correção de registro VALIDO ou BLOQUEADO (F1-T007):
 * o estado da nova versão reflete a revalidação completa.
 */
export function reviseOperationalRecord(
  previous: OperationalRecord,
  changes: Partial<OperationalRecordInput>,
  actor: SyntheticUser,
  reason: string,
  now = new Date().toISOString(),
): RecordOperationResult {
  if (previous.validationState !== 'VALIDO' && previous.validationState !== 'BLOQUEADO') {
    return { record: null, audit: null, created: false, outcome: 'NOTHING_TO_CREATE' }
  }
  if (!isScopeCovered(actor, previous.entityId, previous.unitId, previous.professionalId)) {
    return { record: null, audit: null, created: false, outcome: 'SCOPE_DENIED' }
  }

  const detected = detectClinicalContent(changes)
  if (detected.length > 0) {
    return { record: null, audit: null, created: false, outcome: 'CLINICAL_REJECTED', detected }
  }

  const merged = { ...previous, ...changes } as OperationalRecordInput
  const validation = validateRecord(merged)
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
    validationState: validation.state,
    missingFields: validation.missingFields,
    mappingStatus: validation.mappingStatus,
    version: previous.version + 1,
    createdAt: previous.createdAt,
    createdBy: previous.createdBy,
    updatedAt: now,
    updatedBy: actor.id,
  }
  return { record, audit: event, created: true, outcome: validation.state }
}

/**
 * Elegibilidade para o contrato de saída (SPEC-1-003 / F1-T008): somente
 * registro VALIDO segue para a central; BLOQUEADO permanece fora.
 */
export function isEligibleForCentral(record: OperationalRecord): boolean {
  return record.validationState === 'VALIDO'
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

/** Fixtures da F1-T007 (TDD da SPEC): RED, bordas e privacidade. */
export const f1t007Fixtures = {
  /**
   * RED — ausência de unit_id, serviço ambíguo (sem vínculo no catálogo) e
   * status desconhecido: não pode ficar VALIDO nem seguir para a central.
   */
  invalid: {
    recordId: 'F1-INVALID-001',
    entityId: rlsFixture.entity.id,
    unitId: '',
    professionalId: rlsFixture.professional.id,
    serviceRef: 'Serviço sem vínculo no catálogo',
    eventDate: '2026-09-15',
    competency: '2026-09',
    statusSource: 'STATUS_NOVO' as unknown as StatusSource,
    responsibleUserId: 'PROF-USER-001',
    evidenceRef: 'EVID-TEST-002',
    quantity: null,
    unitValue: null,
    grossValue: null,
  },
  /** EDGE-001: condicionais ausentes permanecem nulos — nunca convertidos em zero. */
  edgeNull: {
    recordId: 'F1-EDGE-001',
    entityId: rlsFixture.entity.id,
    unitId: rlsFixture.unit.id,
    professionalId: rlsFixture.professional.id,
    serviceRef: 'ECG',
    eventDate: '2026-09-20',
    competency: '2026-09',
    statusSource: 'ATENDIDO' as const,
    responsibleUserId: 'PROF-USER-001',
    evidenceRef: 'EVID-TEST-003',
    quantity: null,
    unitValue: null,
    grossValue: null,
  },
  /** EDGE-002: AGENDADO após a data do atendimento — status preservado, não convertido. */
  edgeLate: {
    recordId: 'F1-EDGE-002',
    entityId: rlsFixture.entity.id,
    unitId: rlsFixture.unit.id,
    professionalId: rlsFixture.professional.id,
    serviceRef: 'Consulta',
    eventDate: '2026-09-15',
    competency: '2026-09',
    statusSource: 'AGENDADO' as const,
    responsibleUserId: 'PROF-USER-001',
    evidenceRef: 'EVID-TEST-004',
    quantity: null,
    unitValue: null,
    grossValue: null,
  },
  /** EDGE-003: payload com conteúdo clínico — rejeitado e nada persistido. */
  edgeClinical: {
    recordId: 'F1-EDGE-003',
    entityId: rlsFixture.entity.id,
    unitId: rlsFixture.unit.id,
    professionalId: rlsFixture.professional.id,
    serviceRef: 'ECG',
    eventDate: '2026-09-21',
    competency: '2026-09',
    statusSource: 'ATENDIDO' as const,
    responsibleUserId: 'PROF-USER-001',
    evidenceRef: 'EVID-TEST-005',
    'nome do paciente': 'Paciente Sintético Z',
  } as unknown as OperationalRecordInput,
}
