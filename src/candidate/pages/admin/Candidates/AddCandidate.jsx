import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BriefcaseBusiness, ClipboardList, MapPin, Plus, Save, Trash2, UserRound, Users } from 'lucide-react'
import api from '../../../api/axios'
import {
  PERSONALITY_RATING_FIELDS,
  PROFESSIONAL_RATING_FIELDS,
  QUESTION_CHOICES,
  RATING_VALUES,
  calculateQuestionMarksResult,
  emptyCandidateForm,
  emptyInterviewRow,
  emptyQuestionRow,
  interviewHasContent,
  isMongoId,
  mapApiToCandidateForm,
  mapCandidateFormToApi,
  mapFormInterviewToApi,
  normalizeQuestionMarks,
  sanitizeInterviews,
  toggleSelection
} from './candidateFormModel'

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
const textAreaClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
const labelClass = 'text-sm font-semibold text-slate-700'
const cardClass = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5'
const editablePanels = new Set(['details', 'assessment', 'interviews'])
const panelFromSearch = (searchParams) => {
  const panel = searchParams.get('panel')
  return editablePanels.has(panel) ? panel : 'details'
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className={`${cardClass} space-y-5`}>
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {Icon ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, error, className = '', children }) {
  return (
    <label className={`${labelClass} ${className}`}>
      <span>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p> : null}
    </label>
  )
}

