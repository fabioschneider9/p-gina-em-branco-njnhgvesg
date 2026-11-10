/* Regras da conferência entre atendimento realizado e lançamento no faturamento (demonstração).
   Funções puras: recebem os dados fictícios e devolvem as linhas, os totais e os filtros. */
import {
  ATENDIMENTOS_DEMO,
  LANCAMENTOS_DEMO,
  type AtendimentoDemo,
  type LancamentoDemo,
} from './dados-demo'

export type Situacao =
  | 'conferido'
  | 'sem_lancamento'
  | 'valor_diferente'
  | 'possivel_duplicidade'
  | 'informacao_incompleta'

export const NAO_INFORMADO = 'Não informado'

export interface SituacaoInfo {
  rotulo: string
  explicacao: string
  proximoPasso: string
}

export const SITUACOES: Record<Situacao, SituacaoInfo> = {
  conferido: {
    rotulo: 'Conferido',
    explicacao:
      'Há um atendimento realizado e um único lançamento correspondente, com valores iguais.',
    proximoPasso: 'Nada a fazer. Este atendimento está conferido.',
  },
  sem_lancamento: {
    rotulo: 'Sem lançamento',
    explicacao: 'O atendimento foi realizado, mas não há lançamento correspondente no faturamento.',
    proximoPasso: 'Confirme se este atendimento deveria ter sido lançado no faturamento.',
  },
  valor_diferente: {
    rotulo: 'Valor diferente',
    explicacao: 'O lançamento existe, mas seu valor é diferente do valor esperado no exemplo.',
    proximoPasso: 'Confira qual valor deve ser usado antes de alterar o lançamento.',
  },
  possivel_duplicidade: {
    rotulo: 'Possível duplicidade',
    explicacao: 'Existe mais de um lançamento com a mesma identificação de atendimento.',
    proximoPasso: 'Confira se os dois lançamentos representam o mesmo atendimento.',
  },
  informacao_incompleta: {
    rotulo: 'Informação incompleta',
    explicacao: 'Falta algum campo necessário para fazer a comparação.',
    proximoPasso: 'Complete ou confirme a informação indicada antes de comparar.',
  },
}

export const ORDEM_SITUACOES: Situacao[] = [
  'conferido',
  'sem_lancamento',
  'valor_diferente',
  'possivel_duplicidade',
  'informacao_incompleta',
]

export interface CampoComparado {
  campo: string
  producao: string
  faturamento: string
  /** true = igual, false = diferente, null = não comparável (falta informação). */
  igual: boolean | null
}

export interface LinhaConferencia {
  atendimento: AtendimentoDemo
  /** Mês de referência no formato AAAA-MM (derivado da data do atendimento). */
  competencia: string | null
  lancamentos: LancamentoDemo[]
  situacao: Situacao
  camposComparados: CampoComparado[]
  diferenca: string
  /** Campos que faltam para a comparação (apenas em informação incompleta). */
  camposFaltando: string[]
}

export interface Filtros {
  mes: string
  unidade: string
  profissional: string
  pagador: string
  situacao: string
}

