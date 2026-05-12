import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  UserCheck,
  // X,
  Building2,
  PanelsTopLeft
} from 'lucide-react'
import { connectSocket, disconnectSocket } from '../socket'
import BrandLogo from './BrandLogo'
import Topbar from './Topbar'

export default function Sidebar({ role, children }) {
  const [open, setOpen] = useState(false)
  const { token } = useSelector((state) => state.auth)
  const location = useLocation()

  const isSuperAdmin = role === 'superAdmin'

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)
    return () => disconnectSocket()
  }, [token])

  return (
    <div className="flex min-h-screen min-w-0 bg-slate-100">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] transform overflow-y-auto bg-slate-800 text-white transition ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 p-3 sm:p-4">
          <BrandLogo className="max-h-24" />
          {/* <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X />
          </button> */}
        </div>

        <nav className="space-y-1 overflow-x-hidden p-2 sm:p-3" onClick={() => setOpen(false)}>
          {isSuperAdmin ? (
            <>
              <div className="my-3 border-t border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-300 whitespace-nowrap">Candidate Management</p>
              <div className="ml-2 mt-1 space-y-1 sm:ml-6">
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <UserCheck size={16} /> <span className="whitespace-nowrap">Candidates</span>
                </div>
                <NavLink
                  to="/candidate/admin/cms/candidates"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
                  }
                >
                  Candidates List
                </NavLink>
                <NavLink
                  to="/candidate/admin/cms/companies"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
                  }
                >
                  Companies
                </NavLink>
                <NavLink
                  to="/candidate/admin/process-panel"
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-700'}`
                  }
                >
                  <PanelsTopLeft size={16} /> <span className="whitespace-nowrap">Process Panel</span>
                </NavLink>
              </div>
            </>
          ) : null}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
