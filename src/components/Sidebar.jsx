import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  IndianRupee,
  Settings,
  UserCircle,
  Users,
  X
} from 'lucide-react'
import { logout } from '../store/authSlice'
import { connectAdminSocket, disconnectSocket } from '../socket'
import api from '../api/axios'
import BrandLogo from './BrandLogo'

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/business-advisors', label: 'Business Advisors', icon: Users },
  { to: '/admin/references', label: 'Reference Board', icon: PanelsTopLeft },
  { to: '/admin/students', label: 'Students', icon: UserCircle },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/commission-process', label: 'Process Panel', icon: PanelsTopLeft },
  { to: '/admin/commission', label: 'Commission', icon: IndianRupee },
  { to: '/admin/settings', label: 'Admin Settings', icon: Settings }
]

const baLinks = [
  { to: '/ba/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ba/profile', label: 'My Profile', icon: UserCircle },
  { to: '/ba/students', label: 'My Students', icon: UserCircle },
  { to: '/ba/companies', label: 'My Companies', icon: Building2 },
  { to: '/ba/earnings', label: 'My Earnings', icon: IndianRupee }
]

const hasNewEarning = (placements) => {
  if (!Array.isArray(placements) || placements.length === 0) return false

  const lastVisited = localStorage.getItem('ba_earnings_last_visited')
  if (!lastVisited) return placements.length > 0

  const lastVisitedTime = new Date(lastVisited).getTime()
  const newestPlacementTime = placements.reduce((latest, placement) => {
    const current = new Date(placement.createdAt || placement.updatedAt || 0).getTime()
    return current > latest ? current : latest
  }, 0)

  return newestPlacementTime > lastVisitedTime
}

export default function Sidebar({ role, children }) {
  const [open, setOpen] = useState(false)
  const [earningAlert, setEarningAlert] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token } = useSelector((state) => state.auth)
  const links = role === 'superAdmin' ? adminLinks : baLinks

  useEffect(() => {
    if (role !== 'superAdmin' || !token) return undefined

    connectAdminSocket(token)
    return () => {
      disconnectSocket()
    }
  }, [role, token])

  useEffect(() => {
    if (role !== 'businessAdvisor' || !token) return undefined

    let cancelled = false

    const refreshAlert = async () => {
      try {
        const { data } = await api.get('/placements/my')
        if (!cancelled) {
          setEarningAlert(hasNewEarning(data))
        }
      } catch (_error) {
        if (!cancelled) {
          setEarningAlert(false)
        }
      }
    }

    const handleVisited = () => setEarningAlert(false)

    refreshAlert()
    window.addEventListener('ba-earnings-visited', handleVisited)

    return () => {
      cancelled = true
      window.removeEventListener('ba-earnings-visited', handleVisited)
    }
  }, [role, token])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <BrandLogo compact className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-900">Success HR</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-800 text-white shadow-xl transition-transform lg:static lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-24 items-start justify-between border-b border-slate-700 px-4 py-4">
          <div className="min-w-0">
            <BrandLogo className="max-w-[210px] brightness-110" />
            <p className="mt-1 text-xs font-semibold text-slate-300">
              {role === 'superAdmin' ? 'Super Admin' : 'Business Advisor'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {label === 'My Earnings' && earningAlert && (
                <span className="ml-auto h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-300">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm font-semibold text-white hover:bg-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
