import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, Download, Eye, Filter, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../../api/axios'

const fallbackCode = (item) => {
  if (item?.candidateCode) return item.candidateCode
  const date = item?.createdAt ? new Date(item.createdAt) : new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const tail = String(item?._id || '').slice(-4).toUpperCase().padStart(4, '0')
  return `C${yy}${mm}${tail}`
}

const avatarPalette = [
  'bg-violet-100 text-violet-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-fuchsia-100 text-fuchsia-600'
]

const visibleInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const hasContent = Boolean(
      String(row?.companyName || '').trim() ||
        String(row?.referencePerson || row?.reference || '').trim() ||
        String(row?.remark || '').trim() ||
        String(row?.date || row?.interviewDate || '').trim()
    )
    const status = row?.status || row?.result || 'Pending'
    return hasContent || status !== 'Pending'
  })

export default function InterviewList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/cms/candidates')
        const candidates = Array.isArray(data) ? data : []
        const enriched = await Promise.all(
          candidates.map(async (candidate) => {
            try {
              const { data: interviewsRaw } = await api.get(`/cms/candidates/${candidate._id}/interviews`)
              const interviews = visibleInterviews(interviewsRaw)
              const interviewDates = interviews
                .map((row) => String(row?.date || row?.interviewDate || '').slice(0, 10))
                .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
              return {
                id: candidate._id,
                code: fallbackCode(candidate),
                fullName: candidate.fullName || '',
                mobile: candidate.mobileNumber || '',
                email: candidate.emailId || '',
                count: interviews.length,
                interviewDates
              }
            } catch (_error) {
              return {
                id: candidate._id,
                code: fallbackCode(candidate),
                fullName: candidate.fullName || '',
                mobile: candidate.mobileNumber || '',
                email: candidate.emailId || '',
                count: 0,
                interviewDates: []
              }
            }
          })
        )
        setItems(enriched)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load interview candidates')
      }
    }
    load()
  }, [])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const hasFrom = Boolean(fromDate)
    const hasTo = Boolean(toDate)
    const fromTime = hasFrom ? new Date(`${fromDate}T00:00:00`).getTime() : null
    const toTime = hasTo ? new Date(`${toDate}T23:59:59`).getTime() : null
    return items
      .filter((candidate) => {
        if (!query) return true
        const fields = [candidate.code, candidate.id, candidate.fullName, candidate.mobile, candidate.email]
        return fields.some((value) => String(value || '').toLowerCase().includes(query))
      })
      .filter((candidate) => {
        if (!hasFrom && !hasTo) return true
        return (candidate.interviewDates || []).some((dateValue) => {
          const current = new Date(`${dateValue}T12:00:00`).getTime()
          if (Number.isNaN(current)) return false
          if (hasFrom && current < fromTime) return false
          if (hasTo && current > toTime) return false
          return true
        })
      })
  }, [items, search, fromDate, toDate])

  const stats = useMemo(() => {
    const totalCandidates = items.length
    const totalInterviews = items.reduce((sum, item) => sum + (item.count || 0), 0)
    const completedInterviews = items.filter((item) => (item.count || 0) > 0).length
    const today = new Date().toISOString().slice(0, 10)
    const todaysInterviews = items.reduce((sum, item) => sum + (item.interviewDates || []).filter((d) => d === today).length, 0)
    return { totalCandidates, totalInterviews, completedInterviews, todaysInterviews }
  }, [items])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage candidate interviews</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-indigo-50 p-2 text-indigo-600"><Users className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Total Candidates</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.totalCandidates}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 12.5% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-sky-50 p-2 text-sky-600"><CalendarDays className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Total Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.totalInterviews}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 8.4% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Completed Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.completedInterviews}</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 15.7% from last month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-full bg-amber-50 p-2 text-amber-600"><Clock3 className="h-4 w-4" /></div>
          <p className="text-xs text-slate-500">Today&apos;s Interviews</p><p className="text-2xl font-bold text-slate-900 sm:text-3xl">{stats.todaysInterviews}</p>
          <p className="mt-1 text-xs font-medium text-indigo-600">View today&apos;s schedule</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto_auto]">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            aria-label="Filter interviews from date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            aria-label="Filter interviews to date"
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by id, name, mobile, email..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <button type="button" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 lg:w-auto">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button type="button" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 lg:w-auto">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Interview Count</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((candidate) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700">{candidate.code}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${avatarPalette[candidate.fullName.length % avatarPalette.length]}`}>
                        {(candidate.fullName || 'C').charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-900">{candidate.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-800">{candidate.mobile}</td>
                  <td className="px-5 py-4 text-slate-800">
                    <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {candidate.count}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/interviews/${candidate.id}`)}
                        className="inline-flex h-8 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        aria-label="View interviews"
                      >
                        <Eye className="h-3 w-3" />
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">
          <p>Showing 1 to {Math.min(rows.length, 5)} of {rows.length} results</p>
          <div className="inline-flex items-center gap-2">
            <button type="button" className="h-7 w-7 rounded border border-slate-200 text-slate-400">{'<'}</button>
            <button type="button" className="h-7 w-7 rounded bg-indigo-600 text-white">1</button>
            <button type="button" className="h-7 w-7 rounded text-slate-500">2</button>
            <button type="button" className="h-7 w-7 rounded text-slate-500">3</button>
            <button type="button" className="h-7 w-7 rounded border border-slate-200 text-slate-400">{'>'}</button>
          </div>
          <button type="button" className="h-8 rounded-lg border border-slate-200 px-3 text-slate-600">5 / page</button>
        </div>
      </div>
    </div>
  )
}
