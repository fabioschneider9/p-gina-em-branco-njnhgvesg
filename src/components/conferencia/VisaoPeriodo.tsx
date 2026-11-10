/* Seção "Visão do período": gráficos compactos calculados com os MESMOS registros e
   filtros usados nos cartões e na lista. Sem séries históricas nem percentuais. */
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SituacaoBadge } from './SituacaoBadge'
import { ORDEM_SITUACOES, formatarData, type LinhaConferencia } from '@/lib/conferencia/conferencia'

interface Props {
  linhas: LinhaConferencia[]
}

/** Atendimentos por dia — apenas dias que aparecem nos dados filtrados. */
function porDia(linhas: LinhaConferencia[]) {
  const contagem = new Map<string, number>()
  for (const l of linhas) {
    if (!l.atendimento.data) continue
    contagem.set(l.atendimento.data, (contagem.get(l.atendimento.data) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, quantidade]) => ({ dia: formatarData(data), quantidade }))
}

/** Registros por situação — segue a ordem oficial das situações. */
function porSituacao(linhas: LinhaConferencia[]) {
  return ORDEM_SITUACOES.map((s) => ({
    situacao: s,
    quantidade: linhas.filter((l) => l.situacao === s).length,
  }))
}

export function VisaoPeriodo({ linhas }: Props) {
  const dias = porDia(linhas)
  const situacoes = porSituacao(linhas)

  return (
    <section aria-label="Visão do período" className="space-y-4">
      <div>
        <h2 className="break-words text-lg font-semibold text-slate-900">Visão do período</h2>
        <p className="break-words text-sm text-slate-600">
          Calculada com os mesmos registros e filtros dos cartões e da lista.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Atendimentos por dia */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 break-words text-sm font-medium text-slate-900">
            Atendimentos por dia
          </h3>
          {dias.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Sem atendimentos no período selecionado.
            </p>
          ) : (
            <div className="h-48" data-testid="grafico-por-dia">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dias} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(11,124,107,0.06)' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#CBD5E1', fontSize: 12 }}
                  />
                  <Bar dataKey="quantidade" fill="#00A88E" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Registros por situação */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 break-words text-sm font-medium text-slate-900">
            Registros por situação de conferência
          </h3>
          {linhas.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Sem registros no período selecionado.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {situacoes.map(({ situacao, quantidade }) => (
                <li key={situacao} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 sm:w-56">
                    <SituacaoBadge situacao={situacao} />
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#00A88E]"
                      style={{
                        width: `${Math.max((quantidade / linhas.length) * 100, quantidade > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-900">
                    {quantidade}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
