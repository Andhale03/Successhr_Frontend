import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { updateUser } from '../../store/authSlice'
import Skeleton from '../../components/Skeleton'

export default function AdminSettings() {
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: authUser?.name || '',
    email: authUser?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/auth/settings')
        const user = data.user || {}
        setProfileForm({
          name: user.name || '',
          email: user.email || ''
        })
        dispatch(updateUser(user))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [dispatch])

  const saveProfile = async (event) => {
    event.preventDefault()

    if (!profileForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!profileForm.email.trim()) {
      toast.error('Email is required')
      return
    }

    setProfileSaving(true)
    try {
      const { data } = await api.put('/auth/settings/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      })

      dispatch(updateUser(data.user))
      setProfileForm({
        name: data.user?.name || '',
        email: data.user?.email || ''
      })
      toast.success(data.message || 'Profile updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Current and new password are required')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    setPasswordSaving(true)
    try {
      const { data } = await api.put('/auth/settings/password', passwordForm)
      toast.success(data.message || 'Password updated')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{authUser?.role === 'businessAdvisor' ? 'BA Settings' : 'Admin Settings'}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account details, login email, and password.</p>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Profile & Email</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            required
            value={profileForm.name}
            onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))}
          />
          <Field
            label="Email"
            required
            type="email"
            value={profileForm.email}
            onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))}
          />
          <Field label="Role" value={authUser?.role === 'businessAdvisor' ? 'Business Advisor' : 'Super Admin'} readOnly />
          <Field label="Status" value={authUser?.isActive ? 'Active' : 'Inactive'} readOnly />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
        <form onSubmit={savePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Current Password"
            required
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
          />
          <div />
          <Field
            label="New Password"
            required
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
          />
          <Field
            label="Confirm New Password"
            required
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Field({ label, value, onChange = () => {}, required = false, type = 'text', readOnly = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
          readOnly ? 'bg-slate-100 text-slate-500' : 'bg-white'
        }`}
      />
    </label>
  )
}
