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

const routeFor = (role) => (role === 'superAdmin' ? '/candidate/admin/references' : '/ba/dashboard')

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
    <div className="brand-page-bg flex min-h-screen items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-2xl shadow-sky-900/10 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-between border-b border-sky-100 bg-white px-4 py-6 sm:px-10 sm:py-8 lg:border-b-0 lg:border-r">
          <div>
            <BrandLogo className="max-w-xs sm:max-w-xl" />
            <div className="mt-6 max-w-lg sm:mt-8">
              <p className="text-sm font-bold uppercase text-sky-700">HR consultancy workspace</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-4xl">Welcome back</h1>
              <p className="mt-3 text-base text-slate-600">
                Manage Business Advisors, candidate references, and company requirements from one clean Success HR dashboard.
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
            Your Success is Our Mission
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 py-6 sm:px-10 sm:py-8 lg:py-12">
          <div>
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <BrandLogo compact />
              <div>
                <p className="text-base font-bold text-slate-950">Success HR Solutions</p>
                <p className="text-xs font-semibold text-sky-700">Secure login</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Login</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your account details to continue.</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="admin@consultancy.com"
            />
            {errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            />
            {errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>}
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="brand-button flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold text-white shadow-lg shadow-sky-700/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
