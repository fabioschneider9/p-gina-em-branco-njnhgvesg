/* Layout com menu lateral estreito (desktop, expansível) e topo/hambúrguer (mobile). */
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, ClipboardCheck, PanelLeft, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoQualivida } from './LogoQualivida'

const ITENS = [
  { to: '/', rotulo: 'Início', icone: Home },
  { to: '/conferencia', rotulo: 'Conferência', icone: ClipboardCheck },
]

export default function Layout() {
  const [expandido, setExpandido] = useState(false)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Menu lateral — desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm transition-[width] duration-200 md:flex',
          expandido ? 'w-60' : 'w-16',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-200',
            expandido ? 'gap-2 px-4' : 'justify-center px-2',
          )}
        >
          <LogoQualivida className="h-9 w-auto max-w-[13rem] object-contain" />
          {expandido && <span className="sr-only">Qualivida</span>}
        </div>

        <nav aria-label="Navegação principal" className="flex-1 space-y-1 p-2">
          {ITENS.map(({ to, rotulo, icone: Icone }) => {
            const ativo = pathname === to
            return (
              <Link
                key={to}
                to={to}
                title={rotulo}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  ativo
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className={cn('whitespace-nowrap', !expandido && 'sr-only')}>{rotulo}</span>
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 hover:text-slate-900"
          aria-expanded={expandido}
        >
          <PanelLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className={cn('whitespace-nowrap', !expandido && 'sr-only')}>
            {expandido ? 'Recolher menu' : 'Expandir menu'}
          </span>
        </button>
      </aside>

      {/* Topo com hambúrguer — mobile */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuMobileAberto((v) => !v)}
            aria-expanded={menuMobileAberto}
            aria-label={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          >
            {menuMobileAberto ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <LogoQualivida className="h-8 w-auto max-w-[10rem] object-contain" />
        </header>
        {menuMobileAberto && (
          <nav
            aria-label="Navegação principal"
            className="border-b border-slate-200 bg-white px-4 py-2 md:hidden"
          >
            {ITENS.map(({ to, rotulo, icone: Icone }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuMobileAberto(false)}
                aria-current={pathname === to ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  pathname === to
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
                {rotulo}
              </Link>
            ))}
          </nav>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
