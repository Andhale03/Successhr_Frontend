import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../api/axios'

const storageKey = 'candidates'

const inputClass =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full'

const cardClass = 'bg-white rounded-xl shadow-sm border border-gray-100'

const emptyCandidate = () => ({
  id: null,
  createdAt: '',
  fullName: '',
  mobile: '',
  aadhaarNo: '',
  email: '',
  dob: '',
  gender: '',
  currentLocation: '',
  education: '',
  experience: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  jobType: '',
  department: '',
  preferredLocation: '',
  skills: [],
  languages: [],
  referenceSource: '',
  additionalNotes: '',
  remarks: {
    verified: false,
    active: false,
    priority: false,
    blacklisted: false,
    experienced: false,
    fresher: false,
    available: false,
    onHold: false,
    shortlisted: false,
    caseClosed: false,
    remarkNote: ''
  },
  interviews: [{ id: Date.now(), companyName: '', referencePerson: '', remark: '', date: '', status: 'Pending', baId: '', commissionPercent: '' }],
  successUpdate: {
    selected: false,
    offerReceived: false,
    offerReleased: false,
    joined: false,
    notJoined: false,
    rejected: false,
    withdrawn: false,
    docsVerified: false,
    bgvInitiated: false,
    bgvDone: false,
    trainingStarted: false,
    confirmed: false,
    relieved: false,
    onHold: false,
    blacklisted: false,
    reApplied: false,
    followUpPending: false,
    refCheckDone: false,
    salaryNegotiated: false,
    caseClosed: false,
    finalJoiningDate: '',
    finalPackage: '',
    interviewerRemark: ''
  }
})

const loadCandidates = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

const saveCandidates = (items) => {
  localStorage.setItem(storageKey, JSON.stringify(items))
}

