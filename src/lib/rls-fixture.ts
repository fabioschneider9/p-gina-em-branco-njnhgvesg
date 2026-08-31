export type Scope = {
  entityId: string
  unitId: string
  professionalId: string
}

export type SyntheticUser = {
  id: string
  label: string
  role: 'professional' | 'finance'
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
  ],
} satisfies {
  entity: { id: string; label: string }
  unit: { id: string; label: string }
  professional: { id: string; label: string }
  record: SyntheticRecord
  users: SyntheticUser[]
}

/** RN-1-001: all three dimensions must be covered by the user's scope. */
export function canReadRecord(user: SyntheticUser, record: SyntheticRecord) {
  return user.scopes.some(
    (scope) =>
      scope.entityId === record.entityId &&
      scope.unitId === record.unitId &&
      scope.professionalId === record.professionalId,
  )
}

export function getScopeSummary(user: SyntheticUser) {
  const scope = user.scopes[0]
  return scope
    ? `${scope.entityId} / ${scope.unitId} / ${scope.professionalId}`
    : 'Nenhum escopo atribuído'
}
