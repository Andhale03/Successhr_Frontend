import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'

const storageKey = 'candidates'

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

export default function InterviewList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setItems(loadCandidates())
  }, [])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .map((candidate) => ({
        candidate,
        interviews: visibleInterviews(candidate.interviews),
        count: visibleInterviews(candidate.interviews).length
      }))
      .filter((item) => item.count > 0)
      .filter((item) => {
        if (!query) return true
        const candidate = item.candidate
        const fields = [candidate.id, candidate.fullName, candidate.mobile, candidate.email]
        return fields.some((value) => String(value || '').toLowerCase().includes(query))
      })
  }, [items, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">Candidate interview tracking</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by id, name, mobile, email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Interview Count</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ candidate, count }) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700">{candidate.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{candidate.fullName}</td>
                  <td className="px-5 py-4 text-slate-800">{candidate.mobile}</td>
                  <td className="px-5 py-4 text-slate-800">{count}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/interviews/${candidate.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50"
                        aria-label="View interviews"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No interviews found.
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