const generateCandidateId = (existing) => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `C${yy}${mm}`

  const current = Array.isArray(existing) ? existing : []
  const maxSeq = current
    .map((item) => String(item?.id || ''))
    .filter((value) => value.startsWith(prefix) && value.length === prefix.length + 4)
    .map((value) => Number(value.slice(-4)))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => (n > max ? n : max), 0)

  const nextSeq = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}${nextSeq}`
}

const sanitizeInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const hasContent = Boolean(
      String(row?.companyName || '').trim() ||
        String(row?.referencePerson || '').trim() ||
        String(row?.remark || '').trim() ||
        String(row?.date || '').trim()
    )
    const status = row?.status || 'Pending'
    return hasContent || status !== 'Pending'
  })

const remarkCards = [
  ['verified', 'Verified'],
  ['active', 'Active'],
  ['priority', 'Priority'],
  ['blacklisted', 'Blacklisted'],
  ['experienced', 'Experienced'],
  ['fresher', 'Fresher'],
  ['available', 'Available'],
  ['onHold', 'On Hold'],
  ['shortlisted', 'Shortlisted'],
  ['caseClosed', 'Case Closed']
]

const successCards = [
  ['selected', 'Selected'],
  ['offerReceived', 'Offer Received'],
  ['offerReleased', 'Offer Released'],
  ['joined', 'Joined'],
  ['notJoined', 'Not Joined'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
  ['docsVerified', 'Docs Verified'],
  ['bgvInitiated', 'BGV Initiated'],
  ['bgvDone', 'BGV Done'],
  ['trainingStarted', 'Training Started'],
  ['confirmed', 'Confirmed'],
  ['relieved', 'Relieved'],
  ['onHold', 'On Hold'],
  ['blacklisted', 'Blacklisted'],
  ['reApplied', 'Re-applied'],
  ['followUpPending', 'Follow Up Pending'],
  ['refCheckDone', 'Ref Check Done'],
  ['salaryNegotiated', 'Salary Negotiated'],
  ['caseClosed', 'Case Closed']
]

function ToggleCard({ checked, label, onToggle, variant }) {
  const base = 'cursor-pointer select-none rounded-lg border px-3 py-2 text-sm font-semibold transition'
  const styles =
    variant === 'success'
      ? checked
        ? 'border-green-500 bg-green-50 text-green-800'
        : 'border-[#e2e6f0] bg-gray-50 text-slate-700 hover:bg-white'
      : checked
        ? 'border-indigo-500 bg-purple-50 text-indigo-600'
        : 'border-[#e2e6f0] bg-gray-50 text-slate-700 hover:bg-white'

  return (
    <button type="button" onClick={onToggle} className={`${base} ${styles}`}>
      {label}
    </button>
  )
}

function StepTab({ index, title, active, completed, onClick }) {
  const circle = completed
    ? 'bg-green-500 text-white'
    : active
      ? 'bg-indigo-600 text-white'
      : 'bg-slate-100 text-slate-700'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-2 border-b-2 pb-3 text-left ${
        active ? 'border-indigo-600' : 'border-transparent'
      }`}
    >
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${circle}`}>{index}</span>
      <span className="text-sm font-semibold text-slate-800">{title}</span>
    </button>
  )
}

function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  const addTag = (raw) => {
    const tag = String(raw || '').trim()
    if (!tag) return
    if (value.includes(tag)) return
    onChange([...value, tag])
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(draft)
      setDraft('')
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
            {tag}
            <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => onChange(value.filter((t) => t !== tag))}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-w-[160px] flex-1 border-0 p-0 text-sm outline-none"
        />
      </div>
    </div>
  )
}

export default function AddCandidate() {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEdit = Boolean(id)
  const [step, setStep] = useState(1)
  const [candidate, setCandidate] = useState(() => emptyCandidate())
  const [errors, setErrors] = useState({})
  const [businessAdvisors, setBusinessAdvisors] = useState([])

  useEffect(() => {
    if (!isEdit) return
    const items = loadCandidates()
    const found = items.find((c) => String(c.id) === String(id))
    if (!found) {
      toast.error('Candidate not found')
      navigate('/admin/cms/candidates')
      return
    }
    const base = emptyCandidate()
    setCandidate({
      ...base,
      ...found,
      remarks: { ...base.remarks, ...(found.remarks || {}) },
      successUpdate: { ...base.successUpdate, ...(found.successUpdate || {}) },
      interviews: Array.isArray(found.interviews) && found.interviews.length ? found.interviews : base.interviews
    })
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

  const progress = useMemo(() => `${(step / 4) * 100}%`, [step])

  const update = (key, value) => setCandidate((c) => ({ ...c, [key]: value }))
  const updateRemarks = (key, value) => setCandidate((c) => ({ ...c, remarks: { ...c.remarks, [key]: value } }))
  const updateSuccess = (key, value) => setCandidate((c) => ({ ...c, successUpdate: { ...c.successUpdate, [key]: value } }))

  const validateStep1 = () => {
    const nextErrors = {}
    if (!candidate.fullName.trim()) nextErrors.fullName = 'Full Name is required'
    if (!candidate.mobile.trim()) nextErrors.mobile = 'Mobile is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const hasUniqueContact = () => {
    const items = loadCandidates()
    const selfId = isEdit ? String(id) : null

    const mobile = String(candidate.mobile || '').trim()
    const email = String(candidate.email || '').trim().toLowerCase()

    const mobileTaken = mobile
      ? items.some((c) => String(c.id) !== selfId && String(c.mobile || '').trim() === mobile)
      : false
    const emailTaken = email
      ? items.some((c) => String(c.id) !== selfId && String(c.email || '').trim().toLowerCase() === email)
      : false

    if (mobileTaken) {
      toast.error('Mobile number already exists')
      return false
    }
    if (emailTaken) {
      toast.error('Email already exists')
      return false
    }
    return true
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 1 && !hasUniqueContact()) return
    setStep((s) => Math.min(4, s + 1))
  }

  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  const save = () => {
    try {
      const items = loadCandidates()
      const selfId = isEdit ? String(id) : null
      const mobile = String(candidate.mobile || '').trim()
      const email = String(candidate.email || '').trim().toLowerCase()

      if (
        mobile &&
        items.some((c) => String(c.id) !== selfId && String(c.mobile || '').trim() === mobile)
      ) {
        toast.error('Mobile number already exists')
        return
      }

      if (
        email &&
        items.some((c) => String(c.id) !== selfId && String(c.email || '').trim().toLowerCase() === email)
      ) {
        toast.error('Email already exists')
        return
      }

      if (isEdit) {
        const next = items.map((c) =>
          String(c.id) === String(id) ? { ...candidate, id: c.id, interviews: sanitizeInterviews(candidate.interviews) } : c
        )
        saveCandidates(next)
        toast.success('✅ Candidate updated successfully!')
      } else {
        const record = {
          ...candidate,
          id: generateCandidateId(items),
          createdAt: new Date().toISOString(),
          interviews: sanitizeInterviews(candidate.interviews)
        }
        saveCandidates([record, ...items])
        toast.success('✅ Candidate saved successfully!')
      }
      navigate('/admin/cms/candidates')
    } catch (_error) {
      toast.error('Could not save candidate')
    }
  }

  return (
    <div className="space-y-6">
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-sky-400" style={{ width: progress }} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StepTab index={1} title="Candidate Info" active={step === 1} completed={step > 1} onClick={() => setStep(1)} />
        <StepTab index={2} title="Info of Success" active={step === 2} completed={step > 2} onClick={() => setStep(2)} />
        <StepTab index={3} title="Interview Companies" active={step === 3} completed={step > 3} onClick={() => setStep(3)} />
        <StepTab index={4} title="Success Update" active={step === 4} completed={false} onClick={() => setStep(4)} />
      </div>

      {step === 1 ? (
        <div className={`${cardClass} p-5 space-y-6`}>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Form 1 of 4 - Personal and professional details</div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-slate-500">Personal Details</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <input
                  className={`${inputClass} ${errors.fullName ? 'border-rose-400' : ''}`}
                  value={candidate.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Full Name*"
                />
                {errors.fullName ? <p className="mt-1 text-xs font-semibold text-rose-600">{errors.fullName}</p> : null}
              </div>
              <div>
                <input
                  className={`${inputClass} ${errors.mobile ? 'border-rose-400' : ''}`}
                  value={candidate.mobile}
                  onChange={(e) => update('mobile', e.target.value)}
                  placeholder="Mobile*"
                />
                {errors.mobile ? <p className="mt-1 text-xs font-semibold text-rose-600">{errors.mobile}</p> : null}
              </div>
              <input className={inputClass} value={candidate.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input className={inputClass} value={candidate.aadhaarNo} onChange={(e) => update('aadhaarNo', e.target.value)} placeholder="Aadhaar Number" />
              <input className={inputClass} type="date" value={candidate.dob} onChange={(e) => update('dob', e.target.value)} />
              <select className={inputClass} value={candidate.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input className={inputClass} value={candidate.currentLocation} onChange={(e) => update('currentLocation', e.target.value)} placeholder="Current Location" />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-slate-500">Professional Details</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <input className={inputClass} value={candidate.education} onChange={(e) => update('education', e.target.value)} placeholder="Education" />
              <input className={inputClass} value={candidate.experience} onChange={(e) => update('experience', e.target.value)} placeholder="Experience (yrs)" />
              <input className={inputClass} value={candidate.currentSalary} onChange={(e) => update('currentSalary', e.target.value)} placeholder="Current Salary" />
              <input className={inputClass} value={candidate.expectedSalary} onChange={(e) => update('expectedSalary', e.target.value)} placeholder="Expected Salary" />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <input className={inputClass} value={candidate.noticePeriod} onChange={(e) => update('noticePeriod', e.target.value)} placeholder="Notice Period" />
              <input className={inputClass} value={candidate.jobType} onChange={(e) => update('jobType', e.target.value)} placeholder="Job Type" />
              <input className={inputClass} value={candidate.department} onChange={(e) => update('department', e.target.value)} placeholder="Department" />
              <input className={inputClass} value={candidate.preferredLocation} onChange={(e) => update('preferredLocation', e.target.value)} placeholder="Preferred Location" />
            </div>
            <div>
              <TagInput value={candidate.skills} onChange={(skills) => update('skills', skills)} placeholder="Skills (type and press Enter)" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={inputClass}
                value={(candidate.languages || []).join(', ')}
                onChange={(e) =>
                  update(
                    'languages',
                    String(e.target.value || '')
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Languages Known (comma separated)"
              />
              <input className={inputClass} value={candidate.referenceSource} onChange={(e) => update('referenceSource', e.target.value)} placeholder="Reference Source" />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-slate-500">Additional Notes</h3>
            <textarea
              className={inputClass}
              rows={4}
              value={candidate.additionalNotes}
              onChange={(e) => update('additionalNotes', e.target.value)}
              placeholder="Additional Notes"
            />
          </section>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={`${cardClass} p-5 space-y-6`}>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Form 2 of 4 - Tag candidate current status</div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {remarkCards.map(([key, label]) => (
              <ToggleCard key={key} checked={Boolean(candidate.remarks?.[key])} label={label} onToggle={() => updateRemarks(key, !candidate.remarks?.[key])} />
            ))}
          </div>
          <textarea
            className={inputClass}
            rows={4}
            value={candidate.remarks.remarkNote}
            onChange={(e) => updateRemarks('remarkNote', e.target.value)}
            placeholder="Additional Remark"
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className={`${cardClass} p-5 space-y-4`}>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Form 3 of 4 - Companies this candidate was sent to</div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Reference Person</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {candidate.interviews.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        className={inputClass}
                        value={row.companyName}
                        onChange={(e) =>
                          setCandidate((c) => ({
                            ...c,
                            interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, companyName: e.target.value } : r))
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-2">
                        <select
                          className={inputClass}
                          value={row.baId || ''}
                          onChange={(e) => {
                            const baId = e.target.value
                            const profile = businessAdvisors.find((p) => String(p.userId?._id || p.userId) === String(baId))
                            const name = profile?.userId?.name || profile?.fullName || ''
                            const carriedPercent = profile?.commissionPercent ?? profile?.earningPercent ?? profile?.commissionRate ?? ''

                            setCandidate((c) => ({
                              ...c,
                              interviews: c.interviews.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      baId: baId || '',
                                      referencePerson: baId ? name : r.referencePerson,
                                      commissionPercent: baId ? String(carriedPercent ?? '') : r.commissionPercent
                                    }
                                  : r
                              )
                            }))
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
                          onChange={(e) =>
                            setCandidate((c) => ({
                              ...c,
                              interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, referencePerson: e.target.value } : r))
                            }))
                          }
                          placeholder="Reference person name (optional)"
                        />

                        <input
                          className={inputClass}
                          value={row.commissionPercent || ''}
                          onChange={(e) =>
                            setCandidate((c) => ({
                              ...c,
                              interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, commissionPercent: e.target.value } : r))
                            }))
                          }
                          placeholder="Commission % (optional)"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className={inputClass}
                        value={row.remark}
                        onChange={(e) =>
                          setCandidate((c) => ({
                            ...c,
                            interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, remark: e.target.value } : r))
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className={inputClass}
                        type="date"
                        value={row.date}
                        onChange={(e) =>
                          setCandidate((c) => ({
                            ...c,
                            interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, date: e.target.value } : r))
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className={inputClass}
                        value={row.status}
                        onChange={(e) =>
                          setCandidate((c) => ({
                            ...c,
                            interviews: c.interviews.map((r) => (r.id === row.id ? { ...r, status: e.target.value } : r))
                          }))
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setCandidate((c) => ({ ...c, interviews: c.interviews.filter((r) => r.id !== row.id) }))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="Delete row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() =>
              setCandidate((c) => ({
                ...c,
                interviews: [
                  ...c.interviews,
                  { id: Date.now(), companyName: '', referencePerson: '', remark: '', date: '', status: 'Pending', baId: '', commissionPercent: '' }
                ]
              }))
            }
            className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Add Another Company
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className={`${cardClass} p-5 space-y-6`}>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Form 4 of 4 - Final placement outcome</div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {successCards.map(([key, label]) => (
              <ToggleCard
                key={key}
                variant="success"
                checked={Boolean(candidate.successUpdate?.[key])}
                label={label}
                onToggle={() => updateSuccess(key, !candidate.successUpdate?.[key])}
              />
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className={inputClass}
              type="date"
              value={candidate.successUpdate.finalJoiningDate}
              onChange={(e) => updateSuccess('finalJoiningDate', e.target.value)}
              placeholder="Final Joining Date"
            />
            <input
              className={inputClass}
              value={candidate.successUpdate.finalPackage}
              onChange={(e) => updateSuccess('finalPackage', e.target.value)}
              placeholder="Final Package (₹)"
            />
          </div>

          <textarea
            className={inputClass}
            rows={4}
            value={candidate.successUpdate.interviewerRemark}
            onChange={(e) => updateSuccess('interviewerRemark', e.target.value)}
            placeholder="Interviewer Final Remark"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button type="button" onClick={prevStep} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button type="button" onClick={nextStep} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Next →
          </button>
        ) : (
          <button type="button" onClick={save} className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            💾 Save
          </button>
        )}
      </div>
    </div>
  )
}
