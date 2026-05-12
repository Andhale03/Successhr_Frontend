import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil } from 'lucide-react'
import api from '../../../api/axios'

const cardClass = 'bg-white rounded-xl shadow-sm border border-gray-100'

const rowReference = (row) => row?.referencePerson || row?.reference || ''
const rowDate = (row) => row?.date || (row?.interviewDate ? String(row.interviewDate).slice(0, 10) : '')
const rowStatus = (row) => row?.status || row?.result || 'Pending'

const visibleInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const hasContent = Boolean(
      String(row?.companyName || '').trim() ||
        String(rowReference(row)).trim() ||
        String(row?.remark || '').trim() ||
        String(rowDate(row)).trim()
    )
    const status = rowStatus(row)
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: candidateData }, { data: interviewData }] = await Promise.all([
          api.get(`/cms/candidates/${id}`),
          api.get(`/cms/candidates/${id}/interviews`)
        ])

        setCandidate({
          ...candidateData,
          interviews: Array.isArray(interviewData) ? interviewData : []
        })
      } catch (error) {
        setCandidate(null)
        toast.error(error.response?.data?.message || 'Could not load candidate interviews')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const interviews = useMemo(() => visibleInterviews(candidate?.interviews), [candidate])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading interviews...</p>
  }

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div>
          <button type="button" onClick={() => navigate('/admin/cms/interviews')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Interviews'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{candidate.fullName}</h1>
        </div>
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
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
                <th className="px-4 py-3 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map((row, idx) => (
                <tr key={row._id || row.id || idx}>
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">{row.companyName || '-'}</td>
                  <td className="px-4 py-3">{rowReference(row) || '-'}</td>
                  <td className="px-4 py-3">{row.remark || '-'}</td>
                  <td className="px-4 py-3">{rowDate(row) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(rowStatus(row))}`}>{rowStatus(row)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${id}/edit?panel=interviews`)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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

