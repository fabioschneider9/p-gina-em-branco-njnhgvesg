/* Logo da Qualivida — arte real extraída do PDF anexado (sem distorção: viewBox nativo). */
import logo from '@/assets/logo-qualivida.svg'

export function LogoQualivida({ className = '' }: { className?: string }) {
  return <img src={logo} alt="Qualivida" className={className} />
}
