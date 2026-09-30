import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  FilePlus2,
  History,
  LockKeyhole,
  PenLine,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react'
import {
  applyScopeChange,
  authorizeRecordRead,
  createScopePolicy,
  denialScenarios,
  getScopeSummary,
  privacySamples,
  rlsFixture,
  rollbackScopeChange,
  validatePayload,
  type ScopePolicy,
  type SyntheticUser,
} from '@/lib/rls-fixture'
import {
  buildProductionEnvelope,
  createOperationalRecord,
  f1t007Fixtures,
  isEligibleForCentral,
  recordFixtures,
  reviseOperationalRecord,
  separateForContract,
  validateRecord,
  type ContractSeparation,
  type OperationalRecord,
  type ProductionEnvelopeV1,
  type RecordAuditEvent,
  type RecordOperationResult,
} from '@/lib/operational-record'
import {
  availableServices,
  catalogPayers,
  catalogServices,
  getPriceAt,
  isServiceOffered,
} from '@/lib/service-catalog'

const Index = () => {
  const [selectedUserId, setSelectedUserId] = useState(rlsFixture.users[0].id)
  const selectedUser = useMemo<SyntheticUser>(
    () => rlsFixture.users.find((user) => user.id === selectedUserId) ?? rlsFixture.users[0],
    [selectedUserId],
  )
  const access = authorizeRecordRead(selectedUser, rlsFixture.record)
  const isAllowed = access.granted
  const adminUser = useMemo<SyntheticUser>(
    () => rlsFixture.users.find((u) => u.role === 'admin') ?? rlsFixture.users[0],
    [],
  )

  // Estado da política (versionada + auditoria) para a demonstração de rollback.
  const [policy, setPolicy] = useState<ScopePolicy>(() =>
    createScopePolicy('PROF-USER-001', [
      { entityId: 'ENTITY-TEST-001', unitId: 'UNIT-TEST-001', professionalId: 'PROF-TEST-001' },
    ]),
  )
  const [auditTarget, setAuditTarget] = useState('PROF-USER-001')
  const [feedback, setFeedback] = useState<string | null>(null)

  const clinicalValidation = useMemo(() => validatePayload(privacySamples.clinical), [])
  const administrativeValidation = useMemo(() => validatePayload(privacySamples.administrative), [])

  // F1-T006 — registro operacional: estado da demonstração (cenário principal F1-VALID-001).
  const professionalUser = useMemo<SyntheticUser>(
    () => rlsFixture.users.find((u) => u.id === 'PROF-USER-001') ?? rlsFixture.users[0],
    [],
  )
  const [operationalRecord, setOperationalRecord] = useState<OperationalRecord | null>(null)
  const [recordAudit, setRecordAudit] = useState<RecordAuditEvent[]>([])
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null)
  const recordValidation = useMemo(() => validateRecord(recordFixtures.valid), [])

  const applyRecordResult = (result: RecordOperationResult) => {
    if (result.record && result.audit) {
      setOperationalRecord(result.record)
      setRecordAudit((prev) => [result.audit as RecordAuditEvent, ...prev])
      return `Registro ${result.record.recordId} registrado como ${result.record.validationState} (v${result.record.version}, evento ${result.audit.eventId})`
    }
    if (result.outcome === 'CLINICAL_REJECTED') {
      return `Conteúdo clínico rejeitado (${(result.detected ?? []).join(', ')}) — nada foi persistido.`
    }
    if (result.outcome === 'SCOPE_DENIED') {
      return 'Operação negada: usuário sem escopo coberto (RLS).'
    }
    return 'Operação não realizada.'
  }

  const handleCreateRecord = () => {
    setRecordFeedback(
      applyRecordResult(createOperationalRecord(recordFixtures.valid, professionalUser)),
    )
  }

  const handleReviseRecord = () => {
    if (!operationalRecord) {
      setRecordFeedback('Crie o registro antes de corrigir.')
      return
    }
    setRecordFeedback(
      applyRecordResult(
        reviseOperationalRecord(
          operationalRecord,
          { responsibleUserId: 'ADMIN-USER-001' },
          professionalUser,
          'Correção do responsável pela validação',
        ),
      ),
    )
  }

  // F1-T007 — cenários de bloqueio, bordas e versionamento.
  const [t007Record, setT007Record] = useState<OperationalRecord | null>(null)
  const [t007Audit, setT007Audit] = useState<RecordAuditEvent[]>([])
  const [t007Feedback, setT007Feedback] = useState<string | null>(null)

  const applyT007Result = (result: RecordOperationResult) => {
    if (result.record && result.audit) {
      setT007Record(result.record)
      setT007Audit((prev) => [result.audit as RecordAuditEvent, ...prev])
      return `Registro ${result.record.recordId}: ${result.record.validationState} (v${result.record.version}, evento ${result.audit.eventId})${result.record.missingFields.length > 0 ? ` — ausências: ${result.record.missingFields.join('; ')}` : ''}`
    }
    if (result.outcome === 'CLINICAL_REJECTED') {
      return `Conteúdo clínico rejeitado (${(result.detected ?? []).join(', ')}) — nada foi persistido.`
    }
    if (result.outcome === 'SCOPE_DENIED') {
      return 'Operação negada: usuário sem escopo coberto (RLS).'
    }
    return 'Operação não realizada.'
  }

  const runT007 = (fixture: typeof f1t007Fixtures.invalid) => {
    setT007Feedback(applyT007Result(createOperationalRecord(fixture, professionalUser)))
  }

  const fixT007Blocked = () => {
    if (!t007Record) {
      setT007Feedback('Execute um cenário de bloqueio antes de corrigir.')
      return
    }
    setT007Feedback(
      applyT007Result(
        reviseOperationalRecord(
          t007Record,
          { unitId: rlsFixture.unit.id, serviceRef: 'ECG', statusSource: 'ATENDIDO' },
          professionalUser,
          'Correção do registro pelo champion (nova versão)',
        ),
      ),
    )
  }

  // F1-T008 — separação de evidência para o contrato de saída (SPEC-1-003).
  const [t008Separation, setT008Separation] = useState<ContractSeparation | null>(null)
  const [t008Feedback, setT008Feedback] = useState<string | null>(null)

  const runT008Separation = () => {
    // Cria os três registros de prova a partir das fixtures da SPEC.
    const created: OperationalRecord[] = []
    const inputs = [recordFixtures.valid, f1t007Fixtures.blocked, f1t007Fixtures.edgeLate]
    for (const input of inputs) {
      const result = createOperationalRecord(input, professionalUser)
      if (result.record) created.push(result.record)
    }
    const separation = separateForContract(created)
    setT008Separation(separation)
    setT008Feedback(
      `Separação executada: ${separation.elegiveis.length} elegível(is) para o contrato, ${separation.excluidos.length} excluído(s) com motivo.`,
    )
  }

  // F1-T010 — geração determinística do envelope production-record.v1.
  const [t010Envelope, setT010Envelope] = useState<ProductionEnvelopeV1 | null>(null)
  const [t010Second, setT010Second] = useState<ProductionEnvelopeV1 | null>(null)
  const [t010Feedback, setT010Feedback] = useState<string | null>(null)

  const generateT010Envelope = (asSecond = false) => {
    const creation = createOperationalRecord(recordFixtures.valid, professionalUser)
    if (!creation.record) {
      setT010Feedback('Criação do registro de prova falhou — envelope não gerado.')
      return
    }
    const result = buildProductionEnvelope(creation.record)
    if (!result.ok) {
      setT010Feedback(`Envelope não gerado: ${result.detail}`)
      return
    }
    if (asSecond) {
      setT010Second(result.envelope)
      const identical = JSON.stringify(result.envelope) === JSON.stringify(t010Envelope)
      setT010Feedback(
        identical
          ? `Segunda geração idêntica à primeira — determinismo provado (mesma chave: ${result.envelope.idempotency_key}).`
          : 'Segunda geração DIFERENTE da primeira — determinismo FALHOU.',
      )
    } else {
      setT010Envelope(result.envelope)
      setT010Second(null)
      setT010Feedback(`Envelope gerado com chave: ${result.envelope.idempotency_key}`)
    }
  }

  const denialResults = denialScenarios.map((scenario) => {
    const user = rlsFixture.users.find((u) => u.id === scenario.userId)!
    const result = authorizeRecordRead(user, rlsFixture.record)
    return { scenario, result, pass: result.reason === scenario.expected.reason }
  })

  const currentVersion = policy.versions[policy.versions.length - 1]

  const handleApplyChange = () => {
    // Demonstração: concede acesso ao profissional para um novo escopo (sem dados clínicos).
    const newScopes = [
      ...currentVersion.scopes,
      { entityId: 'ENTITY-TEST-001', unitId: 'UNIT-TEST-001', professionalId: 'PROF-TEST-002' },
    ]
    const result = applyScopeChange(policy, adminUser, newScopes)
    setPolicy(result.policy)
    setFeedback(
      result.allowed
        ? `Alteração aplicada: v${result.event.beforeVersion} → v${result.event.afterVersion} (evento ${result.event.eventId})`
        : `Alteração negada por ${adminUser.id} (permissão insuficiente)`,
    )
  }

  const handleRollback = () => {
    const targetVersion = Math.max(1, currentVersion.version - 1)
    const result = rollbackScopeChange(policy, adminUser, targetVersion)
    setPolicy(result.policy)
    setFeedback(
      result.allowed
        ? `Rollback para a versão ${targetVersion}: v${result.event.beforeVersion} → v${result.event.afterVersion} (evento ${result.event.eventId})`
        : `Rollback negado (versão inválida ou permissão insuficiente)`,
    )
  }

  return (
    <div className="min-h-screen overflow-auto bg-[#f6f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123b66] text-white">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#187b8c]">
                Qualivida · Governança
              </p>
              <h1 className="text-lg font-bold">Política mínima de escopo</h1>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Fixture sintética
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold text-[#187b8c]">F1-T002 · RLS-ALLOW</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#123b66]">
            Um registro, um escopo explícito.
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            A leitura só é permitida quando entidade, unidade e profissional do usuário coincidem
            com as três dimensões do registro. Nenhum dado clínico é utilizado.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-[#123b66]">
                <Users size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold">Usuário da sessão</h3>
                <p className="text-sm text-slate-500">Selecione uma identidade sintética</p>
              </div>
            </div>
            <div className="space-y-3">
              {rlsFixture.users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#187b8c] ${selectedUserId === user.id ? 'border-[#187b8c] bg-[#effafa]' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span>
                    <span className="block font-semibold">{user.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{user.id}</span>
                  </span>
                  <ChevronRight
                    size={18}
                    className={selectedUserId === user.id ? 'text-[#187b8c]' : 'text-slate-400'}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Escopo atribuído
              </p>
              <p className="mt-2 break-words font-mono text-xs leading-5 text-slate-700">
                {getScopeSummary(selectedUser)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Registro-alvo</h3>
                <p className="text-sm text-slate-500">Dados administrativos mínimos</p>
              </div>
              <LockKeyhole size={20} className="text-slate-400" aria-hidden="true" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Entidade', rlsFixture.entity.id],
                ['Unidade', rlsFixture.unit.id],
                ['Profissional', rlsFixture.professional.id],
                ['Registro', rlsFixture.record.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div
              className={`mt-5 rounded-xl border p-5 ${isAllowed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                {isAllowed ? (
                  <CheckCircle2 size={22} className="text-emerald-600" aria-hidden="true" />
                ) : (
                  <Ban size={22} className="text-rose-600" aria-hidden="true" />
                )}
                <div>
                  <p className={`font-bold ${isAllowed ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {isAllowed ? 'Leitura permitida' : 'Leitura negada'}
                  </p>
                  <p className={`mt-1 text-sm ${isAllowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isAllowed
                      ? 'As três dimensões do escopo coincidem com o registro-alvo.'
                      : access.reason === 'NO_ENTITY'
                        ? 'O usuário não cobre a entidade do registro.'
                        : access.reason === 'NO_UNIT'
                          ? 'O usuário não cobre a unidade do registro.'
                          : access.reason === 'NO_PROFESSIONAL'
                            ? 'O usuário não cobre o profissional do registro.'
                            : 'O usuário não possui escopo atribuído.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <Ban size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800">F1-T003 · Negações e privacidade</h3>
              <p className="text-sm text-slate-500">
                Usuários sem entidade, unidade ou profissional recebem negação sem vazar o payload.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cenário</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Dimensão ausente</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Motivo (sem payload)</th>
                  <th className="px-4 py-3">Confere</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denialResults.map(({ scenario, result, pass }) => (
                  <tr key={scenario.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {scenario.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{scenario.userId}</td>
                    <td className="px-4 py-3 text-slate-700">{scenario.label}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        <EyeOff size={13} aria-hidden="true" /> DENIED
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{result.reason}</td>
                    <td className="px-4 py-3">
                      {pass ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} aria-hidden="true" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                          <TriangleAlert size={14} aria-hidden="true" /> FALHA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payload administrativo (permitido)
              </p>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                {JSON.stringify(privacySamples.administrative, null, 2)}
              </pre>
              <p
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 size={13} aria-hidden="true" />{' '}
                {administrativeValidation.valid ? 'VALIDO — pode ser persistido' : 'REJEITADO'}
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
                Payload clínico (rejeitado)
              </p>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-rose-700">
                {JSON.stringify(privacySamples.clinical, null, 2)}
              </pre>
              <p
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"
                role="status"
                aria-live="polite"
              >
                <EyeOff size={13} aria-hidden="true" /> REJEITADO — não persistido (
                {clinicalValidation.valid
                  ? 'erro inesperado'
                  : clinicalValidation.detected.join(', ')}
                )
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-[#123b66]">
              <History size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">F1-T004 · Auditoria e rollback</h3>
              <p className="text-sm text-slate-500">
                Alterações sensíveis geram versão e auditoria; rollback restaura a política anterior
                sem apagar a auditoria.
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Política atual (usuário {auditTarget})
              </p>
              <p className="break-words font-mono text-xs leading-5 text-slate-700">
                {currentVersion.scopes
                  .map((s) => `${s.entityId}/${s.unitId}/${s.professionalId}`)
                  .join('\n') || 'Nenhum escopo'}
              </p>
              <p
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 size={13} aria-hidden="true" /> Versão atual: v
                {currentVersion.version}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ações (administrador)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleApplyChange}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123b66] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f52] focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  <ArrowLeftRight size={15} aria-hidden="true" /> Aplicar alteração de escopo
                </button>
                <button
                  type="button"
                  onClick={handleRollback}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  <History size={15} aria-hidden="true" /> Rollback (v{currentVersion.version} → v
                  {Math.max(1, currentVersion.version - 1)})
                </button>
              </div>
              {feedback && (
                <p
                  className="mt-3 rounded-lg bg-white p-3 font-mono text-xs text-slate-700"
                  role="status"
                  aria-live="polite"
                >
                  {feedback}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Ator</th>
                  <th className="px-4 py-3">Alvo</th>
                  <th className="px-4 py-3">Versões (antes → depois)</th>
                  <th className="px-4 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policy.audit.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={6}>
                      Nenhum evento de auditoria ainda. Use os botões acima.
                    </td>
                  </tr>
                ) : (
                  [...policy.audit].reverse().map((event) => (
                    <tr key={event.eventId}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.eventId}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{event.action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.actorId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.targetUserId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        v{event.beforeVersion} → v{event.afterVersion}
                      </td>
                      <td className="px-4 py-3">
                        {event.result === 'ALLOWED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={13} aria-hidden="true" /> ALLOWED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                            <Ban size={13} aria-hidden="true" /> DENIED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <History size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">F1-T005 · Contrato de campos mínimos</h3>
              <p className="text-sm text-slate-500">
                Catálogo próprio por clínica — {catalogServices.length} serviços (
                {catalogServices.filter((s) => s.tuss === null).length} sem código TUSS) e{' '}
                {catalogPayers.length} pagadores. Valores da planilha são
                informativos/desatualizados.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                RN-1-005 · Vinculação
              </p>
              <p className="mt-2 text-sm text-emerald-800">
                Célula em branco = serviço <strong>não atendido</strong> para o pagador — não
                aparece para marcação/agendamento. Só fica disponível com valor vinculado.
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                RN-1-006 · Por clínica
              </p>
              <p className="mt-2 text-sm text-sky-800">
                Cada clínica tem seu pacote de valores. Esta tabela: Clínica Qualivida Resende/RJ
                (exemplo). Outras clínicas terão tabelas próprias.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                RN-1-007 · Vigência
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Valor novo não muda o histórico lançado. Vigência imediata, futura programada ou
                retroativa — sempre com autor, motivo e auditoria.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">TUSS</th>
                  <th className="px-4 py-3">Particular (vigência)</th>
                  <th className="px-4 py-3">Bradesco Emp</th>
                  <th className="px-4 py-3">Mediservice</th>
                  <th className="px-4 py-3">Disponível p/ agendar?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogServices.map((service) => {
                  const offeredParticular = isServiceOffered(
                    service.label,
                    'P-PARTICULAR',
                    'UNIT-TEST-001',
                  )
                  const priceParticular = getPriceAt(
                    service.label,
                    'P-PARTICULAR',
                    'UNIT-TEST-001',
                    '2026-12-31',
                  )
                  const offeredBradesco = isServiceOffered(
                    service.label,
                    'P-BRADESCO-EMP',
                    'UNIT-TEST-001',
                  )
                  const offeredMedi = isServiceOffered(
                    service.label,
                    'P-MEDISERVICE',
                    'UNIT-TEST-001',
                  )
                  return (
                    <tr key={service.serviceId}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {service.label}
                        {!service.tuss && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            sem código (opcional)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {service.tuss ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {offeredParticular && priceParticular ? (
                          <>
                            R$ {priceParticular.value.toFixed(2)}
                            <span className="ml-1 text-xs text-slate-400">
                              (vige {priceParticular.effectiveFrom})
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400">sem vínculo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {offeredBradesco ? (
                          <span className="text-xs font-bold text-emerald-700">OFERECIDO</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">NÃO ATENDIDO</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {offeredMedi ? (
                          <span className="text-xs font-bold text-emerald-700">OFERECIDO</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">NÃO ATENDIDO</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {offeredParticular || offeredBradesco || offeredMedi ? (
                          <span className="text-xs font-bold text-emerald-700">
                            SIM (com vínculo)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">NÃO (sem vínculo)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Demonstração RN-1-007 na linha do tempo: ECG/INB tem vigência{' '}
            <strong>retroativa</strong> (R$ 21,30 → R$ 24,50 em 2026-06-01, registrada em julho);
            Consulta/Particular tem vigência <strong>futura</strong> (R$ 150 → R$ 200 em
            2027-01-01). Registros anteriores a essas datas mantêm o valor da época.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
              <FilePlus2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">F1-T006 · Registro operacional válido</h3>
              <p className="text-sm text-slate-500">
                Fixture completa (F1-VALID-001) cria registro com dimensões mínimas, responsável,
                evidência, auditoria e versão — estado VÁLIDO.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fixture F1-VALID-001 (cenário principal)
              </p>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                {JSON.stringify(recordFixtures.valid, null, 2)}
              </pre>
              <p
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${recordValidation.state === 'VALIDO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                role="status"
                aria-live="polite"
              >
                {recordValidation.state === 'VALIDO' ? (
                  <>
                    <CheckCircle2 size={13} aria-hidden="true" /> Pré-validação: VÁLIDO
                  </>
                ) : (
                  <>
                    <TriangleAlert size={13} aria-hidden="true" /> Pré-validação:{' '}
                    {recordValidation.state}
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCreateRecord}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123b66] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f52] focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  <FilePlus2 size={15} aria-hidden="true" /> Criar registro
                </button>
                <button
                  type="button"
                  onClick={handleReviseRecord}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  <PenLine size={15} aria-hidden="true" /> Corrigir (nova versão)
                </button>
              </div>
              {recordFeedback && (
                <p
                  className="mt-3 rounded-lg bg-white p-3 font-mono text-xs text-slate-700"
                  role="status"
                  aria-live="polite"
                >
                  {recordFeedback}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registro criado (estado do sistema)
              </p>
              {operationalRecord ? (
                <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                  {JSON.stringify(operationalRecord, null, 2)}
                </pre>
              ) : (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                  Nenhum registro criado ainda. Use “Criar registro”.
                </p>
              )}
              {operationalRecord && (
                <p
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 size={13} aria-hidden="true" /> Estado: VÁLIDO · versão{' '}
                  {operationalRecord.version}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Ator</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordAudit.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={6}>
                      Nenhum evento de auditoria do registro ainda. Use os botões acima.
                    </td>
                  </tr>
                ) : (
                  recordAudit.map((event) => (
                    <tr key={event.eventId}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.eventId}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{event.action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.actorId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.recordId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        v{event.version}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.occurredAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <TriangleAlert size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">
                F1-T007 · Bloqueios, bordas e versionamento
              </h3>
              <p className="text-sm text-slate-500">
                Ausência, ambiguidade e status desconhecido bloqueiam; condicionais ficam nulos;
                status antigo é preservado; conteúdo clínico é rejeitado; correção cria nova versão.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cenários da SPEC (fixtures sintéticas)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runT007(f1t007Fixtures.invalid)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123b66] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f52] focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  F1-INVALID-001 (RED)
                </button>
                <button
                  type="button"
                  onClick={() => runT007(f1t007Fixtures.edgeNull)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  F1-EDGE-001 (nulos)
                </button>
                <button
                  type="button"
                  onClick={() => runT007(f1t007Fixtures.edgeLate)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  F1-EDGE-002 (AGENDADO)
                </button>
                <button
                  type="button"
                  onClick={() => runT007(f1t007Fixtures.edgeClinical)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  F1-EDGE-003 (clínico)
                </button>
                <button
                  type="button"
                  onClick={fixT007Blocked}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
                >
                  Corrigir registro (nova versão)
                </button>
              </div>
              {t007Feedback && (
                <p
                  className="mt-3 rounded-lg bg-white p-3 font-mono text-xs text-slate-700"
                  role="status"
                  aria-live="polite"
                >
                  {t007Feedback}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registro do cenário (estado do sistema)
              </p>
              {t007Record ? (
                <>
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                    {JSON.stringify(t007Record, null, 2)}
                  </pre>
                  <p
                    className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${t007Record.validationState === 'VALIDO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {t007Record.validationState === 'VALIDO' ? (
                      isEligibleForCentral(t007Record) ? (
                        <>
                          <CheckCircle2 size={13} aria-hidden="true" /> Elegível para a central: SIM
                        </>
                      ) : (
                        <>
                          <TriangleAlert size={13} aria-hidden="true" /> Pendência mantida — status{' '}
                          {t007Record.statusSource} não é produção enviável à central
                        </>
                      )
                    ) : (
                      <>
                        <Ban size={13} aria-hidden="true" /> BLOQUEADO — fora da saída para a
                        central
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                  Nenhum cenário executado ainda. Use os botões acima.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {t007Audit.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={5}>
                      Nenhum evento de auditoria ainda. Use os botões acima.
                    </td>
                  </tr>
                ) : (
                  t007Audit.map((event) => (
                    <tr key={event.eventId}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.eventId}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{event.action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {event.recordId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        v{event.version}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{event.reason ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <FilePlus2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">
                F1-T008 · Evidência do registro para o contrato
              </h3>
              <p className="text-sm text-slate-500">
                Somente registro VÁLIDO com produção efetivada é separado para a SPEC-1-003;
                BLOQUEADO e pendências permanecem fora da saída, com motivo.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runT008Separation}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#123b66] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f52] focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
            >
              Executar separação (3 registros de prova)
            </button>
            {t008Feedback && (
              <p
                className="rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700"
                role="status"
                aria-live="polite"
              >
                {t008Feedback}
              </p>
            )}
          </div>

          {t008Separation && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Segue para o contrato ({t008Separation.elegiveis.length})
                </p>
                {t008Separation.elegiveis.map((record) => (
                  <pre
                    key={record.recordId}
                    className="mt-2 overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700"
                  >
                    {JSON.stringify(record, null, 2)}
                  </pre>
                ))}
                {t008Separation.elegiveis.length === 0 && (
                  <p className="mt-2 text-sm text-emerald-800">Nenhum registro elegível.</p>
                )}
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                  Fora da saída ({t008Separation.excluidos.length})
                </p>
                {t008Separation.excluidos.map(({ record, reason }) => (
                  <div key={record.recordId} className="mt-2 rounded-lg bg-white p-3">
                    <p className="font-mono text-xs font-bold text-rose-700">
                      {record.recordId} — motivo: {reason}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {reason === 'BLOQUEADO'
                        ? `Registro bloqueado (${record.missingFields.join('; ')})`
                        : reason === 'STATUS_SEM_PRODUCAO'
                          ? `Status ${record.statusSource} mantém pendência — não é produção enviável`
                          : 'Registro em rascunho'}
                    </p>
                  </div>
                ))}
                {t008Separation.excluidos.length === 0 && (
                  <p className="mt-2 text-sm text-rose-800">Nenhum registro excluído.</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <FilePlus2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-[#123b66]">F1-T010 · Envelope production-record.v1</h3>
              <p className="text-sm text-slate-500">
                Registro VÁLIDO gera envelope completo, determinístico e com chave de idempotência —
                conforme o contrato aprovado na F1-T009. Sem API ou credencial nesta fase.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => generateT010Envelope(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#123b66] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f52] focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
            >
              Gerar envelope (F1-VALID-001)
            </button>
            <button
              type="button"
              onClick={() => generateT010Envelope(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#187b8c]"
            >
              Gerar novamente (comparar)
            </button>
            {t010Feedback && (
              <p
                className="rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700"
                role="status"
                aria-live="polite"
              >
                {t010Feedback}
              </p>
            )}
          </div>

          {t010Envelope && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Envelope gerado (1ª geração)
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                  {JSON.stringify(t010Envelope, null, 2)}
                </pre>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  2ª geração (comparação de determinismo)
                </p>
                {t010Second ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                    {JSON.stringify(t010Second, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Use “Gerar novamente (comparar)” para provar o determinismo.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <span>Versão da fixture: 1</span>
          <span>
            Política: RN-1-001 · RN-1-002 · RN-1-003 · RN-1-004 · RN-1-005 · RN-1-006 · RN-1-007
          </span>
          <span className="text-slate-400">Sem dados reais ou conteúdo clínico</span>
        </footer>
      </main>
    </div>
  )
}

export default Index
