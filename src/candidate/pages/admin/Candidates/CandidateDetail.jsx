import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ExternalLink, FileImage, Pencil } from 'lucide-react'
import api, { assetUrl } from '../../../api/axios'
import {
  PERSONALITY_RATING_FIELDS,
  PROFESSIONAL_RATING_FIELDS,
  QUESTION_CHOICES,
  RATING_VALUES,
  calculateQuestionMarksResult,
  interviewHasContent,
  mapApiToCandidateForm
} from './candidateFormModel'

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none'
const textAreaClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none'
const labelClass = 'text-sm font-semibold text-slate-700'
const cardClass = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5'

const dateLabel = (value) => (value ? String(value).slice(0, 10) : '')
const fieldValue = (value) => (value === null || value === undefined ? '' : String(value))
const editablePanels = new Set(['details', 'assessment', 'interviews'])
const isImageDocument = (doc) => String(doc?.mimeType || '').startsWith('image/') || /\.(jpe?g|png)$/i.test(String(doc?.fileName || doc?.fileUrl || ''))

const formatDocumentDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Section({ title, children }) {
  return (
    <section className={`${cardClass} space-y-4`}>
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function TabButton({ active, label, onClick }) {
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

function ReadOnlyInput({ value, type = 'text', placeholder, onEditHint }) {
  return (
    <input
      className={`${inputClass} cursor-pointer`}
      type={type}
      value={fieldValue(value)}
      placeholder={placeholder}
      readOnly
      onClick={onEditHint}
    />
  )
}

function ReadOnlyTextArea({ value, rows = 4, onEditHint }) {
  return <textarea className={`${textAreaClass} cursor-pointer`} rows={rows} value={fieldValue(value)} readOnly onClick={onEditHint} />
}

function DocumentCard({ doc }) {
  const url = assetUrl(doc.fileUrl)
  const uploadedAt = formatDocumentDate(doc.uploadedAt)

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200">
        {isImageDocument(doc) && url ? (
          <img src={url} alt={doc.documentLabel || doc.fileName || 'Uploaded document'} className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{doc.documentLabel || 'Document'}</p>
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-600">{doc.fileName || 'Uploaded image'}</p>
        {uploadedAt ? <p className="mt-1 text-xs text-slate-500">Uploaded {uploadedAt}</p> : null}
      </div>
    </a>
  )
}

function RatingGrid({ title, fields, ratings, onEditHint }) {
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
                        readOnly
                        onClick={onEditHint}
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

function QuestionMarksResultTable({ questions }) {
  const result = calculateQuestionMarksResult(questions)

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
            {result.scores.map((score, index) => (
              <td key={index} className="h-12 border border-slate-900 px-3 py-3 font-semibold">
                {Number.isFinite(score) ? score : ''}
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

function InterviewQuestionsView({ candidateName, questions, onEditHint }) {
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

      <div className="mt-6 space-y-3">
        {(questions || []).map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_180px] md:items-center">
            <div className="text-sm font-bold text-slate-950 sm:text-base">{index + 1}.</div>
            <input
              value={fieldValue(row.question)}
              readOnly
              onClick={onEditHint}
              className="h-10 min-w-0 cursor-pointer border-0 border-b-2 border-slate-900 bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none"
              aria-label={`Interview question ${index + 1}`}
            />
            <div className="grid grid-cols-3 overflow-hidden border border-slate-900">
              {QUESTION_CHOICES.map((choice) => {
                const checked = (row.choices || []).includes(choice)
                return (
                  <span
                    key={choice}
                    onClick={onEditHint}
                    className={`flex h-9 cursor-pointer items-center justify-center gap-2 border-r border-slate-900 text-sm font-bold last:border-r-0 ${
                      checked ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="h-4 w-4 rounded border-slate-400 text-indigo-600"
                      aria-label={`Question ${index + 1} option ${choice}`}
                    />
                    {choice}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CandidateDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activePanel, setActivePanel] = useState('details')
  const [candidate, setCandidate] = useState(null)

  const showEditHint = () => {
    toast('View mode only. Click Update to edit this candidate.', {
      id: 'candidate-view-edit-hint',
      icon: '!'
    })
  }

  const goToEdit = () => {
    const panel = editablePanels.has(activePanel) ? activePanel : 'details'
    navigate(`/admin/cms/candidates/${id}/edit?panel=${panel}`)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        setCandidate(mapApiToCandidateForm(data))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Candidate not found')
        navigate('/admin/cms/candidates')
      }
    }

    load()
  }, [id, navigate])

  const visibleInterviews = useMemo(() => (candidate?.interviews || []).filter(interviewHasContent), [candidate])

  if (!candidate) return <div className={cardClass}>Loading candidate...</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/candidates')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{candidate.fullName}</h1>
          {candidate.candidateCode ? <p className="text-sm font-semibold text-slate-500">{candidate.candidateCode}</p> : null}
        </div>
        <button
          type="button"
          onClick={goToEdit}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
        >
          <Pencil className="h-4 w-4" />
          Update
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activePanel === 'details'} label="Details" onClick={() => setActivePanel('details')} />
        <TabButton active={activePanel === 'assessment'} label="Assessment" onClick={() => setActivePanel('assessment')} />
        <TabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => setActivePanel('interviews')} />
      </div>

      {activePanel === 'details' ? (
        <>
          <Section title="Receipt Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Day">
                <ReadOnlyInput value={candidate.formMeta.day} onEditHint={showEditHint} />
              </Field>
              <Field label="Receipt No">
                <ReadOnlyInput value={candidate.formMeta.receiptNo} onEditHint={showEditHint} />
              </Field>
              <Field label="RC / WRC">
                <ReadOnlyInput value={candidate.formMeta.rcWrc} onEditHint={showEditHint} />
              </Field>
              <Field label="Date">
                <ReadOnlyInput type="date" value={dateLabel(candidate.formMeta.date)} onEditHint={showEditHint} />
              </Field>
            </div>
          </Section>

          <Section title="Candidate Details">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Candidate Name">
                <ReadOnlyInput value={candidate.fullName} onEditHint={showEditHint} />
              </Field>
              <Field label="College Name">
                <ReadOnlyInput value={candidate.collegeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Mobile No">
                <ReadOnlyInput value={candidate.mobile} onEditHint={showEditHint} />
              </Field>
              <Field label="WhatsApp No">
                <ReadOnlyInput value={candidate.whatsappNo} onEditHint={showEditHint} />
              </Field>
              <Field label="Email ID">
                <ReadOnlyInput type="email" value={candidate.email} onEditHint={showEditHint} />
              </Field>
              <Field label="Education">
                <ReadOnlyInput value={candidate.education} onEditHint={showEditHint} />
              </Field>
              <Field label="Applied For">
                <ReadOnlyInput value={candidate.appliedFor} onEditHint={showEditHint} />
              </Field>
              <Field label="Preferred Job Location">
                <ReadOnlyInput value={candidate.preferredJobLocation} onEditHint={showEditHint} />
              </Field>
              <Field label="Experience (Years)">
                <ReadOnlyInput type="number" value={candidate.totalExperience} onEditHint={showEditHint} />
              </Field>
              <Field label="Experience Department">
                <ReadOnlyInput value={candidate.experienceDepartment} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Salary">
                <ReadOnlyInput value={candidate.currentSalary} onEditHint={showEditHint} />
              </Field>
              <Field label="Expected Salary">
                <ReadOnlyInput value={candidate.expectedSalary} onEditHint={showEditHint} />
              </Field>
              <Field label="Notice Period">
                <ReadOnlyInput value={candidate.noticePeriod} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Job Location">
                <ReadOnlyInput value={candidate.currentJobLocation} onEditHint={showEditHint} />
              </Field>
              <Field label="Reason Of Job Change">
                <ReadOnlyInput value={candidate.reasonForJobChange} onEditHint={showEditHint} />
              </Field>
            </div>
          </Section>

          <Section title="Uploaded Documents">
            {candidate.documents?.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {candidate.documents.map((doc, index) => (
                  <DocumentCard key={doc._id || `${doc.fileUrl}-${index}`} doc={doc} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-500">No documents uploaded.</p>
            )}
          </Section>

          <Section title="Family Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Occupation Of Father">
                <ReadOnlyInput value={candidate.familyDetails.fatherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Occupation Of Mother">
                <ReadOnlyInput value={candidate.familyDetails.motherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Occupation Of Brother">
                <ReadOnlyInput value={candidate.familyDetails.brotherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Occupation Of Sister">
                <ReadOnlyInput value={candidate.familyDetails.sisterOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="What is your Goal / Aim?">
                <ReadOnlyTextArea value={candidate.goalAim} onEditHint={showEditHint} />
              </Field>
            </div>
          </Section>
        </>
      ) : null}

      {activePanel === 'assessment' ? (
        <Section title="Interview Form">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Suitable Industry">
              <ReadOnlyInput value={candidate.interviewForm.suitableIndustry} onEditHint={showEditHint} />
            </Field>
            <Field label="Suitable Department">
              <ReadOnlyInput value={candidate.interviewForm.suitableDepartment} onEditHint={showEditHint} />
            </Field>
            <Field label="HR Interviewer">
              <ReadOnlyInput value={candidate.interviewForm.hrInterviewer} onEditHint={showEditHint} />
            </Field>
            <Field label="Remark">
              <ReadOnlyInput value={candidate.interviewForm.remark} onEditHint={showEditHint} />
            </Field>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RatingGrid title="Professional Assessment" fields={PROFESSIONAL_RATING_FIELDS} ratings={candidate.interviewForm.professionalRatings} onEditHint={showEditHint} />
            <RatingGrid title="Personality Assessment" fields={PERSONALITY_RATING_FIELDS} ratings={candidate.interviewForm.personalityRatings} onEditHint={showEditHint} />
          </div>

          <InterviewQuestionsView candidateName={candidate.fullName} questions={candidate.interviewForm.questions} onEditHint={showEditHint} />
          <QuestionMarksResultTable questions={candidate.interviewForm.questions} />
        </Section>
      ) : null}

      {activePanel === 'interviews' ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleInterviews.map((row, index) => (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <ReadOnlyInput value={row.companyName} onEditHint={showEditHint} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <ReadOnlyInput value={row.referencePerson} placeholder="Reference person name" onEditHint={showEditHint} />
                        <ReadOnlyInput value={row.commissionPercent} placeholder="Commission %" onEditHint={showEditHint} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ReadOnlyInput value={row.remark} onEditHint={showEditHint} />
                    </td>
                    <td className="px-4 py-3">
                      <ReadOnlyInput type="date" value={row.date} onEditHint={showEditHint} />
                    </td>
                    <td className="px-4 py-3">
                      <ReadOnlyInput value={row.status || 'Pending'} onEditHint={showEditHint} />
                    </td>
                  </tr>
                ))}
                {visibleInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No interviews.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </div>
  )
}
