export type Scope = {
  entityId: string
  unitId: string
  professionalId: string
}

export type SyntheticUser = {
  id: string
  label: string
  role: 'professional' | 'finance' | 'admin'
  scopes: Scope[]
}

export type SyntheticRecord = {
  id: string
  entityId: string
  unitId: string
  professionalId: string
  status: 'VALIDO'
  version: number
}

/** Resultado de autorização sem vazar conteúdo do registro (CA-1-002). */
export type AccessDecision =
  | { granted: true; reason: 'SCOPE_COVERED' }
  | { granted: false; reason: 'NO_ENTITY' | 'NO_UNIT' | 'NO_PROFESSIONAL' | 'NO_SCOPE' }

/** Payload de entrada validado antes de qualquer persistência (RN-1-003). */
export type IncomingPayload = {
  administrative?: Record<string, unknown>
  clinical?: never
}

export type PayloadValidation =
  | { valid: true; payload: IncomingPayload }
  | { valid: false; reason: 'CLINICAL_CONTENT'; detected: string[]; persisted: false }

/** Versão imutável de uma política de escopo (antes/depois de cada alteração). */
export type PolicyVersion = {
  version: number
  scopes: Scope[]
  createdAt: string
}

/** Evento de auditoria (RN-1-004): append-only, nunca é removido pelo rollback. */
export type AuditEvent = {
  eventId: string
  actorId: string
  action: 'SCOPE_CHANGE' | 'SCOPE_ROLLBACK' | 'SCOPE_CHANGE_DENIED'
  targetUserId: string
  beforeVersion: number
  afterVersion: number
  result: 'ALLOWED' | 'DENIED'
  occurredAt: string
}

/** Política versionada de um usuário, com trilha de auditoria. */
export type ScopePolicy = {
  userId: string
  versions: PolicyVersion[]
  audit: AuditEvent[]
}

export const rlsFixture = {
  entity: { id: 'ENTITY-TEST-001', label: 'Qualivida (entidade de teste)' },
  unit: { id: 'UNIT-TEST-001', label: 'Unidade de teste 001' },
  professional: { id: 'PROF-TEST-001', label: 'Profissional de teste 001' },
  record: {
    id: 'RECORD-TEST-001',
    entityId: 'ENTITY-TEST-001',
    unitId: 'UNIT-TEST-001',
    professionalId: 'PROF-TEST-001',
    status: 'VALIDO' as const,
    version: 1,
  },
  users: [
    {
      id: 'PROF-USER-001',
      label: 'Profissional autorizado',
      role: 'professional' as const,
      scopes: [
        {
          entityId: 'ENTITY-TEST-001',
          unitId: 'UNIT-TEST-001',
          professionalId: 'PROF-TEST-001',
        },
      ],
    },
    {
      id: 'FIN-USER-001',
      label: 'Responsável financeiro (escopo de consulta)',
      role: 'finance' as const,
      scopes: [],
    },
    {
      id: 'USER-NO-ENTITY',
      label: 'Usuário sem entidade',
      role: 'professional' as const,
      scopes: [
        {
          entityId: 'ENTITY-TEST-999',
          unitId: 'UNIT-TEST-001',
          professionalId: 'PROF-TEST-001',
        },
      ],
    },
    {
      id: 'USER-NO-UNIT',
      label: 'Usuário sem unidade',
      role: 'professional' as const,
      scopes: [
        {
          entityId: 'ENTITY-TEST-001',
          unitId: 'UNIT-TEST-999',
          professionalId: 'PROF-TEST-001',
        },
      ],
    },
    {
      id: 'USER-NO-PROF',
      label: 'Usuário sem profissional',
      role: 'professional' as const,
      scopes: [
        {
          entityId: 'ENTITY-TEST-001',
          unitId: 'UNIT-TEST-001',
          professionalId: 'PROF-TEST-999',
        },
      ],
    },
    {
      id: 'ADMIN-USER-001',
      label: 'Administrador autorizado',
      role: 'admin' as const,
      scopes: [
        {
          entityId: 'ENTITY-TEST-001',
          unitId: 'UNIT-TEST-001',
          professionalId: 'PROF-TEST-001',
        },
      ],
    },
  ],
} satisfies {
  entity: { id: string; label: string }
  unit: { id: string; label: string }
  professional: { id: string; label: string }
  record: SyntheticRecord
  users: SyntheticUser[]
}

