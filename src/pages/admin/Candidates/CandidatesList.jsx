import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import api from '../../../api/axios'
import Skeleton from '../../../components/Skeleton'
import { ConfirmDialog } from '../../../components/ActionDialogs'

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export default function CandidatesList() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get('/cms/candidates', {
        params: search.trim() ? { search: search.trim() } : undefined
      })
      setCandidates(data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates

    return candidates.filter((candidate) => {
      const fields = [candidate.fullName, candidate.mobileNumber, candidate.emailId, ...(candidate.keySkills || [])]
      return fields.some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [candidates, search])

  const handleDelete = async () => {
    if (!deleting?._id) return
    try {
      await api.delete(`/cms/candidates/${deleting._id}`)
      setCandidates((current) => current.filter((item) => item._id !== deleting._id))
      toast.success('Candidate deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete candidate')
    } finally {
      setDeleting(null)
    }
  }

  const exportCsv = () => {
    try {
      const headers = [
        'Full Name',
        'Mobile Number',
        'Email',
        'Education',
        'Total Experience',
        'Current Salary',
        'Expected Salary',
        'Preferred Location',
        'Key Skills'
      ]

      const rows = filtered.map((item) => [
        item.fullName,
        item.mobileNumber,
        item.emailId,
        item.education,
        item.totalExperience,
        item.currentSalary,
        item.expectedSalary,
        item.preferredLocation,
        (item.keySkills || []).join(' | ')
      ])

      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cms-candidates-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch (_error) {
      toast.error('Could not export CSV')
    }
  }

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Candidate Management System</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/cms/candidates/new')}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, mobile, email, skills"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Education</th>
                <th className="px-5 py-3">Experience</th>
                <th className="px-5 py-3">Current Salary</th>
                <th className="px-5 py-3">Skills</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((candidate) => (
                <tr key={candidate._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-3 font-semibold text-slate-900">{candidate.fullName}</td>
                  <td className="px-5 py-3 text-slate-700">{candidate.mobileNumber}</td>
                  <td className="px-5 py-3 text-slate-700">{candidate.education || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{candidate.totalExperience ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{candidate.currentSalary || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{(candidate.keySkills || []).join(', ') || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate._id}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50"
                        aria-label="View candidate"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate._id}/edit`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                        aria-label="Edit candidate"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(candidate)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="Delete candidate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Candidate"
        message={`Delete ${deleting?.fullName || 'this candidate'}? Interviews and remarks will also be deleted.`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
