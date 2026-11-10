/* Situação da conferência: sempre texto + ícone (nunca só cor). */
import {
  Copy,
  CheckCircle2,
  FileX,
  ArrowLeftRight,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SITUACOES, type Situacao } from '@/lib/conferencia/conferencia'

const ICONES: Record<Situacao, LucideIcon> = {
  conferido: CheckCircle2,
  sem_lancamento: FileX,
  valor_diferente: ArrowLeftRight,
  possivel_duplicidade: Copy,
  informacao_incompleta: TriangleAlert,
}

const ESTILOS: Record<Situacao, string> = {
  conferido: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  sem_lancamento: 'border-red-300 bg-red-50 text-red-800',
  valor_diferente: 'border-amber-300 bg-amber-50 text-amber-900',
  possivel_duplicidade: 'border-violet-300 bg-violet-50 text-violet-800',
  informacao_incompleta: 'border-slate-300 bg-slate-100 text-slate-800',
}

export function SituacaoBadge({ situacao }: { situacao: Situacao }) {
  const Icone = ICONES[situacao]
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-start gap-1.5 whitespace-normal break-words text-left font-medium ${ESTILOS[situacao]}`}
    >
      <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{SITUACOES[situacao].rotulo}</span>
    </Badge>
  )
}