/** RN-1-001: as três dimensões precisam coincidir; ausência de qualquer uma nega sem vazar payload. */
export function authorizeRecordRead(user: SyntheticUser, record: SyntheticRecord): AccessDecision {
  if (user.scopes.length === 0) {
    return { granted: false, reason: 'NO_SCOPE' }
  }
  const covering = user.scopes.some(
    (scope) =>
      scope.entityId === record.entityId &&
      scope.unitId === record.unitId &&
      scope.professionalId === record.professionalId,
  )
  if (covering) {
    return { granted: true, reason: 'SCOPE_COVERED' }
  }
  // Razão mais específica para orientar o operador, sem revelar o conteúdo do registro.
  const hasEntity = user.scopes.some((scope) => scope.entityId === record.entityId)
  const hasUnit = user.scopes.some((scope) => scope.unitId === record.unitId)
  const hasProfessional = user.scopes.some(
    (scope) => scope.professionalId === record.professionalId,
  )
  if (!hasEntity) {
    return { granted: false, reason: 'NO_ENTITY' }
  }
  if (!hasUnit) {
    return { granted: false, reason: 'NO_UNIT' }
  }
  return { granted: false, reason: 'NO_PROFESSIONAL' }
}

/** Alias de compatibilidade com a tela RLS-ALLOW da F1-T002. */
export function canReadRecord(user: SyntheticUser, record: SyntheticRecord) {
  return authorizeRecordRead(user, record).granted
}

export function getScopeSummary(user: SyntheticUser) {
  const scope = user.scopes[0]
  return scope
    ? `${scope.entityId} / ${scope.unitId} / ${scope.professionalId}`
    : 'Nenhum escopo atribuído'
}

/**
 * RN-1-003 / CA-1-004: rejeita payload com conteúdo clínico (nome de paciente,
 * diagnóstico ou laudo) e NÃO persiste nada. Apenas campos administrativos passam.
 */
export function validatePayload(input: unknown): PayloadValidation {
  const clinicalMarkers = ['nome do paciente', 'diagnóstico', 'laudo']
  const detected = clinicalMarkers.filter((marker) => {
    if (typeof input === 'string') {
      return input.toLowerCase().includes(marker)
    }
    if (input && typeof input === 'object') {
      return Object.keys(input as Record<string, unknown>).some((key) =>
        key.toLowerCase().includes(marker),
      )
    }
    return false
  })
  if (detected.length > 0) {
    return { valid: false, reason: 'CLINICAL_CONTENT', detected, persisted: false }
  }
  const administrative = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >
  return { valid: true, payload: { administrative } }
}

/** Cenários de negação exigidos pela F1-T003: ENTITY, UNIT e PROF. */
export const denialScenarios = [
  {
    id: 'RLS-ENTITY-DENY',
    label: 'Sem entidade',
    userId: 'USER-NO-ENTITY',
    expected: { granted: false as const, reason: 'NO_ENTITY' as const },
  },
  {
    id: 'RLS-UNIT-DENY',
    label: 'Sem unidade',
    userId: 'USER-NO-UNIT',
    expected: { granted: false as const, reason: 'NO_UNIT' as const },
  },
  {
    id: 'RLS-PROF-DENY',
    label: 'Sem profissional',
    userId: 'USER-NO-PROF',
    expected: { granted: false as const, reason: 'NO_PROFESSIONAL' as const },
  },
]

/** Exemplos rejeitados pela RN-1-003, usados na demonstração de privacidade. */
export const privacySamples = {
  clinical: {
    'nome do paciente': 'Paciente Sintético A',
    diagnóstico: 'CID Z00 (exemplo)',
    laudo: 'Laudo hipotético sem valor clínico',
  },
  administrative: {
    'número do procedimento': 'PROC-0001',
    quantidade: 1,
    competência: '2026-08',
  },
}

/**
 * Cria a política inicial (versão 1) de um usuário, com auditoria vazia.
 * Usada para demonstrar versionamento e rollback sem tocar em dados reais.
 */
