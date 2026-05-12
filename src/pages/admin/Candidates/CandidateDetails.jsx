import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil, Trash2 } from 'lucide-react'
import api from '../../../api/axios'
import { ConfirmDialog } from '../../../components/ActionDialogs'

const successRemarkKeys = [
  ['resumeReady', 'Resume Ready'],
  ['educationVerified', 'Education Verified'],
  ['experienceVerified', 'Experience Verified'],
  ['skillsAssessed', 'Skills Assessed'],
  ['backgroundChecked', 'Background Checked'],
  ['referenceVerified', 'Reference Verified'],
  ['documentsCollected', 'Documents Collected'],
  ['salaryNegotiated', 'Salary Negotiated'],
  ['offerAccepted', 'Offer Accepted'],
  ['joiningConfirmed', 'Joining Confirmed']
]

const processRemarkSections = [
  {
    title: 'Joining Process',
    keys: [
      ['documentsSubmitted', 'Documents Submitted'],
      ['offerLetterReceived', 'Offer Letter Received'],
      ['appointmentLetterGiven', 'Appointment Letter Given'],
      ['joiningDateConfirmed', 'Joining Date Confirmed'],
      ['joiningCompleted', 'Joining Completed']
    ]
  },
  {
    title: 'Compliance',
    keys: [
      ['pfEnrolled', 'PF Enrolled'],
      ['esicEnrolled', 'ESIC Enrolled'],
      ['backgroundCheckDone', 'Background Check Done'],
      ['salaryAccountOpened', 'Salary Account Opened']
    ]
  },
  {
    title: 'Onboarding',
    keys: [
      ['trainingCompleted', 'Training Completed'],
      ['idCardIssued', 'ID Card Issued'],
      ['uniformProvided', 'Uniform Provided'],
      ['firstSalaryReceived', 'First Salary Received'],
      ['probationCompleted', 'Probation Completed']
    ]
  },
  {
    title: 'Exit / Closure',
    keys: [
      ['permanentEmployment', 'Permanent Employment'],
      ['exitFormalitiesDone', 'Exit Formalities Done'],
      ['noDuesCertificate', 'No Dues Certificate'],
      ['experienceLetterGiven', 'Experience Letter Given'],
      ['relievingLetterGiven', 'Relieving Letter Given'],
      ['feedbackCollected', 'Feedback Collected']
    ]
  }
]

const emptyInterviewForm = { companyName: '', reference: '', interviewDate: '', remark: '', result: 'Pending' }

const dateValue = (value) => (value ? String(value).slice(0, 10) : '')

