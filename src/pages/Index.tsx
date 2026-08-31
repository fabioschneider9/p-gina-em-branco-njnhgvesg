import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { canReadRecord, getScopeSummary, rlsFixture, type SyntheticUser } from '@/lib/rls-fixture'

const Index = () => {
  const [selectedUserId, setSelectedUserId] = useState(rlsFixture.users[0].id)
  const selectedUser = useMemo<SyntheticUser>(
    () => rlsFixture.users.find((user) => user.id === selectedUserId) ?? rlsFixture.users[0],
    [selectedUserId],
  )
  const isAllowed = canReadRecord(selectedUser, rlsFixture.record)

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
                <CheckCircle2
                  size={22}
                  className={isAllowed ? 'text-emerald-600' : 'text-rose-600'}
                  aria-hidden="true"
                />
                <div>
                  <p className={`font-bold ${isAllowed ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {isAllowed ? 'Leitura permitida' : 'Leitura negada'}
                  </p>
                  <p className={`mt-1 text-sm ${isAllowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isAllowed
                      ? 'As três dimensões do escopo coincidem com o registro-alvo.'
                      : 'O usuário não cobre entidade, unidade e profissional do registro.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <span>Versão da fixture: 1</span>
          <span>Política: RN-1-001</span>
          <span className="text-slate-400">Sem dados reais ou conteúdo clínico</span>
        </footer>
      </main>
    </div>
  )
}

export default Index
