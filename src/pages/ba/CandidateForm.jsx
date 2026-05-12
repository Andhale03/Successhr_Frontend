import { forwardRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const schema = z.object({
  candidateName: z.string().min(1, 'Candidate name is required'),
  mobileNumber: z.string().regex(/^.{10}$/, 'Mobile number must be 10 digits'),
  aadhaarNo: z.string().regex(/^.{12}$/, 'Aadhaar number must be 12 digits').or(z.literal('')).optional(),
  whatsappNo: z.string().regex(/^.{10}$/, 'WhatsApp number must be 10 digits').or(z.literal('')).optional(),
  emailId: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  appliedFor: z.string().optional(),
  interestedDepartment: z.string().optional(),
  preferredIndustry: z.string().optional(),
  preferredJobLocation: z.string().optional(),
  education: z.string().optional(),
  totalExperience: z.union([z.literal(''), z.coerce.number()]).optional(),
  careerSummary: z.string().optional(),
  currentSalary: z.string().optional(),
  expectedSalary: z.string().optional(),
  noticePeriod: z.union([z.literal(''), z.coerce.number()]).optional(),
  reasonForJobChange: z.string().optional(),
  currentJobLocation: z.string().optional(),
  availabilityForInterview: z.string().optional(),
  marriageStatus: z.string().optional()
})

const candidateFields = [
  ['candidateName', 'Candidate Name', true],
  ['mobileNumber', 'Mobile Number', true],
  ['aadhaarNo', 'Aadhaar Number'],
  ['whatsappNo', 'WhatsApp No'],
  ['emailId', 'Email Id'],
  ['appliedFor', 'Applied For'],
  ['interestedDepartment', 'Interested Department'],
  ['preferredIndustry', 'Preferred Industry'],
  ['preferredJobLocation', 'Preferred Job Location']
]

export default function CandidateForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      marriageStatus: ''
    }
  })

  const submit = async (values) => {
    setSubmitting(true)

    try {
      const payload = {
        ...values,
        totalExperience: values.totalExperience === '' ? undefined : Number(values.totalExperience),
        noticePeriod: values.noticePeriod === '' ? undefined : Number(values.noticePeriod)
      }

      await api.post('/candidates', payload)

      toast.success('Reference submitted successfully!')
      navigate('/ba/candidates')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit reference')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/ba/candidates" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← My Candidates
        </Link>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Add Candidate Reference</h1>
        <p className="mt-1 text-sm text-slate-500">Submit candidate details and professional context.</p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Candidate Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {candidateFields.map(([name, label, required]) => (
            <Input key={name} label={label} required={required} error={errors[name]?.message} {...register(name)} />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Professional Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Education" {...register('education')} />
          <Input label="Total Experience" type="number" suffix="Years" {...register('totalExperience')} />
          <Textarea label="Career Summary" className="sm:col-span-2" rows={3} {...register('careerSummary')} />
          <Input label="Current Salary" suffix="PM CTC" {...register('currentSalary')} />
          <Input label="Expected Salary" suffix="PM CTC" {...register('expectedSalary')} />
          <Input label="Notice Period" type="number" suffix="Months" {...register('noticePeriod')} />
          <Input label="Current Job Location" {...register('currentJobLocation')} />
          <Textarea label="Reason For Job Change" className="sm:col-span-2" rows={3} {...register('reasonForJobChange')} />
          <Input label="Availability For Interview" {...register('availabilityForInterview')} />
          <label className="text-sm font-semibold text-slate-700">
            Marriage Status
            <select
              {...register('marriageStatus')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Select</option>
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Single">Single</option>
            </select>
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
      >
        {submitting ? 'Submitting...' : 'Submit Reference'}
      </button>
    </form>
  )
}

const Input = forwardRef(function Input({ label, required, error, suffix, className = '', ...props }, ref) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label} {required && <span className="text-rose-500">*</span>}
      <div className="mt-1 flex rounded-lg border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-cyan-100">
        <input ref={ref} {...props} className="min-w-0 flex-1 rounded-lg px-3 py-2 outline-none" />
        {suffix && <span className="flex items-center border-l border-slate-200 px-3 text-xs font-semibold text-slate-500">{suffix}</span>}
      </div>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
})

const Textarea = forwardRef(function Textarea({ label, className = '', ...props }, ref) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <textarea
        ref={ref}
        {...props}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
})

