import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ActionDialogs'

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
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

const saveCandidates = (items) => {
  localStorage.setItem(storageKey, JSON.stringify(items))
}

export default function CandidatesList() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setCandidates(loadCandidates())
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates

    return candidates.filter((candidate) => {
      const fields = [candidate.fullName, candidate.mobile, candidate.email, ...(candidate.skills || [])]
      return fields.some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [candidates, search])

  const handleDelete = () => {
    if (!deleting?.id) return
    try {
      const next = loadCandidates().filter((item) => item.id !== deleting.id)
      saveCandidates(next)
      setCandidates(next)
      toast.success('Candidate deleted')
    } catch (error) {
      toast.error(error?.message || 'Could not delete candidate')
    } finally {
      setDeleting(null)
    }
  }

  const exportCsv = () => {
    try {
      const data = loadCandidates()

      const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
      const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null

      if (fromDate && Number.isNaN(fromDate.getTime())) {
        toast.error('Invalid From date')
        return
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        toast.error('Invalid To date')
        return
      }
      if (fromDate && toDate && fromDate > toDate) {
        toast.error('From date must be before To date')
        return
      }

      const withinRange = (item) => {
        if (!fromDate && !toDate) return true
        const created = item?.createdAt ? new Date(item.createdAt) : null
        if (!created || Number.isNaN(created.getTime())) return false
        if (fromDate && created < fromDate) return false
        if (toDate && created > toDate) return false
        return true
      }

      const filteredData = data.filter(withinRange)

      const interviewsToText = (rows) =>
        (Array.isArray(rows) ? rows : [])
          .map((r) => {
            const bits = [r.companyName, r.referencePerson, r.date, r.status].filter(Boolean)
            return bits.join(' | ')
          })
          .filter(Boolean)
          .join(' ; ')

      const headers = [
        'ID',
        'Created At',
        'Full Name',
        'Mobile',
        'Aadhaar',
        'Email',
        'DOB',
        'Gender',
        'Current Location',
        'Education',
        'Experience',
        'Current Salary',
        'Expected Salary',
        'Notice Period',
        'Job Type',
        'Department',
        'Preferred Location',
        'Skills',
        'Languages',
        'Reference Source',
        'Additional Notes',
        'Remark Note',
        'Remarks (Tags)',
        'Success Update (Tags)',
        'Final Joining Date',
        'Final Package',
        'Interviewer Remark',
        'Interviews'
      ]

      const rows = filteredData.map((item) => {
        const remarks = item.remarks || {}
        const success = item.successUpdate || {}
        const remarkTags = [
          remarks.verified ? 'Verified' : null,
          remarks.active ? 'Active' : null,
          remarks.priority ? 'Priority' : null,
          remarks.blacklisted ? 'Blacklisted' : null,
          remarks.experienced ? 'Experienced' : null,
          remarks.fresher ? 'Fresher' : null,
          remarks.available ? 'Available' : null,
          remarks.onHold ? 'On Hold' : null,
          remarks.shortlisted ? 'Shortlisted' : null,
          remarks.caseClosed ? 'Case Closed' : null
        ]
          .filter(Boolean)
          .join(', ')

        const successTags = [
          success.selected ? 'Selected' : null,
          success.offerReceived ? 'Offer Received' : null,
          success.offerReleased ? 'Offer Released' : null,
          success.joined ? 'Joined' : null,
          success.notJoined ? 'Not Joined' : null,
          success.rejected ? 'Rejected' : null,
          success.withdrawn ? 'Withdrawn' : null,
          success.docsVerified ? 'Docs Verified' : null,
          success.bgvInitiated ? 'BGV Initiated' : null,
          success.bgvDone ? 'BGV Done' : null,
          success.trainingStarted ? 'Training Started' : null,
          success.confirmed ? 'Confirmed' : null,
          success.relieved ? 'Relieved' : null,
          success.onHold ? 'On Hold' : null,
          success.blacklisted ? 'Blacklisted' : null,
          success.reApplied ? 'Re-applied' : null,
          success.followUpPending ? 'Follow Up Pending' : null,
          success.refCheckDone ? 'Ref Check Done' : null,
          success.salaryNegotiated ? 'Salary Negotiated' : null,
          success.caseClosed ? 'Case Closed' : null
        ]
          .filter(Boolean)
          .join(', ')

        return [
          item.id,
          item.createdAt,
          item.fullName,
          item.mobile,
          item.aadhaarNo || item.aadhaarNumber || item.aadhaar,
          item.email,
          item.dob,
          item.gender,
          item.currentLocation,
          item.education,
          item.experience,
          item.currentSalary,
          item.expectedSalary,
          item.noticePeriod,
          item.jobType,
          item.department,
          item.preferredLocation,
          (item.skills || []).join(' | '),
          (item.languages || []).join(' | '),
          item.referenceSource,
          item.additionalNotes,
          remarks.remarkNote,
          remarkTags,
          successTags,
          success.finalJoiningDate,
          success.finalPackage,
          success.interviewerRemark,
          interviewsToText(item.interviews)
        ]
      })

      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const suffix = dateFrom || dateTo ? `-${dateFrom || 'start'}_to_${dateTo || 'today'}` : ''
      link.download = `candidates${suffix}-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch (_error) {
      toast.error('Could not export CSV')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Candidate Management System</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              aria-label="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              aria-label="To date"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/cms/candidates/add')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
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
          <table className="min-w-full text-base">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Aadhaar</th>
                <th className="px-5 py-4">Education</th>
                <th className="px-5 py-4">Job Role</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((candidate) => (
                <tr key={candidate.id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700">{candidate.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{candidate.fullName}</td>
                  <td className="px-5 py-4 text-slate-800">{candidate.mobile}</td>
                  <td className="px-5 py-4 text-slate-800">{candidate.aadhaarNo || candidate.aadhaarNumber || candidate.aadhaar || '-'}</td>
                  <td className="px-5 py-4 text-slate-800">{candidate.education || '-'}</td>
                  <td className="px-5 py-4 text-slate-800">{candidate.jobRole || candidate.appliedFor || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50"
                        aria-label="View candidate"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${candidate.id}/edit`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                        aria-label="Edit candidate"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(candidate)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
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
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
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
        message={`Delete ${deleting?.fullName || 'this candidate'}?`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
