import { forwardRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { ConfirmDialog } from '../../components/ActionDialogs'

const optionalText = z.string().optional()
const optionalPhone = z.string().regex(/^\d{10}$/, 'Number must be 10 digits').or(z.literal('')).optional()
const optionalNumber = z.union([z.literal(''), z.coerce.number()]).optional()

const schema = z.object({
  formMeta: z
    .object({
      day: optionalText,
      receiptNo: optionalText,
      rcWrc: optionalText,
      date: optionalText
    })
    .optional(),
  candidateName: z.string().min(1, 'Candidate name is required'),
  collegeName: optionalText,
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  whatsappNo: optionalPhone,
  emailId: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  education: optionalText,
  appliedFor: optionalText,
  preferredJobLocation: optionalText,
  totalExperience: optionalNumber,
  experienceDepartment: optionalText,
  currentSalary: optionalText,
  expectedSalary: optionalText,
  noticePeriod: optionalNumber,
  currentJobLocation: optionalText,
  reasonForJobChange: optionalText,
  familyDetails: z
    .object({
      fatherOccupation: optionalText,
      motherOccupation: optionalText,
      brotherOccupation: optionalText,
      sisterOccupation: optionalText
    })
    .optional(),
  goalAim: optionalText
})

const defaultValues = {
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

const toNumberOrUndefined = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value))

export default function StudentForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [pendingValues, setPendingValues] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues
  })

  const submit = async (values) => {
    setSubmitting(true)

    try {
      const payload = {
        ...values,
        formMeta: {
          ...values.formMeta,
          date: values.formMeta?.date || undefined
        },
        totalExperience: toNumberOrUndefined(values.totalExperience),
        noticePeriod: toNumberOrUndefined(values.noticePeriod)
      }

      await api.post('/students', payload)

      toast.success('Reference submitted successfully!')
      navigate('/ba/students')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit reference')
    } finally {
      setSubmitting(false)
    }
  }

  const requestSubmit = (values) => {
    setPendingValues(values)
  }

  return (
    <form onSubmit={handleSubmit(requestSubmit)} className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/ba/students" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {'<- My Candidates'}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">Add Candidate Reference</h1>
        <p className="mt-1 text-sm text-slate-500">Submit candidate details in the Candidate Management format.</p>
      </div>

      <Section title="Receipt Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Day" {...register('formMeta.day')} />
          <Input label="Receipt No" {...register('formMeta.receiptNo')} />
          <Input label="RC / WRC" {...register('formMeta.rcWrc')} />
          <Input label="Date" type="date" {...register('formMeta.date')} />
        </div>
      </Section>

      <Section title="Candidate Details">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Candidate Name" required error={errors.candidateName?.message} {...register('candidateName')} />
          <Input label="College Name" {...register('collegeName')} />
          <Input label="Mobile No" required error={errors.mobileNumber?.message} {...register('mobileNumber')} />
          <Input label="WhatsApp No" error={errors.whatsappNo?.message} {...register('whatsappNo')} />
          <Input label="Email ID" type="email" error={errors.emailId?.message} {...register('emailId')} />
          <Input label="Education" {...register('education')} />
          <Input label="Applied For" {...register('appliedFor')} />
          <Input label="Preferred Job Location" {...register('preferredJobLocation')} />
          <Input label="Experience (Years)" type="number" {...register('totalExperience')} />
          <Input label="Experience Department" {...register('experienceDepartment')} />
          <Input label="Current Salary" {...register('currentSalary')} />
          <Input label="Expected Salary" {...register('expectedSalary')} />
          <Input label="Notice Period" type="number" {...register('noticePeriod')} />
          <Input label="Current Job Location" {...register('currentJobLocation')} />
          <Textarea label="Reason Of Job Change" className="md:col-span-2 xl:col-span-3" rows={3} {...register('reasonForJobChange')} />
        </div>
      </Section>

      <Section title="Family Details">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Occupation Of Father" {...register('familyDetails.fatherOccupation')} />
          <Input label="Occupation Of Mother" {...register('familyDetails.motherOccupation')} />
          <Input label="Occupation Of Brother" {...register('familyDetails.brotherOccupation')} />
          <Input label="Occupation Of Sister" {...register('familyDetails.sisterOccupation')} />
          <Textarea label="What is your Goal / Aim?" className="md:col-span-2" rows={4} {...register('goalAim')} />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
        >
          {submitting ? 'Submitting...' : 'Submit Reference'}
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingValues)}
        title="Submit Candidate Reference"
        message={`Create candidate reference for ${pendingValues?.candidateName || 'this candidate'}?`}
        confirmText="Submit Reference"
        onCancel={() => setPendingValues(null)}
        onConfirm={async () => {
          const values = pendingValues
          setPendingValues(null)
          if (values) {
            await submit(values)
          }
        }}
      />
    </form>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

const Input = forwardRef(function Input({ label, required, error, className = '', ...props }, ref) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label} {required ? <span className="text-rose-500">*</span> : null}
      <input
        ref={ref}
        {...props}
        className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
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
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  )
})
