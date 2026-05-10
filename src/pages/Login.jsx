import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../store/authSlice'
import BrandLogo from '../components/BrandLogo'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
})

const InputIcon = ({ children }) => (
  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
    {children}
  </span>
)

const routeFor = (role) => {
  if (role === 'superAdmin') return '/admin/references'
  if (role === 'candidateAdmin') return '/admin/cms/candidates'
  return '/ba/dashboard'
}

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, user, loading, error } = useSelector((state) => state.auth)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  useEffect(() => {
    if (token && user) {
      navigate(routeFor(user.role), { replace: true })
    }
  }, [token, user, navigate])

  const onSubmit = async (values) => {
    const result = await dispatch(loginUser(values))

    if (loginUser.fulfilled.match(result)) {
      navigate(routeFor(result.payload.user.role), { replace: true })
    }
  }

  return (
    <div className="brand-page-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-2xl shadow-sky-900/10 backdrop-blur lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-between border-b border-slate-200/70 bg-white/70 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r">
          <div>
            <BrandLogo className="max-w-xl" />
            <div className="mt-8 max-w-lg">
              <p className="text-sm font-bold uppercase text-sky-700">HR consultancy workspace</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Welcome back</h1>
              <p className="mt-3 text-base text-slate-600">
                Manage Business Advisors, candidate references, and company requirements from one clean Success HR dashboard.
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Tip</p>
            <p className="mt-1">Use your official email to access the dashboard securely.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-8 sm:px-10 lg:py-12">
          <div>
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <BrandLogo compact />
              <div>
                <p className="text-base font-bold text-slate-950">Success HR Solutions</p>
                <p className="text-xs font-semibold text-sky-700">Secure login</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Login</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your account details to continue.</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <div className="relative mt-1">
              <InputIcon>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 16.5v-9A2.25 2.25 0 0 1 4.5 5.25h15A2.25 2.25 0 0 1 21.75 7.5Z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
                </svg>
              </InputIcon>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pl-11 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="admin@consultancy.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="relative mt-1">
              <InputIcon>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 10.5h10.5A1.875 1.875 0 0 1 19.125 12.375v6.375A1.875 1.875 0 0 1 17.25 20.625H6.75A1.875 1.875 0 0 1 4.875 18.75v-6.375A1.875 1.875 0 0 1 6.75 10.5Z"
                  />
                </svg>
              </InputIcon>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pl-11 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>}
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="brand-button flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-lg shadow-sky-700/20 transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