function FieldGroup({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        {Icon ? <Icon className="h-4 w-4 text-indigo-500" /> : null}
        {title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  )
}

function FormTabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-3 text-sm font-semibold ${
        active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function RatingGrid({ title, fields, ratings, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Rate following parameters: 1 lowest and 5 highest</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">Sr.</th>
              <th className="min-w-56 px-4 py-3">Parameters</th>
              {RATING_VALUES.map((value) => (
                <th key={value} className="w-16 px-4 py-3 text-center">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, index) => {
              const selected = ratings?.[field.key] || []
              return (
                <tr key={field.key} className="odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{field.label}</td>
                  {RATING_VALUES.map((value) => (
                    <td key={value} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.some((item) => Number(item) === value)}
                        onChange={() => onToggle(field.key, value)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        aria-label={`${field.label} ${value}`}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuestionMarksResultTable({ questions, onMarksChange }) {
  const result = calculateQuestionMarksResult(questions, { preserveRows: true })

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-white">
      <table className="min-w-[1200px] border-collapse text-center text-sm text-slate-950">
        <tbody>
          <tr>
            <th className="w-28 border border-slate-900 px-3 py-3 text-lg font-bold">IQ</th>
            {result.scores.map((_score, index) => (
              <th key={index} className="w-16 border border-slate-900 px-3 py-3 text-lg font-bold">
                {index + 1}
              </th>
            ))}
            <th className="w-28 border border-slate-900 px-3 py-3 text-lg font-bold">TQ</th>
          </tr>
          <tr>
            <th className="border border-slate-900 px-3 py-3 text-lg font-bold">Marks</th>
            {result.rows.map((row, index) => (
              <td key={index} className="h-12 border border-slate-900 p-0 font-semibold">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={row.marks || ''}
                  onChange={(event) => onMarksChange(index, event.target.value)}
                  className="h-12 w-full border-0 bg-transparent text-center text-sm font-semibold text-slate-950 outline-none focus:bg-indigo-50 focus:ring-0"
                  aria-label={`Question ${index + 1} marks`}
                />
              </td>
            ))}
            <td className="relative h-12 border border-slate-900 px-3 py-3 align-bottom font-bold">
              <span className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_49%,#0f172a_50%,transparent_51%)]" />
              <span className="relative z-10">
                {result.total}/{result.maxTotal}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function InterviewQuestionsForm({ candidateName, questions, onQuestionChange, onChoiceToggle, onAddQuestion }) {
  return (
    <div className="rounded-xl border-2 border-slate-900 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <p className="shrink-0 text-base font-bold text-slate-950 sm:text-lg">Candidate Name -</p>
        <div className="min-h-9 flex-1 border-b-2 border-slate-900 px-2 py-1 text-sm font-semibold text-slate-900 sm:text-base">
          {candidateName || ''}
        </div>
      </div>

      <div className="mt-7 text-center">
        <span className="inline-flex bg-slate-950 px-2 py-1 text-base font-bold text-white sm:text-lg">Interview Questions</span>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onAddQuestion}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {(questions || []).map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_180px] md:items-center">
            <div className="text-sm font-bold text-slate-950 sm:text-base">{index + 1}.</div>
            <input
              value={row.question || ''}
              onChange={(event) => onQuestionChange(index, event.target.value)}
              className="h-10 min-w-0 border-0 border-b-2 border-slate-900 bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-0"
              aria-label={`Interview question ${index + 1}`}
            />
            <div className="grid grid-cols-3 overflow-hidden border border-slate-900">
              {QUESTION_CHOICES.map((choice) => {
                const checked = (row.choices || []).includes(choice)
                return (
                  <label
                    key={choice}
                    className={`flex h-9 cursor-pointer items-center justify-center gap-2 border-r border-slate-900 text-sm font-bold last:border-r-0 ${
                      checked ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChoiceToggle(index, choice)}
                      className="h-4 w-4 rounded border-slate-400 text-indigo-600"
                      aria-label={`Question ${index + 1} option ${choice}`}
                    />
                    {choice}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AddCandidate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  const [candidate, setCandidate] = useState(() => emptyCandidateForm())
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [businessAdvisors, setBusinessAdvisors] = useState([])
  const [activePanel, setActivePanel] = useState(() => (isEdit ? panelFromSearch(searchParams) : 'details'))

  useEffect(() => {
    setActivePanel(isEdit ? panelFromSearch(searchParams) : 'details')
  }, [isEdit, searchParams])

  useEffect(() => {
    if (!isEdit) return

    const loadCandidate = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        setCandidate(mapApiToCandidateForm(data))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Candidate not found')
        navigate('/admin/cms/candidates')
      } finally {
        setLoading(false)
      }
    }

    loadCandidate()
  }, [id, isEdit, navigate])

  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const { data } = await api.get('/ba/all')
        setBusinessAdvisors(Array.isArray(data) ? data : [])
      } catch (_error) {
        setBusinessAdvisors([])
      }
    }

    loadAdvisors()
  }, [])

  const update = (key, value) => setCandidate((current) => ({ ...current, [key]: value }))

  const updateMeta = (key, value) =>
    setCandidate((current) => ({
      ...current,
      formMeta: { ...current.formMeta, [key]: value }
    }))

  const updateFamily = (key, value) =>
    setCandidate((current) => ({
      ...current,
      familyDetails: { ...current.familyDetails, [key]: value }
    }))

  const updateInterviewForm = (key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: { ...current.interviewForm, [key]: value }
    }))

  const toggleRating = (bucket, key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        [bucket]: {
          ...current.interviewForm[bucket],
          [key]: toggleSelection(current.interviewForm[bucket]?.[key], value, RATING_VALUES)
        }
      }
    }))

  const updateQuestion = (index, question) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      questions[index] = {
        ...(questions[index] || { choices: [] }),
        question
      }

      return {
        ...current,
        interviewForm: {
          ...current.interviewForm,
          questions
        }
      }
    })

  const toggleQuestionChoice = (index, choice) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      const row = questions[index] || { question: '', choices: [] }
      questions[index] = {
        ...row,
        choices: toggleSelection(row.choices, choice, QUESTION_CHOICES)
      }

      return {
        ...current,
        interviewForm: {
          ...current.interviewForm,
          questions
        }
      }
    })

  const updateQuestionMarks = (index, marks) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      questions[index] = {
        ...(questions[index] || { question: '', choices: [] }),
        marks: normalizeQuestionMarks(marks)
      }

      return {
        ...current,
        interviewForm: {
          ...current.interviewForm,
          questions
        }
      }
    })

  const addQuestion = () =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        questions: [...(current.interviewForm.questions || []), emptyQuestionRow()]
      }
    }))

  const updateInterview = (rowId, patch) =>
    setCandidate((current) => ({
      ...current,
      interviews: current.interviews.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
    }))

  const validate = () => {
    const nextErrors = {}
    if (!candidate.fullName.trim()) nextErrors.fullName = 'Candidate name is required'
    if (!candidate.mobile.trim()) nextErrors.mobile = 'Mobile number is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast.error('Please fill required candidate details')
      return
    }

    const incompleteInterview = candidate.interviews.find((row) => interviewHasContent(row) && !String(row.companyName || '').trim())
    if (incompleteInterview) {
      toast.error('Company name is required for interview rows')
      return
    }

    try {
      setSaving(true)
      const payload = mapCandidateFormToApi(candidate)
      let candidateId = id

      if (isEdit) {
        await api.put(`/cms/candidates/${id}`, payload)
      } else {
        const { data } = await api.post('/cms/candidates', payload)
        candidateId = data?._id
      }

      const desiredRows = sanitizeInterviews(candidate.interviews)
      const { data: existingRaw } = await api.get(`/cms/candidates/${candidateId}/interviews`)
      const existingRows = Array.isArray(existingRaw) ? existingRaw : []
      const desiredById = new Map(desiredRows.filter((row) => isMongoId(row.id)).map((row) => [String(row.id), row]))

      await Promise.all(
        existingRows.map((row) => {
          const match = desiredById.get(String(row._id))
          if (!match) return api.delete(`/cms/interviews/${row._id}`)
          return api.put(`/cms/interviews/${row._id}`, mapFormInterviewToApi(match))
        })
      )

      await Promise.all(
        desiredRows
          .filter((row) => !isMongoId(row.id))
          .map((row) => api.post(`/cms/candidates/${candidateId}/interviews`, mapFormInterviewToApi(row)))
      )

      toast.success(isEdit ? 'Candidate updated successfully' : 'Candidate saved successfully')
      navigate('/admin/cms/candidates')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save candidate')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={cardClass}>Loading candidate...</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/candidates')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
          {candidate.candidateCode ? <p className="mt-1 text-sm font-semibold text-slate-500">Candidate ID: {candidate.candidateCode}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/admin/cms/candidates')}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Candidate'}
          </button>
        </div>
      </div>

      {isEdit ? (
        <div className="flex flex-wrap gap-2">
          <FormTabButton active={activePanel === 'details'} label="Details" onClick={() => setActivePanel('details')} />
          <FormTabButton active={activePanel === 'assessment'} label="Assessment" onClick={() => setActivePanel('assessment')} />
          <FormTabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => setActivePanel('interviews')} />
        </div>
      ) : null}

      {!isEdit || activePanel === 'details' ? (
        <>
          <Section title="Receipt Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Day">
                <input className={inputClass} value={candidate.formMeta.day} onChange={(event) => updateMeta('day', event.target.value)} />
              </Field>
              <Field label="Receipt No">
                <input className={inputClass} value={candidate.formMeta.receiptNo} onChange={(event) => updateMeta('receiptNo', event.target.value)} />
              </Field>
              <Field label="RC / WRC">
                <input className={inputClass} value={candidate.formMeta.rcWrc} onChange={(event) => updateMeta('rcWrc', event.target.value)} />
              </Field>
              <Field label="Date">
                <input className={inputClass} type="date" value={candidate.formMeta.date} onChange={(event) => updateMeta('date', event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Candidate Details">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Candidate Name" required error={errors.fullName}>
                <input
                  className={`${inputClass} ${errors.fullName ? 'border-rose-400' : ''}`}
                  value={candidate.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                />
              </Field>
              <Field label="College Name">
                <input className={inputClass} value={candidate.collegeName} onChange={(event) => update('collegeName', event.target.value)} />
              </Field>
              <Field label="Mobile No" required error={errors.mobile}>
                <input
                  className={`${inputClass} ${errors.mobile ? 'border-rose-400' : ''}`}
                  value={candidate.mobile}
                  onChange={(event) => update('mobile', event.target.value)}
                />
              </Field>
              <Field label="WhatsApp No">
                <input className={inputClass} value={candidate.whatsappNo} onChange={(event) => update('whatsappNo', event.target.value)} />
              </Field>
              <Field label="Email ID">
                <input className={inputClass} type="email" value={candidate.email} onChange={(event) => update('email', event.target.value)} />
              </Field>
              <Field label="Education">
                <input className={inputClass} value={candidate.education} onChange={(event) => update('education', event.target.value)} />
              </Field>
              <Field label="Applied For">
                <input className={inputClass} value={candidate.appliedFor} onChange={(event) => update('appliedFor', event.target.value)} />
              </Field>
              <Field label="Preferred Job Location">
                <input className={inputClass} value={candidate.preferredJobLocation} onChange={(event) => update('preferredJobLocation', event.target.value)} />
              </Field>
              <Field label="Experience (Years)">
                <input className={inputClass} type="number" min="0" step="0.1" value={candidate.totalExperience} onChange={(event) => update('totalExperience', event.target.value)} />
              </Field>
              <Field label="Experience Department">
                <input className={inputClass} value={candidate.experienceDepartment} onChange={(event) => update('experienceDepartment', event.target.value)} />
              </Field>
              <Field label="Current Salary">
                <input className={inputClass} value={candidate.currentSalary} onChange={(event) => update('currentSalary', event.target.value)} />
              </Field>
              <Field label="Expected Salary">
                <input className={inputClass} value={candidate.expectedSalary} onChange={(event) => update('expectedSalary', event.target.value)} />
              </Field>
              <Field label="Notice Period">
                <input className={inputClass} value={candidate.noticePeriod} onChange={(event) => update('noticePeriod', event.target.value)} />
              </Field>
              <Field label="Current Job Location">
                <input className={inputClass} value={candidate.currentJobLocation} onChange={(event) => update('currentJobLocation', event.target.value)} />
              </Field>
              <Field label="Reason Of Job Change">
                <input className={inputClass} value={candidate.reasonForJobChange} onChange={(event) => update('reasonForJobChange', event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Family Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Occupation Of Father">
                <input className={inputClass} value={candidate.familyDetails.fatherOccupation} onChange={(event) => updateFamily('fatherOccupation', event.target.value)} />
              </Field>
              <Field label="Occupation Of Mother">
                <input className={inputClass} value={candidate.familyDetails.motherOccupation} onChange={(event) => updateFamily('motherOccupation', event.target.value)} />
              </Field>
              <Field label="Occupation Of Brother">
                <input className={inputClass} value={candidate.familyDetails.brotherOccupation} onChange={(event) => updateFamily('brotherOccupation', event.target.value)} />
              </Field>
              <Field label="Occupation Of Sister">
                <input className={inputClass} value={candidate.familyDetails.sisterOccupation} onChange={(event) => updateFamily('sisterOccupation', event.target.value)} />
              </Field>
              <Field label="What is your Goal / Aim?">
                <textarea className={textAreaClass} rows={4} value={candidate.goalAim} onChange={(event) => update('goalAim', event.target.value)} />
              </Field>
            </div>
          </Section>
        </>
      ) : null}

      {isEdit && activePanel === 'assessment' ? (
        <Section title="Interview Form">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Suitable Industry">
              <input className={inputClass} value={candidate.interviewForm.suitableIndustry} onChange={(event) => updateInterviewForm('suitableIndustry', event.target.value)} />
            </Field>
            <Field label="Suitable Department">
              <input className={inputClass} value={candidate.interviewForm.suitableDepartment} onChange={(event) => updateInterviewForm('suitableDepartment', event.target.value)} />
            </Field>
            <Field label="HR Interviewer">
              <input className={inputClass} value={candidate.interviewForm.hrInterviewer} onChange={(event) => updateInterviewForm('hrInterviewer', event.target.value)} />
            </Field>
            <Field label="Remark">
              <input className={inputClass} value={candidate.interviewForm.remark} onChange={(event) => updateInterviewForm('remark', event.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RatingGrid
              title="Professional Assessment"
              fields={PROFESSIONAL_RATING_FIELDS}
              ratings={candidate.interviewForm.professionalRatings}
              onToggle={(key, value) => toggleRating('professionalRatings', key, value)}
            />
            <RatingGrid
              title="Personality Assessment"
              fields={PERSONALITY_RATING_FIELDS}
              ratings={candidate.interviewForm.personalityRatings}
              onToggle={(key, value) => toggleRating('personalityRatings', key, value)}
            />
          </div>

          <InterviewQuestionsForm
            candidateName={candidate.fullName}
            questions={candidate.interviewForm.questions}
            onQuestionChange={updateQuestion}
            onChoiceToggle={toggleQuestionChoice}
            onAddQuestion={addQuestion}
          />
          <QuestionMarksResultTable questions={candidate.interviewForm.questions} onMarksChange={updateQuestionMarks} />
        </Section>
      ) : null}

      {isEdit && activePanel === 'interviews' ? (
        <Section title="Company Interviews">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="w-14 px-4 py-3">#</th>
                <th className="min-w-56 px-4 py-3">Company Name</th>
                <th className="min-w-72 px-4 py-3">Reference Person</th>
                <th className="min-w-52 px-4 py-3">Remark</th>
                <th className="min-w-44 px-4 py-3">Date</th>
                <th className="min-w-44 px-4 py-3">Status</th>
                <th className="w-20 px-4 py-3">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidate.interviews.map((row, index) => (
                <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input className={inputClass} value={row.companyName} onChange={(event) => updateInterview(row.id, { companyName: event.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <select
                        className={inputClass}
                        value={row.baId || ''}
                        onChange={(event) => {
                          const baId = event.target.value
                          const profile = businessAdvisors.find((item) => String(item.userId?._id || item.userId) === String(baId))
                          const name = profile?.userId?.name || profile?.fullName || ''
                          const percent = profile?.commissionPercent ?? profile?.earningPercent ?? profile?.commissionRate ?? ''
                          updateInterview(row.id, {
                            baId,
                            referencePerson: baId ? name : row.referencePerson,
                            commissionPercent: baId ? String(percent ?? '') : row.commissionPercent
                          })
                        }}
                      >
                        <option value="">Select Advisor (optional)</option>
                        {businessAdvisors.map((profile) => {
                          const baId = profile.userId?._id || profile.userId
                          const label = profile.userId?.name || profile.fullName || profile.userId?.email || 'Advisor'
                          if (!baId) return null
                          return (
                            <option key={baId} value={baId}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                      <input
                        className={inputClass}
                        value={row.referencePerson}
                        onChange={(event) => updateInterview(row.id, { referencePerson: event.target.value })}
                        placeholder="Reference person name"
                      />
                      <input
                        className={inputClass}
                        value={row.commissionPercent || ''}
                        onChange={(event) => updateInterview(row.id, { commissionPercent: event.target.value })}
                        placeholder="Commission %"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass} value={row.remark} onChange={(event) => updateInterview(row.id, { remark: event.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass} type="date" value={row.date} onChange={(event) => updateInterview(row.id, { date: event.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <select className={inputClass} value={row.status} onChange={(event) => updateInterview(row.id, { status: event.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setCandidate((current) => ({ ...current, interviews: current.interviews.filter((item) => item.id !== row.id) }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                      aria-label="Delete interview row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => setCandidate((current) => ({ ...current, interviews: [...current.interviews, emptyInterviewRow()] }))}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Another Company
        </button>
        </Section>
      ) : null}

      <div className="flex flex-col justify-end gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('/admin/cms/candidates')}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Candidate'}
        </button>
      </div>
    </div>
  )
}
