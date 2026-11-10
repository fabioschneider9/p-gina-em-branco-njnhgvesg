/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <main className="w-full h-full min-h-screen bg-[#FFFFFF] m-0 p-0 overflow-y-auto">
      <nav
        aria-label="Navegação principal"
        className="flex flex-wrap gap-4 border-b border-slate-200 px-4 py-2 text-sm"
      >
        <Link
          to="/"
          className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Início
        </Link>
        <Link
          to="/conferencia"
          className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Conferência
        </Link>
      </nav>
      <Outlet />
    </main>
  )
}
