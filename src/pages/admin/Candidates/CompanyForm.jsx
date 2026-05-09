import { forwardRef, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import api from '../../../api/axios'

const facilities = ['Bus', 'Canteen', 'Room', 'PF', 'ESIC', 'Offer Letter', 'Appointment Letter', 'Experience Letter']
const weeklyOffs = ['Saturday', 'Sunday']

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonDesignation: z.string().optional(),
  mobileNo: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits').or(z.literal('')).optional(),
  emailId: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  jobProfile: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  rolesAndResponsibility: z.string().optional(),
  salaryRange: z.string().optional(),
  gender: z.string().optional(),
  numberOfVacancy: z.union([z.literal(''), z.coerce.number()]).optional(),
  jobTime: z.string().optional(),
  shift: z.string().optional(),
  jobLocation: z.string().optional(),
  ageCriteria: z.string().optional(),
  castCriteria: z.string().optional(),
  marriageCriteria: z.string().optional(),
  manpower: z.string().optional(),
  turnover: z.string().optional(),
  plant: z.string().optional(),
  interviewDate: z.string().optional(),
  interviewTime: z.string().optional(),
  interviewMode: z.string().optional()
})

export default function CompanyForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [selectedFacilities, setSelectedFacilities] = useState([])
  const [selectedWeeklyOffs, setSelectedWeeklyOffs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'Any',
      marriageCriteria: 'Any',
      interviewMode: 'Offline'
    }
  })

  useEffect(() => {
    if (!isEdit) return

    const load = async () => {
      try {
        const { data } = await api.get(`/cms/companies/${id}`)
        const company = data.company
        const job = company.jobRequirements || {}
        const about = company.aboutCompany || {}

        setValue('companyName', company.companyName || '')
        setValue('companyAddress', company.companyAddress || '')
        setValue('contactPersonName', company.contactPersonName || '')
        setValue('contactPersonDesignation', company.contactPersonDesignation || '')
        setValue('mobileNo', company.mobileNo || '')
        setValue('emailId', company.emailId || '')
        setValue('jobProfile', job.jobProfile || '')
        setValue('education', job.education || '')
        setValue('experience', job.experience || '')
        setValue('rolesAndResponsibility', job.rolesAndResponsibility || '')
        setValue('salaryRange', job.salaryRange || '')
        setValue('gender', job.gender || 'Any')
        setValue('numberOfVacancy', job.numberOfVacancy ?? '')
        setValue('jobTime', job.jobTime || '')
        setValue('shift', job.shift || '')
        setValue('jobLocation', job.jobLocation || '')
        setValue('ageCriteria', job.ageCriteria || '')
        setValue('castCriteria', job.castCriteria || '')
        setValue('marriageCriteria', job.marriageCriteria || 'Any')
        setValue('manpower', about.manpower || '')
        setValue('turnover', about.turnover || '')
        setValue('plant', about.plant || '')
        setValue('interviewDate', about.availabilityForInterview?.date ? String(about.availabilityForInterview.date).slice(0, 10) : '')
        setValue('interviewTime', about.availabilityForInterview?.time || '')
        setValue('interviewMode', about.interviewMode || 'Offline')
        setSkills(job.requiredKeySkills || [])
        setSelectedFacilities(job.facilities || [])
        setSelectedWeeklyOffs(about.weeklyOff || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load company')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isEdit, setValue])

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !skills.includes(skill)) {
      setSkills((current) => [...current, skill])
    }
    setSkillInput('')
  }

  const toggleValue = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  const submit = async (values) => {
    setSubmitting(true)

    try {
      const payload = {
        companyName: values.companyName,
        companyAddress: values.companyAddress,
        contactPersonName: values.contactPersonName,
        contactPersonDesignation: values.contactPersonDesignation,
        mobileNo: values.mobileNo,
        emailId: values.emailId,
        jobRequirements: {
          jobProfile: values.jobProfile,
          education: values.education,
          experience: values.experience,
          requiredKeySkills: skills,
          rolesAndResponsibility: values.rolesAndResponsibility,
          salaryRange: values.salaryRange,
          gender: values.gender,
          numberOfVacancy: values.numberOfVacancy === '' ? undefined : Number(values.numberOfVacancy),
          jobTime: values.jobTime,
          shift: values.shift,
          jobLocation: values.jobLocation,
          ageCriteria: values.ageCriteria,
          castCriteria: values.castCriteria,
          marriageCriteria: values.marriageCriteria,
          facilities: selectedFacilities
        },
        aboutCompany: {
          manpower: values.manpower,
          turnover: values.turnover,
          plant: values.plant,
          availabilityForInterview: {
            date: values.interviewDate || undefined,
            time: values.interviewTime
          },
          interviewMode: values.interviewMode,
          weeklyOff: selectedWeeklyOffs
        }
      }

      if (isEdit) {
        await api.put(`/cms/companies/${id}`, payload)
        toast.success('Company updated')
      } else {
        await api.post('/cms/companies', payload)
        toast.success('Company created')
      }

      navigate('/admin/cms/companies')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save company')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading company...</p>
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div>
        <button type="button" onClick={() => navigate('/admin/cms/companies')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {'<- Companies'}
        </button>
        <h1 className="text-2xl font-bold text-slate-950">{isEdit ? 'Edit Company' : 'Add Company'}</h1>
        <p className="mt-1 text-sm text-slate-500">Capture company details and manpower requirements.</p>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-950">Company Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Company Name" required error={errors.companyName?.message} {...register('companyName')} />
          <Input label="Company Address" {...register('companyAddress')} />
          <Input label="Contact Person Name" {...register('contactPersonName')} />
          <Input label="Contact Person Designation" {...register('contactPersonDesignation')} />
          <Input label="Mobile No" error={errors.mobileNo?.message} {...register('mobileNo')} />
          <Input label="Email Id" error={errors.emailId?.message} {...register('emailId')} />
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-950">Job Requirements</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Job Profile" {...register('jobProfile')} />
          <Input label="Education" {...register('education')} />
          <Input label="Experience" {...register('experience')} />
          <Input label="Salary Range" {...register('salaryRange')} />
          <Input label="Number of Vacancy" type="number" {...register('numberOfVacancy')} />
          <Input label="Job Time" {...register('jobTime')} />
          <Input label="Shift" {...register('shift')} />
          <Input label="Job Location" {...register('jobLocation')} />
          <Input label="Age Criteria" {...register('ageCriteria')} />
          <Input label="Caste Criteria" {...register('castCriteria')} />

          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Required Key Skills
            <div className="mt-1 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-cyan-100">
              <div className="mb-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {skill}
                    <button type="button" onClick={() => setSkills((current) => current.filter((item) => item !== skill))} aria-label="Remove skill">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addSkill()
                  }
                }}
                className="w-full px-1 py-1 outline-none"
                placeholder="Type and press Enter"
              />
            </div>
          </label>

          <Textarea label="Roles & Responsibility" className="sm:col-span-2" rows={3} {...register('rolesAndResponsibility')} />

          <ChoiceGroup label="Gender" values={['Male', 'Female', 'Any']} register={register('gender')} />
          <label className="text-sm font-semibold text-slate-700">
            Marriage Criteria
            <select
              {...register('marriageCriteria')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Any">Any</option>
            </select>
          </label>

          <CheckboxGrid label="Facilities" values={facilities} selected={selectedFacilities} onToggle={(value) => toggleValue(value, setSelectedFacilities)} />
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-950">About Company</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Manpower" {...register('manpower')} />
          <Input label="Turnover" {...register('turnover')} />
          <Input label="Plant" {...register('plant')} />
          <Input label="Interview Date" type="date" {...register('interviewDate')} />
          <Input label="Interview Time" type="time" {...register('interviewTime')} />
          <ChoiceGroup label="Interview Mode" values={['Online', 'Offline']} register={register('interviewMode')} />
          <CheckboxGrid label="Weekly Off" values={weeklyOffs} selected={selectedWeeklyOffs} onToggle={(value) => toggleValue(value, setSelectedWeeklyOffs)} />
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
      >
        {submitting ? 'Saving...' : isEdit ? 'Update Company' : 'Create Company'}
      </button>
    </form>
  )
}

const Input = forwardRef(function Input({ label, required, error, className = '', ...props }, ref) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label} {required && <span className="text-rose-500">*</span>}
      <input
        ref={ref}
        {...props}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
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

function ChoiceGroup({ label, values, register }) {
  return (
    <div className="text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2 flex flex-wrap gap-3">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
            <input type="radio" value={value} {...register} className="h-4 w-4 text-sky-600" />
            {value}
          </label>
        ))}
      </div>
    </div>
  )
}

function CheckboxGrid({ label, values, selected, onToggle }) {
  return (
    <div className="sm:col-span-2 text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} className="h-4 w-4 rounded text-sky-600" />
            {value}
          </label>
        ))}
      </div>
    </div>
  )
}