const formatUpdatedAt = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CandidateDetails() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [remark, setRemark] = useState(null)
  const [interviewForm, setInterviewForm] = useState(emptyInterviewForm)
  const [editingInterviewId, setEditingInterviewId] = useState(null)
  const [savingInterview, setSavingInterview] = useState(false)
  const [deletingInterviewId, setDeletingInterviewId] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get(`/cms/candidates/${id}`)
      setCandidate(data.candidate)
      setInterviews(data.interviews || [])
      setRemark(data.remark || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load candidate details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const processProgress = useMemo(() => {
    const allKeys = processRemarkSections.flatMap((section) => section.keys)
    const completed = allKeys.filter(([key]) => remark?.checkboxes?.[key]?.checked).length
    return { completed, total: allKeys.length }
  }, [remark])

  const updateCheckbox = async (key, checked) => {
    try {
      const { data } = await api.patch(`/cms/candidates/${id}/remarks`, { checkboxKey: key, checked })

      if (data.remark) {
        setRemark(data.remark)
      }

      if (data.successRemarks) {
        setCandidate((current) => (current ? { ...current, successRemarks: data.successRemarks } : current))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update checkbox')
    }
  }

  const submitInterview = async (event) => {
    event.preventDefault()

    if (!interviewForm.companyName.trim()) {
      toast.error('Company name is required')
      return
    }

    setSavingInterview(true)
    try {
      if (editingInterviewId) {
        const { data } = await api.put(`/cms/interviews/${editingInterviewId}`, interviewForm)
        setInterviews((current) => current.map((item) => (item._id === editingInterviewId ? data : item)))
        toast.success('Interview updated')
      } else {
        const { data } = await api.post(`/cms/candidates/${id}/interviews`, interviewForm)
        setInterviews((current) => [data, ...current])
        toast.success('Interview added')
      }

      setInterviewForm(emptyInterviewForm)
      setEditingInterviewId(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save interview')
    } finally {
      setSavingInterview(false)
    }
  }

  const editInterview = (item) => {
    setEditingInterviewId(item._id)
    setInterviewForm({
      companyName: item.companyName || '',
      reference: item.reference || '',
      interviewDate: dateValue(item.interviewDate),
      remark: item.remark || '',
      result: item.result || 'Pending'
    })
  }

  const removeInterview = async (interviewId) => {
    try {
      await api.delete(`/cms/interviews/${interviewId}`)
      setInterviews((current) => current.filter((item) => item._id !== interviewId))
      toast.success('Interview deleted')

      if (editingInterviewId === interviewId) {
        setEditingInterviewId(null)
        setInterviewForm(emptyInterviewForm)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete interview')
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading candidate details...</p>
  if (!candidate) return <p className="text-sm text-rose-600">Candidate not found.</p>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/candidates')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{candidate.fullName}</h1>
          <p className="text-sm text-slate-500">Candidate Management System</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/cms/candidates/${id}/edit`)}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto"
        >
          Edit Candidate
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['info', 'Candidate Info'],
          ['interviews', 'Interviews'],
          ['remarks', 'Process Remarks']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:space-y-5 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Full Name" value={candidate.fullName} />
            <Info label="Mobile Number" value={candidate.mobileNumber} />
            <Info label="WhatsApp" value={candidate.whatsappNo} />
            <Info label="Email" value={candidate.emailId} />
            <Info label="Date Of Birth" value={dateValue(candidate.dateOfBirth)} />
            <Info label="Gender" value={candidate.gender} />
            <Info label="Current Address" value={candidate.currentAddress} />
            <Info label="Permanent Address" value={candidate.permanentAddress} />
            <Info label="Education" value={candidate.education} />
            <Info label="Specialization" value={candidate.specialization} />
            <Info label="Total Experience" value={candidate.totalExperience} />
            <Info label="Current Company" value={candidate.currentCompany} />
            <Info label="Current Designation" value={candidate.currentDesignation} />
            <Info label="Current Salary" value={candidate.currentSalary} />
            <Info label="Expected Salary" value={candidate.expectedSalary} />
            <Info label="Notice Period" value={candidate.noticePeriod} />
            <Info label="Preferred Location" value={candidate.preferredLocation} />
            <Info label="Marriage Status" value={candidate.marriageStatus} />
            <Info label="Key Skills" value={(candidate.keySkills || []).join(', ')} />
            <Info label="Languages Known" value={(candidate.languagesKnown || []).join(', ')} />
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-slate-500">Success Remarks</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {successRemarkKeys.map(([key, label]) => {
                const checked = Boolean(candidate.successRemarks?.[key]?.checked)
                const updatedAt = formatUpdatedAt(candidate.successRemarks?.[key]?.updatedAt)

                return (
                  <label key={key} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-800">{label}</span>
                      <input type="checkbox" checked={checked} onChange={(event) => updateCheckbox(key, event.target.checked)} className="h-4 w-4" />
                    </div>
                    {checked && updatedAt ? <p className="mt-1 text-xs text-emerald-700">Checked on {updatedAt}</p> : null}
                  </label>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'interviews' ? (
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <form onSubmit={submitInterview} className="grid gap-3 md:grid-cols-5">
            <input
              value={interviewForm.companyName}
              onChange={(e) => setInterviewForm((c) => ({ ...c, companyName: e.target.value }))}
              placeholder="Company Name"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={interviewForm.reference}
              onChange={(e) => setInterviewForm((c) => ({ ...c, reference: e.target.value }))}
              placeholder="Reference"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="date"
              value={interviewForm.interviewDate}
              onChange={(e) => setInterviewForm((c) => ({ ...c, interviewDate: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={interviewForm.result}
              onChange={(e) => setInterviewForm((c) => ({ ...c, result: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {['Pending', 'Selected', 'Rejected', 'On Hold'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700" disabled={savingInterview}>
              {savingInterview ? 'Saving...' : editingInterviewId ? 'Update Interview' : 'Add Interview'}
            </button>
            <input
              value={interviewForm.remark}
              onChange={(e) => setInterviewForm((c) => ({ ...c, remark: e.target.value }))}
              placeholder="Remark"
              className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-5"
            />
          </form>

          {editingInterviewId ? (
            <button
              type="button"
              onClick={() => {
                setEditingInterviewId(null)
                setInterviewForm(emptyInterviewForm)
              }}
              className="text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel editing
            </button>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Interview Date</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3">{item.companyName}</td>
                    <td className="px-4 py-3">{item.reference || '-'}</td>
                    <td className="px-4 py-3">{dateValue(item.interviewDate) || '-'}</td>
                    <td className="px-4 py-3">{item.result || '-'}</td>
                    <td className="px-4 py-3">{item.remark || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => editInterview(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-50"
                          aria-label="Edit interview"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingInterviewId(item._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
                          aria-label="Delete interview"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No interviews yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'remarks' ? (
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Post-Placement Process Checklist</p>
            <p className="mt-1 text-sm text-slate-500">
              {processProgress.completed} / {processProgress.total} completed
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${processProgress.total ? (processProgress.completed / processProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {processRemarkSections.map((section) => (
            <div key={section.title} className="rounded-lg border border-slate-200 p-3">
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">{section.title}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {section.keys.map(([key, label]) => {
                  const checked = Boolean(remark?.checkboxes?.[key]?.checked)
                  const updatedAt = formatUpdatedAt(remark?.checkboxes?.[key]?.updatedAt)

                  return (
                    <label key={key} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-800">{label}</span>
                        <input type="checkbox" checked={checked} onChange={(event) => updateCheckbox(key, event.target.checked)} className="h-4 w-4" />
                      </div>
                      {checked && updatedAt ? <p className="mt-1 text-xs text-emerald-700">Checked on {updatedAt}</p> : null}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingInterviewId)}
        title="Delete Interview"
        message="Delete this interview record? This action cannot be undone."
        confirmText="Delete"
        danger
        onCancel={() => setDeletingInterviewId(null)}
        onConfirm={async () => {
          const interviewId = deletingInterviewId
          setDeletingInterviewId(null)
          if (interviewId) {
            await removeInterview(interviewId)
          }
        }}
      />
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-900">{value || '-'}</p>
    </div>
  )
}
