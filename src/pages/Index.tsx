import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  History,
  LockKeyhole,
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

        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <span>Versão da fixture: 1</span>
          <span>Política: RN-1-001 · RN-1-002 · RN-1-003 · RN-1-004</span>
          <span className="text-slate-400">Sem dados reais ou conteúdo clínico</span>
        </footer>
      </main>
    </div>
  )
}

export default Index
