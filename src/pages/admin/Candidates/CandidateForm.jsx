import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../api/axios'

const initial = {
  fullName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  dateOfBirth: '',
  gender: '',
  currentAddress: '',
  permanentAddress: '',
  education: '',
  specialization: '',
  totalExperience: '',
  currentCompany: '',
  currentDesignation: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  keySkills: '',
  preferredLocation: '',
  marriageStatus: '',
  languagesKnown: ''
}

export default function CandidateForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return

    const load = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        const c = data.candidate
        setForm({
          fullName: c.fullName || '',
          mobileNumber: c.mobileNumber || '',
          whatsappNo: c.whatsappNo || '',
          emailId: c.emailId || '',
          dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : '',
          gender: c.gender || '',
          currentAddress: c.currentAddress || '',
          permanentAddress: c.permanentAddress || '',
          education: c.education || '',
          specialization: c.specialization || '',
          totalExperience: c.totalExperience ?? '',
          currentCompany: c.currentCompany || '',
          currentDesignation: c.currentDesignation || '',
          currentSalary: c.currentSalary || '',
          expectedSalary: c.expectedSalary || '',
          noticePeriod: c.noticePeriod || '',
          keySkills: (c.keySkills || []).join(', '),
          preferredLocation: c.preferredLocation || '',
          marriageStatus: c.marriageStatus || '',
          languagesKnown: (c.languagesKnown || []).join(', ')
        })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load candidate')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isEdit])

  const payload = useMemo(
    () => ({
      ...form,
      totalExperience: form.totalExperience === '' ? undefined : Number(form.totalExperience),
      keySkills: form.keySkills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      languagesKnown: form.languagesKnown
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }),
    [form]
  )

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.fullName || !form.mobileNumber) {
      toast.error('Full name and mobile number are required')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/cms/candidates/${id}`, payload)
        toast.success('Candidate updated')
      } else {
        await api.post('/cms/candidates', payload)
        toast.success('Candidate created')
      }

      navigate('/admin/cms/candidates')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save candidate')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading candidate...</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/candidates')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['fullName', 'Full Name *'],
            ['mobileNumber', 'Mobile Number *'],
            ['whatsappNo', 'WhatsApp No'],
            ['emailId', 'Email Id'],
            ['dateOfBirth', 'Date Of Birth', 'date'],
            ['gender', 'Gender'],
            ['education', 'Education'],
            ['specialization', 'Specialization'],
            ['totalExperience', 'Total Experience (years)', 'number'],
            ['currentCompany', 'Current Company'],
            ['currentDesignation', 'Current Designation'],
            ['currentSalary', 'Current Salary'],
            ['expectedSalary', 'Expected Salary'],
            ['noticePeriod', 'Notice Period'],
            ['preferredLocation', 'Preferred Location'],
            ['marriageStatus', 'Marriage Status']
          ].map(([key, label, type = 'text']) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(event) => update(key, event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          ))}

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Current Address
            <textarea
              value={form.currentAddress}
              onChange={(event) => update('currentAddress', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Permanent Address
            <textarea
              value={form.permanentAddress}
              onChange={(event) => update('permanentAddress', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Key Skills (comma separated)
            <input
              value={form.keySkills}
              onChange={(event) => update('keySkills', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Languages Known (comma separated)
            <input
              value={form.languagesKnown}
              onChange={(event) => update('languagesKnown', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
      >
        {saving ? 'Saving...' : isEdit ? 'Update Candidate' : 'Create Candidate'}
      </button>
    </form>
  )
}
