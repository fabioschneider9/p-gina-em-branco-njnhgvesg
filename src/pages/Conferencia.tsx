/* Tela "Conferência do mês" — demonstração com dados fictícios, somente leitura. */
import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Info, TriangleAlert } from 'lucide-react'
import { ListaConferencia } from '@/components/conferencia/ListaConferencia'
import { DetalheConferencia } from '@/components/conferencia/DetalheConferencia'
import { SituacaoBadge } from '@/components/conferencia/SituacaoBadge'
import {
  FILTROS_VAZIOS,
  OPCOES_MES,
  OPCOES_PAGADOR,
  OPCOES_PROFISSIONAL,
  OPCOES_UNIDADE,
  ORDEM_SITUACOES,
  SITUACOES,
  TODAS_LINHAS,
  filtrarLinhas,
  formatarValor,
  resumir,
  rotuloMes,
  type Filtros,
  type LinhaConferencia,
} from '@/lib/conferencia/conferencia'

const Conferencia = () => {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [selecionada, setSelecionada] = useState<LinhaConferencia | null>(null)

  const linhas = useMemo(() => filtrarLinhas(TODAS_LINHAS, filtros), [filtros])
  const resumo = useMemo(() => resumir(linhas), [linhas])

  const atualizar = (campo: keyof Filtros) => (valor: string) =>
    setFiltros((atual) => ({ ...atual, [campo]: valor }))

  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS)

  const cartoes = [
    {
      titulo: 'Atendimentos realizados',
      valor: String(resumo.realizados),
      ajuda: 'Total de atendimentos listados abaixo.',
    },
    {
      titulo: 'Conferidos',
      valor: String(resumo.conferidos),
      ajuda: 'Atendimentos sem nenhuma diferença encontrada.',
    },
    {
      titulo: 'Precisam de atenção',
      valor: String(resumo.atencao),
      ajuda: 'Atendimentos com alguma situação diferente de “Conferido”.',
    },
    {
      titulo: 'Valor lançado no faturamento',
      valor: formatarValor(resumo.valorLancado),
      ajuda:
        'Valor lançado nesta demonstração. Não significa valor recebido ou pagamento confirmado.',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-slate-900 sm:p-6">
      <header className="space-y-2">
        <h1 className="break-words text-2xl font-bold sm:text-3xl">Conferência do mês</h1>
        <p className="break-words text-slate-700">
          Compare os atendimentos realizados com os lançamentos no faturamento e veja o que precisa
          ser conferido.
        </p>
        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-words">
            Demonstração com dados fictícios. Nenhum sistema da clínica está conectado.
          </span>
        </div>
      </header>

      {/* 1. Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription className="break-words">
            Os filtros funcionam juntos: a lista e os cartões mostram apenas o que atende a todos
            eles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mês de referência</label>
              <Select value={filtros.mes} onValueChange={atualizar('mes')}>
                <SelectTrigger aria-label="Mês de referência">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {OPCOES_MES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {rotuloMes(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="break-words text-xs text-slate-600">
                O mês ao qual os atendimentos e lançamentos pertencem.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unidade</label>
              <Select value={filtros.unidade} onValueChange={atualizar('unidade')}>
                <SelectTrigger aria-label="Unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as unidades</SelectItem>
                  {OPCOES_UNIDADE.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Profissional</label>
              <Select value={filtros.profissional} onValueChange={atualizar('profissional')}>
                <SelectTrigger aria-label="Profissional">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {OPCOES_PROFISSIONAL.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pagador</label>
              <Select value={filtros.pagador} onValueChange={atualizar('pagador')}>
                <SelectTrigger aria-label="Pagador">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os pagadores</SelectItem>
                  {OPCOES_PAGADOR.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Situação da conferência</label>
              <Select value={filtros.situacao} onValueChange={atualizar('situacao')}>
                <SelectTrigger aria-label="Situação da conferência">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as situações</SelectItem>
                  {ORDEM_SITUACOES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SITUACOES[s].rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setFiltros(FILTROS_VAZIOS)}
              disabled={!filtrosAtivos}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Resumo */}
      <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <Card key={c.titulo}>
            <CardContent className="space-y-1 p-4">
              <p className="break-words text-sm font-medium text-slate-600">{c.titulo}</p>
              <p className="break-words text-2xl font-bold">{c.valor}</p>
              <p className="break-words text-xs text-slate-600">{c.ajuda}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 3. Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de conferência</CardTitle>
          <CardDescription className="break-words">
            Cada linha é um atendimento realizado. A comparação usa o ID de demonstração do
            atendimento. Valores esperados são apenas exemplos, não uma tabela de preços nem regras
            de contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <p className="py-8 text-center text-slate-700">
              Nenhum atendimento encontrado com esses filtros.
            </p>
          ) : (
            <ListaConferencia linhas={linhas} onVerDetalhes={setSelecionada} />
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda das situações</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {ORDEM_SITUACOES.map((s) => (
              <li key={s} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                <div className="sm:w-56 sm:shrink-0">
                  <SituacaoBadge situacao={s} />
                </div>
                <p className="break-words text-sm text-slate-700">{SITUACOES[s].explicacao}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 break-words text-xs text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Os valores esperados são dados do exemplo, não uma tabela de preços da clínica nem
              regras reais de contrato. Um valor ausente aparece como “Não informado”.
            </span>
          </p>
        </CardContent>
      </Card>

      <DetalheConferencia
        linha={selecionada}
        onOpenChange={(aberto) => !aberto && setSelecionada(null)}
      />
    </div>
  )
}

export default Conferencia
