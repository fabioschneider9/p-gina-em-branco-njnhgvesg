/* Painel de detalhes: somente leitura. Mostra produção, faturamento, campos comparados e diferença. */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SituacaoBadge } from './SituacaoBadge'
import {
  SITUACOES,
  formatarData,
  formatarTexto,
  formatarValor,
  type LinhaConferencia,
} from '@/lib/conferencia/conferencia'

interface Props {
  linha: LinhaConferencia | null
  onOpenChange: (aberto: boolean) => void
}

const CampoLinha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <div className="min-w-0">
    <dt className="text-xs text-slate-500">{rotulo}</dt>
    <dd className="break-words text-sm font-medium text-slate-900">{valor}</dd>
  </div>
)

export function DetalheConferencia({ linha, onOpenChange }: Props) {
  return (
    <Dialog open={linha !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {linha && (
          <>
            <DialogHeader>
              <DialogTitle className="break-words">Atendimento {linha.atendimento.id}</DialogTitle>
              <DialogDescription>
                Detalhes somente para leitura. Esta demonstração não corrige, apaga nem aprova
                registros.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-sm">
              <div>
                <SituacaoBadge situacao={linha.situacao} />
              </div>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Produção de demonstração</h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoLinha rotulo="Data" valor={formatarData(linha.atendimento.data)} />
                  <CampoLinha rotulo="Unidade" valor={formatarTexto(linha.atendimento.unidade)} />
                  <CampoLinha
                    rotulo="Profissional"
                    valor={formatarTexto(linha.atendimento.profissional)}
                  />
                  <CampoLinha rotulo="Serviço" valor={formatarTexto(linha.atendimento.servico)} />
                  <CampoLinha rotulo="Pagador" valor={formatarTexto(linha.atendimento.pagador)} />
                  <CampoLinha
                    rotulo="Valor esperado no exemplo"
                    valor={formatarValor(linha.atendimento.valorEsperado)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Faturamento de demonstração</h3>
                {linha.lancamentos.length === 0 ? (
                  <p className="break-words text-slate-700">
                    Nenhum lançamento encontrado no faturamento de demonstração para este ID.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {linha.lancamentos.map((l) => (
                      <li key={l.id} className="rounded-md bg-slate-50 p-3">
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <CampoLinha rotulo="Lançamento" valor={l.id} />
                          <CampoLinha
                            rotulo="ID do atendimento"
                            valor={formatarTexto(l.atendimentoId)}
                          />
                          <CampoLinha rotulo="Profissional" valor={formatarTexto(l.profissional)} />
                          <CampoLinha rotulo="Serviço" valor={formatarTexto(l.servico)} />
                          <CampoLinha rotulo="Pagador" valor={formatarTexto(l.pagador)} />
                          <CampoLinha
                            rotulo="Valor lançado"
                            valor={formatarValor(l.valorLancado)}
                          />
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Campos comparados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs text-slate-500">
                        <th className="py-2 pr-3 font-medium">Campo</th>
                        <th className="py-2 pr-3 font-medium">Produção</th>
                        <th className="py-2 pr-3 font-medium">Faturamento</th>
                        <th className="py-2 font-medium">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linha.camposComparados.map((c) => (
                        <tr key={c.campo} className="border-b align-top last:border-0">
                          <td className="break-words py-2 pr-3">{c.campo}</td>
                          <td className="break-words py-2 pr-3">{c.producao}</td>
                          <td className="break-words py-2 pr-3">{c.faturamento}</td>
                          <td className="break-words py-2">
                            {c.igual === null
                              ? 'Não comparável (falta informação)'
                              : c.igual
                                ? '✓ Igual'
                                : '✗ Diferente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Diferença encontrada</h3>
                <p className="break-words text-slate-700">{linha.diferenca}</p>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Próximo passo sugerido</h3>
                <p className="break-words text-slate-700">
                  {SITUACOES[linha.situacao].proximoPasso}
                </p>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
