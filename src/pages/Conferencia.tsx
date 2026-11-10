/* Tela "Conferência do mês" — demonstração com dados fictícios, somente leitura. */
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Info, TriangleAlert, Users, CheckCircle2, ShieldAlert, Wallet } from 'lucide-react'
import { ListaConferencia } from '@/components/conferencia/ListaConferencia'
import { DetalheConferencia } from '@/components/conferencia/DetalheConferencia'
import { SituacaoBadge } from '@/components/conferencia/SituacaoBadge'
import { VisaoPeriodo } from '@/components/conferencia/VisaoPeriodo'
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

interface Cartao {
  titulo: string
  valor: string
  ajuda: string
  icone: typeof Users
}

const ROTULOS_FILTRO: Record<keyof Filtros, string> = {
  mes: 'Mês de referência',
  unidade: 'Unidade',
  profissional: 'Profissional',
  pagador: 'Pagador',
  situacao: 'Situação da conferência',
}

function CampoFiltro({
  campo,
  valor,
  onChange,
  children,
}: {
  campo: keyof Filtros
  valor: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  const id = `filtro-${campo}`
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        {ROTULOS_FILTRO[campo]}
      </label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full bg-white" aria-label={ROTULOS_FILTRO[campo]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

const Conferencia = () => {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [selecionada, setSelecionada] = useState<LinhaConferencia | null>(null)

  const linhas = useMemo(() => filtrarLinhas(TODAS_LINHAS, filtros), [filtros])
  const resumo = useMemo(() => resumir(linhas), [linhas])

  const atualizar = (campo: keyof Filtros) => (valor: string) =>
    setFiltros((atual) => ({ ...atual, [campo]: valor }))

  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS)

  const cartoes: Cartao[] = [
    {
      titulo: 'Atendimentos realizados',
      valor: String(resumo.realizados),
      ajuda: 'Total de atendimentos listados abaixo.',
      icone: Users,
    },
    {
      titulo: 'Conferidos',
      valor: String(resumo.conferidos),
      ajuda: 'Atendimentos sem nenhuma diferença encontrada.',
      icone: CheckCircle2,
    },
    {
      titulo: 'Precisam de atenção',
      valor: String(resumo.atencao),
      ajuda: 'Atendimentos com alguma situação diferente de “Conferido”.',
      icone: ShieldAlert,
    },
    {
      titulo: 'Valor lançado no faturamento',
      valor: formatarValor(resumo.valorLancado),
      ajuda:
        'Valor lançado nesta demonstração. Não significa valor recebido ou pagamento confirmado.',
      icone: Wallet,
    },
  ]

  const periodoUnidade = [
    filtros.mes === 'todos' ? 'Todos os meses' : rotuloMes(filtros.mes),
    filtros.unidade === 'todas' ? 'Todas as unidades' : filtros.unidade,
  ].join(' · ')

  const FiltrosCard = (
    <Card className="w-full shrink-0 border-slate-200 shadow-sm lg:w-80">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">Filtros</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltros(FILTROS_VAZIOS)}
            disabled={!filtrosAtivos}
            className="h-8 shrink-0 px-2 text-xs text-teal-700 hover:bg-teal-50 hover:text-teal-800"
          >
            Limpar filtros
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <CampoFiltro campo="mes" valor={filtros.mes} onChange={atualizar('mes')}>
            <SelectItem value="todos">Todos os meses</SelectItem>
            {OPCOES_MES.map((m) => (
              <SelectItem key={m} value={m}>
                {rotuloMes(m)}
              </SelectItem>
            ))}
          </CampoFiltro>
          <CampoFiltro campo="unidade" valor={filtros.unidade} onChange={atualizar('unidade')}>
            <SelectItem value="todas">Todas as unidades</SelectItem>
            {OPCOES_UNIDADE.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </CampoFiltro>
          <CampoFiltro
            campo="profissional"
            valor={filtros.profissional}
            onChange={atualizar('profissional')}
          >
            <SelectItem value="todos">Todos os profissionais</SelectItem>
            {OPCOES_PROFISSIONAL.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </CampoFiltro>
          <CampoFiltro campo="pagador" valor={filtros.pagador} onChange={atualizar('pagador')}>
            <SelectItem value="todos">Todos os pagadores</SelectItem>
            {OPCOES_PAGADOR.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </CampoFiltro>
          <CampoFiltro campo="situacao" valor={filtros.situacao} onChange={atualizar('situacao')}>
            <SelectItem value="todas">Todas as situações</SelectItem>
            {ORDEM_SITUACOES.map((s) => (
              <SelectItem key={s} value={s}>
                {SITUACOES[s].rotulo}
              </SelectItem>
            ))}
          </CampoFiltro>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-slate-900 sm:p-6">
      {/* Cabeçalho: título à esquerda, filtros à direita quando couber */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">Conferência do mês</h1>
          <p className="break-words text-sm text-slate-600">{periodoUnidade}</p>
          <p className="max-w-xl break-words text-sm text-slate-700">
            Compare os atendimentos realizados com os lançamentos no faturamento e veja o que
            precisa ser conferido.
          </p>
        </div>
        {FiltrosCard}
      </header>

      {/* Faixa de contexto */}
      <div
        role="note"
        className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="break-words">
          Demonstração de conferência de atendimentos e faturamento.{' '}
          <strong className="font-semibold">Dados fictícios.</strong> Nenhum sistema da clínica está
          conectado.
        </span>
      </div>

      {/* Resumo: números grandes, ícones discretos, explicações curtas */}
      <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartoes.map((c) => (
          <Card key={c.titulo} className="border-slate-200 shadow-sm">
            <CardContent className="space-y-1.5 p-5">
              <div className="flex items-center gap-2 text-slate-500">
                <c.icone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="break-words text-sm font-medium">{c.titulo}</p>
              </div>
              <p className="break-words text-3xl font-bold tracking-tight text-slate-900">
                {c.valor}
              </p>
              <p className="break-words text-xs leading-relaxed text-slate-600">{c.ajuda}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Visão do período (usa as mesmas linhas filtradas) */}
      <VisaoPeriodo linhas={linhas} />

      {/* Lista: principal área de trabalho */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="break-words text-lg font-semibold text-slate-900">
              Lista de conferência
            </h2>
            <p className="mt-1 break-words text-sm text-slate-600">
              Cada linha é um atendimento realizado. A comparação usa o ID de demonstração do
              atendimento. Valores esperados são apenas exemplos, não uma tabela de preços nem
              regras de contrato.
            </p>
          </div>
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
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <h2 className="break-words text-lg font-semibold text-slate-900">
            Legenda das situações
          </h2>
          <ul className="mt-4 space-y-3">
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