export const FILTROS_VAZIOS: Filtros = {
  mes: 'todos',
  unidade: 'todas',
  profissional: 'todos',
  pagador: 'todos',
  situacao: 'todas',
}

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function rotuloMes(competencia: string): string {
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1]} de ${ano}`
}

const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Valor ausente nunca vira R$ 0,00. */
export function formatarValor(valor: number | null): string {
  return valor === null ? NAO_INFORMADO : formatadorBRL.format(valor)
}

export function formatarTexto(texto: string | null): string {
  return texto === null || texto.trim() === '' ? NAO_INFORMADO : texto
}

export function formatarData(data: string | null): string {
  if (!data) return NAO_INFORMADO
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function competenciaDe(data: string | null): string | null {
  return data ? data.slice(0, 7) : null
}

function valorIgual(a: number | null, b: number | null): boolean | null {
  if (a === null || b === null) return null
  return a === b
}

function textoIgual(a: string | null, b: string | null): boolean | null {
  if (!a || !b) return null
  return a === b
}

function calcularLinha(atendimento: AtendimentoDemo): LinhaConferencia {
  const competencia = competenciaDe(atendimento.data)
  const lancamentos = LANCAMENTOS_DEMO.filter((l) => l.atendimentoId === atendimento.id)
  const camposFaltando: string[] = []
  if (!atendimento.data) camposFaltando.push('Data do atendimento')
  if (!atendimento.profissional) camposFaltando.push('Profissional')
  if (!atendimento.servico) camposFaltando.push('Serviço')
  if (!atendimento.pagador) camposFaltando.push('Pagador')
  if (atendimento.valorEsperado === null) camposFaltando.push('Valor esperado no exemplo')

  const principal = lancamentos[0]
  const camposComparados: CampoComparado[] = [
    {
      campo: 'Identificação (ID de demonstração)',
      producao: atendimento.id,
      faturamento: principal ? (principal.atendimentoId ?? NAO_INFORMADO) : NAO_INFORMADO,
      igual: principal ? principal.atendimentoId === atendimento.id : null,
    },
    {
      campo: 'Mês de referência',
      producao: competencia ? rotuloMes(competencia) : NAO_INFORMADO,
      faturamento: principal?.competencia ? rotuloMes(principal.competencia) : NAO_INFORMADO,
      igual: principal ? textoIgual(competencia, principal.competencia) : null,
    },
    {
      campo: 'Profissional',
      producao: formatarTexto(atendimento.profissional),
      faturamento: formatarTexto(principal?.profissional ?? null),
      igual: principal ? textoIgual(atendimento.profissional, principal.profissional) : null,
    },
    {
      campo: 'Serviço',
      producao: formatarTexto(atendimento.servico),
      faturamento: formatarTexto(principal?.servico ?? null),
      igual: principal ? textoIgual(atendimento.servico, principal.servico) : null,
    },
    {
      campo: 'Pagador',
      producao: formatarTexto(atendimento.pagador),
      faturamento: formatarTexto(principal?.pagador ?? null),
      igual: principal ? textoIgual(atendimento.pagador, principal.pagador) : null,
    },
    {
      campo: 'Valor',
      producao: formatarValor(atendimento.valorEsperado),
      faturamento: formatarValor(principal?.valorLancado ?? null),
      igual: principal ? valorIgual(atendimento.valorEsperado, principal.valorLancado) : null,
    },
  ]

  let situacao: Situacao
  let diferenca: string

  if (camposFaltando.length > 0) {
    situacao = 'informacao_incompleta'
    diferenca = `Falta informação: ${camposFaltando.join(', ')}.`
  } else if (lancamentos.length === 0) {
    situacao = 'sem_lancamento'
    diferenca = `Nenhum lançamento no faturamento com o ID ${atendimento.id}.`
  } else if (lancamentos.length > 1) {
    situacao = 'possivel_duplicidade'
    diferenca = `Há ${lancamentos.length} lançamentos com o ID ${atendimento.id}: ${lancamentos
      .map((l) => l.id)
      .join(', ')}.`
  } else if (principal.valorLancado === null) {
    situacao = 'informacao_incompleta'
    camposFaltando.push('Valor lançado no faturamento')
    diferenca = 'O lançamento existe, mas o valor lançado não está informado.'
  } else if (principal.valorLancado !== atendimento.valorEsperado) {
    situacao = 'valor_diferente'
    const diff = Math.abs(principal.valorLancado - (atendimento.valorEsperado ?? 0))
    diferenca = `Valor esperado ${formatarValor(atendimento.valorEsperado)} e valor lançado ${formatarValor(
      principal.valorLancado,
    )}. Diferença de ${formatarValor(diff)}.`
  } else {
    situacao = 'conferido'
    diferenca = 'Nenhuma diferença encontrada.'
  }

  return {
    atendimento,
    competencia,
    lancamentos,
    situacao,
    camposComparados,
    diferenca,
    camposFaltando,
  }
}

/** Todas as linhas da conferência (sem filtro). */
export const TODAS_LINHAS: LinhaConferencia[] = ATENDIMENTOS_DEMO.map(calcularLinha)

export const OPCOES_MES = Array.from(
  new Set(TODAS_LINHAS.map((l) => l.competencia).filter((c): c is string => c !== null)),
).sort()

export const OPCOES_UNIDADE = Array.from(
  new Set(ATENDIMENTOS_DEMO.map((a) => a.unidade).filter((u): u is string => u !== null)),
)
export const OPCOES_PROFISSIONAL = Array.from(
  new Set(ATENDIMENTOS_DEMO.map((a) => a.profissional).filter((p): p is string => p !== null)),
)
export const OPCOES_PAGADOR = Array.from(
  new Set(ATENDIMENTOS_DEMO.map((a) => a.pagador).filter((p): p is string => p !== null)),
)

export function filtrarLinhas(linhas: LinhaConferencia[], filtros: Filtros): LinhaConferencia[] {
  return linhas.filter(
    (l) =>
      (filtros.mes === 'todos' || l.competencia === filtros.mes) &&
      (filtros.unidade === 'todas' || l.atendimento.unidade === filtros.unidade) &&
      (filtros.profissional === 'todos' || l.atendimento.profissional === filtros.profissional) &&
      (filtros.pagador === 'todos' || l.atendimento.pagador === filtros.pagador) &&
      (filtros.situacao === 'todas' || l.situacao === filtros.situacao),
  )
}

export interface ResumoConferencia {
  realizados: number
  conferidos: number
  atencao: number
  /** null quando nenhum lançamento das linhas tem valor informado. */
  valorLancado: number | null
}

export function resumir(linhas: LinhaConferencia[]): ResumoConferencia {
  const valores = linhas.flatMap((l) =>
    l.lancamentos.map((x) => x.valorLancado).filter((v): v is number => v !== null),
  )
  const conferidos = linhas.filter((l) => l.situacao === 'conferido').length
  return {
    realizados: linhas.length,
    conferidos,
    atencao: linhas.length - conferidos,
    valorLancado: valores.length > 0 ? valores.reduce((s, v) => s + v, 0) : null,
  }
}
