/* Lista de conferência: tabela em telas grandes e cartões empilhados em celular. */
import { Button } from '@/components/ui/button'
import { SituacaoBadge } from './SituacaoBadge'
import {
  formatarData,
  formatarTexto,
  formatarValor,
  type LinhaConferencia,
} from '@/lib/conferencia/conferencia'

interface Props {
  linhas: LinhaConferencia[]
  onVerDetalhes: (linha: LinhaConferencia) => void
}

const cabecalho = 'py-3 pr-3 text-left text-xs font-semibold text-slate-600'

export function ListaConferencia({ linhas, onVerDetalhes }: Props) {
  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className={cabecalho}>Data</th>
              <th className={cabecalho}>Atendimento</th>
              <th className={cabecalho}>Profissional</th>
              <th className={cabecalho}>Serviço</th>
              <th className={cabecalho}>Pagador</th>
              <th className={cabecalho}>Valor esperado no exemplo</th>
              <th className={cabecalho}>Valor lançado</th>
              <th className={cabecalho}>Situação</th>
              <th className={cabecalho}>
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.atendimento.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-3">{formatarData(l.atendimento.data)}</td>
                <td className="py-3 pr-3 font-medium">Atendimento {l.atendimento.id}</td>
                <td className="break-words py-3 pr-3">
                  {formatarTexto(l.atendimento.profissional)}
                </td>
                <td className="break-words py-3 pr-3">{formatarTexto(l.atendimento.servico)}</td>
                <td className="break-words py-3 pr-3">{formatarTexto(l.atendimento.pagador)}</td>
                <td className="py-3 pr-3">{formatarValor(l.atendimento.valorEsperado)}</td>
                <td className="py-3 pr-3">
                  {formatarValor(l.lancamentos.length > 0 ? l.lancamentos[0].valorLancado : null)}
                  {l.lancamentos.length > 1 && (
                    <span className="block text-xs text-slate-500">
                      {l.lancamentos.length} lançamentos
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  <SituacaoBadge situacao={l.situacao} />
                </td>
                <td className="py-3">
                  <Button variant="outline" size="sm" onClick={() => onVerDetalhes(l)}>
                    Ver detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular */}
      <ul className="space-y-3 md:hidden">
        {linhas.map((l) => (
          <li key={l.atendimento.id} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="break-words font-semibold">Atendimento {l.atendimento.id}</span>
              <SituacaoBadge situacao={l.situacao} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Data</dt>
              <dd>{formatarData(l.atendimento.data)}</dd>
              <dt className="text-slate-500">Profissional</dt>
              <dd className="break-words">{formatarTexto(l.atendimento.profissional)}</dd>
              <dt className="text-slate-500">Serviço</dt>
              <dd className="break-words">{formatarTexto(l.atendimento.servico)}</dd>
              <dt className="text-slate-500">Pagador</dt>
              <dd className="break-words">{formatarTexto(l.atendimento.pagador)}</dd>
              <dt className="text-slate-500">Valor esperado no exemplo</dt>
              <dd>{formatarValor(l.atendimento.valorEsperado)}</dd>
              <dt className="text-slate-500">Valor lançado</dt>
              <dd>
                {formatarValor(l.lancamentos.length > 0 ? l.lancamentos[0].valorLancado : null)}
                {l.lancamentos.length > 1 && ` (${l.lancamentos.length} lançamentos)`}
              </dd>
            </dl>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => onVerDetalhes(l)}
            >
              Ver detalhes
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
