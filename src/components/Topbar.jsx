import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  UserCircle,
  LogOut,
  Menu,
  Settings,
  ChevronDown,
  BadgeCheck
} from 'lucide-react'
import { logout } from '../store/authSlice'

export default function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const settingsPath = user?.role === 'businessAdvisor' ? '/ba/settings' : '/admin/settings'

  return (
    <div className="sticky top-0 z-30 flex h-14 min-w-0 items-center border-b bg-white px-3 shadow-sm sm:px-4">

      {/* MOBILE MENU */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden mr-2 p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      {/* PROFILE */}
      <div className="ml-auto relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <UserCircle className="h-7 w-7 text-gray-600" />
          <span className="text-sm font-medium hidden sm:block text-gray-700">
            {user?.name}
          </span>
          <ChevronDown
            size={16}
            className={`transition ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 z-50 mt-3 w-[calc(100vw-1.5rem)] max-w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">

            {/* USER INFO */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>

            {/* MENU */}
            <div className="py-1">

              {user?.role === 'businessAdvisor' ? (
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate('/ba/profile')
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  <BadgeCheck size={16} />
                  BA Profile
                </button>
              ) : null}

              <button
                onClick={() => {
                  setOpen(false)
                  navigate(settingsPath)
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <Settings size={16} />
                Account Settings
              </button>

              <div className="my-1 border-t" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
