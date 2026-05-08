import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const storageKey = 'candidates'
const cardClass = 'bg-white rounded-xl shadow-sm border border-gray-100'

const loadCandidates = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

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

const statusBadge = (status) => {
  if (status === 'Selected') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
  if (status === 'Rejected') return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
  return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
}

const visibleInterviews = (rows) =>
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

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
    >
      {label}
    </button>
  )
}

function ReadOnlyToggle({ checked, label, variant }) {
  const base = 'rounded-lg border px-3 py-2 text-sm font-semibold'
  const cls =
    variant === 'success'
      ? checked
        ? 'border-green-500 bg-green-50 text-green-800'
        : 'border-[#e2e6f0] bg-gray-50 text-slate-700'
      : checked
        ? 'border-indigo-500 bg-purple-50 text-indigo-600'
        : 'border-[#e2e6f0] bg-gray-50 text-slate-700'

  return <div className={`${base} ${cls}`}>{label}</div>
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-900">{value || '-'}</p>
    </div>
  )
}

export default function CandidateDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('info')
  const [candidate, setCandidate] = useState(null)

  useEffect(() => {
    const items = loadCandidates()
    const found = items.find((c) => String(c.id) === String(id))
    if (!found) {
      toast.error('Candidate not found')
      navigate('/admin/cms/candidates')
      return
    }
    setCandidate(found)
  }, [id, navigate])

  const info = useMemo(() => {
    if (!candidate) return []
    return [
      ['Candidate ID', candidate.id],
      ['Full Name', candidate.fullName],
      ['Mobile', candidate.mobile],
      ['Aadhaar Number', candidate.aadhaarNo],
      ['Email', candidate.email],
      ['Date of Birth', candidate.dob],
      ['Gender', candidate.gender],
      ['Current Location', candidate.currentLocation],
      ['Education', candidate.education],
      ['Experience', candidate.experience],
      ['Current Salary', candidate.currentSalary],
      ['Expected Salary', candidate.expectedSalary],
      ['Notice Period', candidate.noticePeriod],
      ['Job Type', candidate.jobType],
      ['Department', candidate.department],
      ['Preferred Location', candidate.preferredLocation],
      ['Skills', (candidate.skills || []).join(', ')],
      ['Languages', (candidate.languages || []).join(', ')],
      ['Reference Source', candidate.referenceSource],
      ['Additional Notes', candidate.additionalNotes]
    ]
  }, [candidate])

  if (!candidate) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/candidates')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{candidate.fullName}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit`)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Edit
        </button>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'info'} label="Info" onClick={() => setTab('info')} />
        <TabButton active={tab === 'remarks'} label="Remarks" onClick={() => setTab('remarks')} />
        <TabButton active={tab === 'interviews'} label="Interviews" onClick={() => setTab('interviews')} />
        <TabButton active={tab === 'success'} label="Success Update" onClick={() => setTab('success')} />
      </div>

      {tab === 'info' ? (
        <div className={`${cardClass} p-5`}>
          <div className="grid gap-4 md:grid-cols-2">
            {info.map(([label, value]) => (
              <InfoItem key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'remarks' ? (
        <div className={`${cardClass} p-5 space-y-4`}>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {remarkCards.map(([key, label]) => (
              <ReadOnlyToggle key={key} checked={Boolean(candidate.remarks?.[key])} label={label} />
            ))}
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Remark Note</p>
            <p className="mt-1 text-sm text-slate-900">{candidate.remarks?.remarkNote || '-'}</p>
          </div>
        </div>
      ) : null}

      {tab === 'interviews' ? (
        <div className={`${cardClass} p-5`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Reference Person</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleInterviews(candidate.interviews).map((row, idx) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3">{row.companyName || '-'}</td>
                    <td className="px-4 py-3">{row.referencePerson || '-'}</td>
                    <td className="px-4 py-3">{row.remark || '-'}</td>
                    <td className="px-4 py-3">{row.date || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status || 'Pending'}</span>
                    </td>
                  </tr>
                ))}
                {visibleInterviews(candidate.interviews).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No interviews.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'success' ? (
        <div className={`${cardClass} p-5 space-y-4`}>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {successCards.map(([key, label]) => (
              <ReadOnlyToggle key={key} variant="success" checked={Boolean(candidate.successUpdate?.[key])} label={label} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Final Joining Date" value={candidate.successUpdate?.finalJoiningDate} />
            <InfoItem label="Final Package (₹)" value={candidate.successUpdate?.finalPackage} />
          </div>
          <InfoItem label="Interviewer Final Remark" value={candidate.successUpdate?.interviewerRemark} />
        </div>
      ) : null}
    </div>
  )
}
