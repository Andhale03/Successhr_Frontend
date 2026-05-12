import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, ClipboardList, Loader2, ShieldCheck, UserRound } from 'lucide-react'
import api from '../../api/axios'

const initialForm = {
  formMeta: {
    day: '',
    receiptNo: '',
    rcWrc: '',
    date: ''
  },
  candidateName: '',
  collegeName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  education: '',
  appliedFor: '',
  preferredJobLocation: '',
  totalExperience: '',
  experienceDepartment: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  currentJobLocation: '',
  reasonForJobChange: '',
  familyDetails: {
    fatherOccupation: '',
    motherOccupation: '',
    brotherOccupation: '',
    sisterOccupation: ''
  },
  goalAim: ''
}

export default function ApplyPage() {
  const { code } = useParams()
  const [advisorCode, setAdvisorCode] = useState(String(code || '').toLowerCase())
  const [advisor, setAdvisor] = useState(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!advisorCode) return
    verifyAdvisorCode(advisorCode)
  }, [])

  const completedRequired = useMemo(
    () => ['candidateName', 'mobileNumber'].filter((key) => form[key]?.trim()).length,
    [form]
  )

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateGroup = (group, field, value) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value
      }
    }))
  }

  const verifyAdvisorCode = async (value) => {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized) {
      setAdvisor(null)
      setCodeError('')
      return
    }

    setCheckingCode(true)
    setCodeError('')
    try {
      const { data } = await api.get(`/public/advisor/${normalized}`)
      setAdvisor(data)
    } catch (_error) {
      setAdvisor(null)
      setCodeError('Advisor code is invalid. You can leave it empty for direct candidate management submission.')
    } finally {
      setCheckingCode(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.candidateName.trim() || !form.mobileNumber.trim()) {
      toast.error('Candidate name and mobile number are required')
      return
    }

    const normalizedCode = advisorCode.trim().toLowerCase()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        formMeta: {
          ...form.formMeta,
          date: form.formMeta.date || undefined
        },
        advisorCode: normalizedCode || undefined
      }
      const { data } = await api.post('/public/apply', payload)
      setDone({
        name: form.candidateName.trim(),
        mode: data.mode || (normalizedCode ? 'advisor' : 'cms'),
        advisorName: advisor?.advisorName || '',
        candidateCode: data.candidateCode || ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit your application')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <PublicShell>
        <section className="mx-auto max-w-xl rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-950 sm:text-2xl">Application Submitted</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Thank you {done.name}. {done.mode === 'advisor' ? 'Your application was sent to the advisor flow.' : 'Your application was sent directly to candidate management.'}
          </p>
          {done.candidateCode ? <p className="mt-2 text-sm font-semibold text-sky-700">Your Candidate ID: {done.candidateCode}</p> : null}
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell advisor={advisor}>
      <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <FormSection icon={<ShieldCheck className="h-5 w-5" />} title="Submission Route">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Business Advisor Code (Optional)"
                value={advisorCode}
                onChange={(value) => {
                  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '')
                  setAdvisorCode(normalized)
                  if (!normalized) {
                    setAdvisor(null)
                    setCodeError('')
                  }
                }}
                placeholder="Enter advisor code if available"
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => verifyAdvisorCode(advisorCode)}
                  disabled={checkingCode}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-70"
                >
                  {checkingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {checkingCode ? 'Checking...' : 'Verify Code'}
                </button>
              </div>
            </div>
            {advisor ? <p className="mt-3 text-sm font-semibold text-emerald-700">Valid code for: {advisor.advisorName}</p> : null}
            {codeError ? <p className="mt-3 text-sm font-semibold text-rose-600">{codeError}</p> : null}
            {!advisorCode ? <p className="mt-3 text-sm text-slate-600">Without advisor code, your form will go directly to candidate management.</p> : null}
          </FormSection>

          <FormSection icon={<ClipboardList className="h-5 w-5" />} title="Receipt Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Day" value={form.formMeta.day} onChange={(value) => updateGroup('formMeta', 'day', value)} />
              <Field label="Receipt No" value={form.formMeta.receiptNo} onChange={(value) => updateGroup('formMeta', 'receiptNo', value)} />
              <Field label="RC / WRC" value={form.formMeta.rcWrc} onChange={(value) => updateGroup('formMeta', 'rcWrc', value)} />
              <Field label="Date" type="date" value={form.formMeta.date} onChange={(value) => updateGroup('formMeta', 'date', value)} />
            </div>
          </FormSection>

          <FormSection icon={<UserRound className="h-5 w-5" />} title="Candidate Details">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Candidate Name" required value={form.candidateName} onChange={(value) => update('candidateName', value)} />
              <Field label="College Name" value={form.collegeName} onChange={(value) => update('collegeName', value)} />
              <Field label="Mobile No" required value={form.mobileNumber} onChange={(value) => update('mobileNumber', value.replace(/\D/g, '').slice(0, 10))} />
              <Field label="WhatsApp No" value={form.whatsappNo} onChange={(value) => update('whatsappNo', value.replace(/\D/g, '').slice(0, 10))} />
              <Field label="Email ID" type="email" value={form.emailId} onChange={(value) => update('emailId', value)} />
              <Field label="Education" value={form.education} onChange={(value) => update('education', value)} />
              <Field label="Applied For" value={form.appliedFor} onChange={(value) => update('appliedFor', value)} />
              <Field label="Preferred Job Location" value={form.preferredJobLocation} onChange={(value) => update('preferredJobLocation', value)} />
              <Field label="Experience (Years)" type="number" value={form.totalExperience} onChange={(value) => update('totalExperience', value)} />
              <Field label="Experience Department" value={form.experienceDepartment} onChange={(value) => update('experienceDepartment', value)} />
              <Field label="Current Salary" value={form.currentSalary} onChange={(value) => update('currentSalary', value)} />
              <Field label="Expected Salary" value={form.expectedSalary} onChange={(value) => update('expectedSalary', value)} />
              <Field label="Notice Period" type="number" value={form.noticePeriod} onChange={(value) => update('noticePeriod', value)} />
              <Field label="Current Job Location" value={form.currentJobLocation} onChange={(value) => update('currentJobLocation', value)} />
              <Area label="Reason Of Job Change" value={form.reasonForJobChange} onChange={(value) => update('reasonForJobChange', value)} className="md:col-span-2 xl:col-span-3" />
            </div>
          </FormSection>

          <FormSection icon={<UserRound className="h-5 w-5" />} title="Family Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Occupation Of Father" value={form.familyDetails.fatherOccupation} onChange={(value) => updateGroup('familyDetails', 'fatherOccupation', value)} />
              <Field label="Occupation Of Mother" value={form.familyDetails.motherOccupation} onChange={(value) => updateGroup('familyDetails', 'motherOccupation', value)} />
              <Field label="Occupation Of Brother" value={form.familyDetails.brotherOccupation} onChange={(value) => updateGroup('familyDetails', 'brotherOccupation', value)} />
              <Field label="Occupation Of Sister" value={form.familyDetails.sisterOccupation} onChange={(value) => updateGroup('familyDetails', 'sisterOccupation', value)} />
              <Area label="What is your Goal / Aim?" value={form.goalAim} onChange={(value) => update('goalAim', value)} className="md:col-span-2" rows={4} />
            </div>
          </FormSection>
        </div>

        <aside className="h-fit rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 lg:sticky lg:top-6">
          <p className="text-base font-bold text-slate-950">Application Summary</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <SummaryRow label="Route" value={advisorCode ? (advisor ? 'Advisor flow' : 'Advisor code pending') : 'Direct candidate management'} />
            <SummaryRow label="Required details" value={`${completedRequired}/2`} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Submitting...' : 'Submit My Application'}
          </button>
        </aside>
      </form>
    </PublicShell>
  )
}

function PublicShell({ children, advisor }) {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200 sm:mb-5 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/success-logo.png" alt="SUCCESS HR Solution" className="h-10 w-28 shrink-0 object-contain sm:h-12 sm:w-32" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-sky-700">SUCCESS HR Solution</p>
                <h1 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">Candidate Application</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {advisor ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-200">{advisor.advisorCode}</span> : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Secure public form</span>
            </div>
          </div>
        </header>

        {children}

        <footer className="py-7 text-center text-xs font-semibold text-slate-500">Powered by SUCCESS HR Solution</footer>
      </div>
    </main>
  )
}

function FormSection({ icon, title, children }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">{icon}</span>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, required = false, type = 'text' }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input
        type={type}
        value={value}
        required={required}
        min={type === 'number' ? '0' : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function Area({ label, value, onChange, className = '', rows = 3 }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span className="text-right font-semibold text-slate-950">{value || '-'}</span>
    </div>
  )
}
