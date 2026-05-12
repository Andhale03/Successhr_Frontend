import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Eye, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import socket from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge, { statusLabel } from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { ConfirmDialog, PromptDialog } from '../../components/ActionDialogs'

const selectionStatusColors = {
  shortlisted: 'bg-slate-100 text-slate-700',
  selected: 'bg-emerald-100 text-emerald-700',
  joined: 'bg-emerald-200 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-700',
  on_hold: 'bg-amber-100 text-amber-700'
}

const selectionStatusLabel = {
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  joined: 'Joined',
  rejected: 'Rejected',
  on_hold: 'On Hold'
}

const processStageLabel = {
  appointment_letter_pending: 'Appointment Letter Pending',
  appointment_letter_shared: 'Appointment Letter Shared',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  selected: 'Selected',
  joined: 'Joined',
  rejected: 'Rejected',
  on_hold: 'On Hold'
}

const safeDate = (value, formatStr = 'yyyy-MM-dd') => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : format(date, formatStr)
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const buildCandidateSearchText = (candidate) => {
  const placement = candidate.placement || {}

  return [
    candidate.candidateName,
    candidate.mobileNumber,
    candidate.aadhaarNo,
    candidate.whatsappNo,
    candidate.emailId,
    candidate.appliedFor,
    candidate.interestedDepartment,
    candidate.preferredIndustry,
    candidate.preferredJobLocation,
    candidate.education,
    candidate.currentJobLocation,
    candidate.careerSummary,
    candidate.reasonForJobChange,
    candidate.status,
    candidate.adminNotes,
    candidate.submittedBy?.name,
    candidate.submittedBy?.email,
    placement.companyId?.companyName,
    placement.jobProfile,
    placement.processStage,
    placement.selectionStatus,
    placement.earningStatus
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function Candidates() {
  const [searchParams] = useSearchParams()
  const [Candidates, setCandidates] = useState([])
  const [placements, setPlacements] = useState([])
  const [bas, setBas] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingFull, setSavingFull] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [deletePrompt, setDeletePrompt] = useState({ open: false, candidate: null })
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    ba: searchParams.get('ba') || 'all'
  }))
  const [selected, setSelected] = useState(null)

  const load = async () => {
    const [CandidateRes, baRes, placementRes] = await Promise.all([api.get('/candidates'), api.get('/ba/all'), api.get('/placements')])
    setCandidates(CandidateRes.data)
    setPlacements(placementRes.data)
    setBas(baRes.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const refresh = () => {
      load().catch(() => {})
    }

    socket.on('placement_created', refresh)
    socket.on('placement_updated', refresh)
    socket.on('placement_paid', refresh)
    socket.on('placement_deleted', refresh)
    socket.on('new_candidate', refresh)
    socket.on('candidate_updated', refresh)
    socket.on('candidate_deleted', refresh)

    return () => {
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('new_candidate', refresh)
      socket.off('candidate_updated', refresh)
      socket.off('candidate_deleted', refresh)
    }
  }, [])

  const placementBycandidateId = useMemo(
    () =>
      new Map(
        placements.map((placement) => [placement.candidateId?._id || placement.candidateId, placement])
      ),
    [placements]
  )

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()
    return Candidates
      .map((Candidate) => {
        const placement = placementBycandidateId.get(Candidate._id)
        return {
          ...Candidate,
          placement,
          effectiveStatus: placement?.selectionStatus || Candidate.status
        }
      })
      .filter((Candidate) => (search ? buildCandidateSearchText(Candidate).includes(search) : true))
      .filter((Candidate) => (filters.status === 'all' ? true : Candidate.effectiveStatus === filters.status))
      .filter((Candidate) => (filters.ba === 'all' ? true : Candidate.submittedBy?._id === filters.ba))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [Candidates, filters, placementBycandidateId])

  const removeCandidate = async (Candidate) => {
    try {
      await api.delete(`/candidates/${Candidate._id}`)
      setCandidates((current) => current.filter((item) => item._id !== Candidate._id))
      if (selected?._id === Candidate._id) {
        setSelected(null)
      }
      toast.success('Candidate deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete Candidate')
    }
  }

  const buildCandidatePayload = (Candidate) => ({
    candidateName: Candidate.candidateName,
    mobileNumber: Candidate.mobileNumber,
    aadhaarNo: Candidate.aadhaarNo,
    whatsappNo: Candidate.whatsappNo,
    emailId: Candidate.emailId,
    appliedFor: Candidate.appliedFor,
    interestedDepartment: Candidate.interestedDepartment,
    preferredIndustry: Candidate.preferredIndustry,
    preferredJobLocation: Candidate.preferredJobLocation,
    education: Candidate.education,
    totalExperience: Candidate.totalExperience === '' ? undefined : Candidate.totalExperience,
    careerSummary: Candidate.careerSummary,
    currentSalary: Candidate.currentSalary,
    expectedSalary: Candidate.expectedSalary,
    noticePeriod: Candidate.noticePeriod === '' ? undefined : Candidate.noticePeriod,
    reasonForJobChange: Candidate.reasonForJobChange,
    currentJobLocation: Candidate.currentJobLocation,
    availabilityForInterview: Candidate.availabilityForInterview,
    marriageStatus: Candidate.marriageStatus || undefined,
    documents: Candidate.documents || [],
    status: Candidate.status,
    adminNotes: Candidate.adminNotes,
    selectionStatus: Candidate.selectionStatus
  })

  const saveSelected = async () => {
    if (!selected) return

    setSavingFull(true)
    try {
      const { data } = await api.put(`/candidates/${selected._id}`, buildCandidatePayload(selected))
      setCandidates((current) => current.map((item) => (item._id === data._id ? data : item)))
      setSelected(data)
      toast.success('Candidate updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update Candidate')
    } finally {
      setSavingFull(false)
    }
  }

  const requestSaveSelected = () => {
    if (!selected) return
    setSaveConfirmOpen(true)
  }

  const uploadDocuments = async (files) => {
    if (!selected || !files?.length) return

    setUploadingDocuments(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('documents', file))
      const { data } = await api.post(`/candidates/${selected._id}/docs`, formData)
      setCandidates((current) => current.map((item) => (item._id === data._id ? data : item)))
      setSelected(data)
      toast.success('Documents uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload documents')
    } finally {
      setUploadingDocuments(false)
    }
  }

  const exportCsv = () => {
    try {
      const headers = [
        'Candidate Name',
        'Mobile',
        'WhatsApp',
        'Email',
        'Aadhaar',
        'Applied For',
        'Interested Department',
        'Preferred Industry',
        'Preferred Job Location',
        'Education',
        'Total Experience',
        'Current Salary',
        'Expected Salary',
        'Notice Period',
        'Current Job Location',
        'Marriage Status',
        'Submitted By',
        'Submitted Date',
        'Reference Status',
        'Selection Status',
        'Process Stage',
        'Company',
        'Job Profile',
        'Offered Salary PM',
        'Earning %',
        'Earning Amount',
        'Earning Status',
        'Joining Date',
        'Interview Date',
        'Interview Mode',
        'Admin Notes'
      ]

      const rows = filtered.map((Candidate) => {
        const placement = Candidate.placement || {}
        return [
          Candidate.candidateName,
          Candidate.mobileNumber,
          Candidate.whatsappNo,
          Candidate.emailId,
          Candidate.aadhaarNo,
          Candidate.appliedFor,
          Candidate.interestedDepartment,
          Candidate.preferredIndustry,
          Candidate.preferredJobLocation,
          Candidate.education,
          Candidate.totalExperience,
          Candidate.currentSalary,
          Candidate.expectedSalary,
          Candidate.noticePeriod,
          Candidate.currentJobLocation,
          Candidate.marriageStatus,
          Candidate.submittedBy?.name || 'BA',
          safeDate(Candidate.createdAt),
          statusLabel(Candidate.status),
          placement.selectionStatus
            ? selectionStatusLabel[placement.selectionStatus] || placement.selectionStatus
            : '',
          placement.processStage
            ? processStageLabel[placement.processStage] || placement.processStage
            : '',
          placement.companyId?.companyName || '',
          placement.jobProfile || '',
          placement.offeredSalaryPM ?? '',
          placement.earningPercent ?? '',
          placement.earningAmount ?? '',
          placement.earningStatus || '',
          safeDate(placement.joiningDate),
          safeDate(placement.interviewDate),
          placement.interviewMode || '',
          Candidate.adminNotes || ''
        ]
      })

      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Candidate-references-${safeDate(new Date()) || 'export'}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Candidate export downloaded')
    } catch (_error) {
      toast.error('Could not export Candidate data')
    }
  }

  if (loading) return <Skeleton rows={9} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <Header title="Candidates" subtitle="Search, filter, view, export, and delete Candidate references." onExport={exportCsv} />
      <Filters filters={filters} setFilters={setFilters} bas={bas} searchPlaceholder="Search candidate, mobile, BA name, email, job..." />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Applied For</th>
                <th className="px-5 py-3">Submitted By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Next Process</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((Candidate) => (
                <tr key={Candidate._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-3 font-semibold text-slate-900">{Candidate.candidateName}</td>
                  <td className="px-5 py-3 text-slate-600">{Candidate.mobileNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{Candidate.appliedFor || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-600">{Candidate.submittedBy?.name || 'BA'}</td>
                  <td className="px-5 py-3 text-slate-600">{format(new Date(Candidate.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-5 py-3">
                    {Candidate.placement?.selectionStatus ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectionStatusColors[Candidate.placement.selectionStatus] || selectionStatusColors.shortlisted
                        }`}
                      >
                        {selectionStatusLabel[Candidate.placement.selectionStatus] || Candidate.placement.selectionStatus}
                      </span>
                    ) : (
                      <StatusBadge status={Candidate.status} />
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {Candidate.placement?.processStage
                      ? processStageLabel[Candidate.placement.processStage] || Candidate.placement.processStage
                      : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelected(Candidate)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50" aria-label="View Candidate">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePrompt({ open: true, candidate: Candidate })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="Delete Candidate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    No matching Candidate references.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        open={Boolean(selected)}
        item={selected}
        type="student"
        onClose={() => setSelected(null)}
        adminControls
        fullEdit
        onItemChange={setSelected}
        onStatusChange={(status) => setSelected((current) => ({ ...current, status }))}
        onNotesChange={(adminNotes) => setSelected((current) => ({ ...current, adminNotes }))}
        onSaveFull={requestSaveSelected}
        savingFull={savingFull}
        onUploadDocuments={uploadDocuments}
        uploadingDocuments={uploadingDocuments}
      />
      <ConfirmDialog
        open={saveConfirmOpen}
        title="Save Candidate Changes"
        message={`Save updates for ${selected?.candidateName || 'this Candidate'}?`}
        confirmText="Save Changes"
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={async () => {
          setSaveConfirmOpen(false)
          await saveSelected()
        }}
      />
      <PromptDialog
        open={deletePrompt.open}
        title="Delete Candidate"
        message={`Type DELETE to confirm deleting ${deletePrompt.candidate?.candidateName || 'this Candidate'}.`}
        placeholder="Type DELETE"
        confirmText="Delete"
        inputType="text"
        onCancel={() => setDeletePrompt({ open: false, candidate: null })}
        onConfirm={async (value) => {
          if (String(value || '').trim().toUpperCase() !== 'DELETE') {
            toast.error('Please type DELETE to confirm')
            return
          }
          const Candidate = deletePrompt.candidate
          setDeletePrompt({ open: false, candidate: null })
          if (Candidate) {
            await removeCandidate(Candidate)
          }
        }}
      />
    </div>
  )
}

function Header({ title, subtitle, onExport }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button type="button" onClick={onExport} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 sm:w-auto">
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  )
}

function Filters({ filters, setFilters, bas, searchPlaceholder }) {
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
      <input
        value={filters.search}
        onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        placeholder={searchPlaceholder}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
      <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2">
        <option value="all">All Statuses</option>
        <option value="not_viewed">Not Viewed</option>
        <option value="in_review">In Review</option>
        <option value="priority">Priority</option>
        <option value="done">Done</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="selected">Selected</option>
        <option value="joined">Joined</option>
        <option value="rejected">Rejected</option>
        <option value="on_hold">On Hold</option>
      </select>
      <select value={filters.ba} onChange={(event) => setFilters((current) => ({ ...current, ba: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2">
        <option value="all">All BAs</option>
        {bas.map((ba) => (
          <option key={ba.userId?._id || ba._id} value={ba.userId?._id}>
            {ba.userId?.name || ba.fullName}
          </option>
        ))}
      </select>
    </div>
  )
}


