import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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

const statusBadge = (status) => {
  if (status === 'Selected') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
  if (status === 'Rejected') return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
  return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
}

export default function InterviewDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)

  useEffect(() => {
    const items = loadCandidates()
    const found = items.find((c) => String(c.id) === String(id))
    setCandidate(found || null)
  }, [id])

  const interviews = useMemo(() => visibleInterviews(candidate?.interviews), [candidate])

  if (!candidate) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/admin/cms/interviews')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
          {'<- Interviews'}
        </button>
        <p className="text-sm text-rose-600">Candidate not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/interviews')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Interviews'}
          </button>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{candidate.fullName}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/cms/candidates/${candidate.id}`)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Open Candidate
        </button>
      </div>

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
              {interviews.map((row, idx) => (
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
              {interviews.length === 0 ? (
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
    </div>
  )
}