export function createScopePolicy(
  userId: string,
  scopes: Scope[],
  now = new Date().toISOString(),
): ScopePolicy {
  return {
    userId,
    versions: [{ version: 1, scopes: [...scopes], createdAt: now }],
    audit: [],
  }
}

let eventSequence = 0

function nextEventId(prefix: string) {
  eventSequence += 1
  return `${prefix}-${String(eventSequence).padStart(4, '0')}`
}

/**
 * RN-1-002 / RN-1-004: somente administrador altera política de acesso.
 * A alteração cria uma nova versão (before -> after) e um evento de auditoria.
 * Nenhum payload clínico é aceito na fronteira.
 */
export function applyScopeChange(
  policy: ScopePolicy,
  actor: SyntheticUser,
  newScopes: Scope[],
  now = new Date().toISOString(),
): { policy: ScopePolicy; event: AuditEvent; allowed: boolean } {
  if (actor.role !== 'admin') {
    const deniedEvent: AuditEvent = {
      eventId: nextEventId('EVT'),
      actorId: actor.id,
      action: 'SCOPE_CHANGE_DENIED',
      targetUserId: policy.userId,
      beforeVersion: policy.versions[policy.versions.length - 1].version,
      afterVersion: policy.versions[policy.versions.length - 1].version,
      result: 'DENIED',
      occurredAt: now,
    }
    return { policy, event: deniedEvent, allowed: false }
  }
  const current = policy.versions[policy.versions.length - 1]
  const nextVersion = current.version + 1
  const version: PolicyVersion = {
    version: nextVersion,
    scopes: [...newScopes],
    createdAt: now,
  }
  const event: AuditEvent = {
    eventId: nextEventId('EVT'),
    actorId: actor.id,
    action: 'SCOPE_CHANGE',
    targetUserId: policy.userId,
    beforeVersion: current.version,
    afterVersion: nextVersion,
    result: 'ALLOWED',
    occurredAt: now,
  }
  return {
    policy: {
      userId: policy.userId,
      versions: [...policy.versions, version],
      audit: [...policy.audit, event],
    },
    event,
    allowed: true,
  }
}

/**
 * RN-1-004: rollback restaura a versão anterior da política, mas a auditoria
 * é append-only (nunca removida). Retorna a política restaurada e o evento novo.
 */
export function rollbackScopeChange(
  policy: ScopePolicy,
  actor: SyntheticUser,
  toVersion: number,
  now = new Date().toISOString(),
): { policy: ScopePolicy; event: AuditEvent; allowed: boolean } {
  if (actor.role !== 'admin') {
    const deniedEvent: AuditEvent = {
      eventId: nextEventId('EVT'),
      actorId: actor.id,
      action: 'SCOPE_CHANGE_DENIED',
      targetUserId: policy.userId,
      beforeVersion: policy.versions[policy.versions.length - 1].version,
      afterVersion: policy.versions[policy.versions.length - 1].version,
      result: 'DENIED',
      occurredAt: now,
    }
    return { policy, event: deniedEvent, allowed: false }
  }
  const current = policy.versions[policy.versions.length - 1]
  const target = policy.versions.find((v) => v.version === toVersion)
  if (!target || target.version === current.version) {
    // Rollback inválido: mesma versão ou inexistente — auditoria registra a negação, política intacta.
    const deniedEvent: AuditEvent = {
      eventId: nextEventId('EVT'),
      actorId: actor.id,
      action: 'SCOPE_CHANGE_DENIED',
      targetUserId: policy.userId,
      beforeVersion: current.version,
      afterVersion: current.version,
      result: 'DENIED',
      occurredAt: now,
    }
    return { policy, event: deniedEvent, allowed: false }
  }
  const nextVersion = current.version + 1
  const restored: PolicyVersion = {
    version: nextVersion,
    scopes: [...target.scopes],
    createdAt: now,
  }
  const event: AuditEvent = {
    eventId: nextEventId('EVT'),
    actorId: actor.id,
    action: 'SCOPE_ROLLBACK',
    targetUserId: policy.userId,
    beforeVersion: current.version,
    afterVersion: nextVersion,
    result: 'ALLOWED',
    occurredAt: now,
  }
  return {
    policy: {
      userId: policy.userId,
      versions: [...policy.versions, restored],
      audit: [...policy.audit, event],
    },
    event,
    allowed: true,
  }
}
