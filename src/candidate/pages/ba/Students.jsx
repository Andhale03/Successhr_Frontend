import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Pencil } from 'lucide-react'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

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

export default function Students() {
  const token = useSelector((state) => state.auth.token)
  const [students, setStudents] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [savingFull, setSavingFull] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    earning: 'all'
  })

  const loadData = async () => {
    const [studentRes, placementRes] = await Promise.all([api.get('/students'), api.get('/placements/my')])
    setStudents(studentRes.data)
    setPlacements(placementRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const refresh = () => {
      loadData().catch(() => {})
    }

    socket.on('my_placement', refresh)
    socket.on('placement_updated', refresh)
    socket.on('placement_deleted', refresh)
    socket.on('earning_paid', refresh)
    socket.on('commission_paid', refresh)
    socket.on('student_updated', refresh)
    socket.on('student_deleted', refresh)
    socket.on('new_student_received', (payload) => {
      toast.success(`New application received from ${payload?.candidateName || 'a candidate'} via your public form!`)
      refresh()
    })

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      socket.off('student_updated', refresh)
      socket.off('student_deleted', refresh)
      socket.off('new_student_received')
      disconnectSocket()
    }
  }, [token])

  const placementByStudentId = useMemo(
    () =>
      new Map(
        placements.map((placement) => [placement.student?._id || placement.studentId?._id || placement.studentId, placement])
      ),
    [placements]
  )

  const enriched = useMemo(
    () =>
      students.map((student) => {
        const placement = placementByStudentId.get(student._id)
        return {
          ...student,
          placement,
          effectiveStatus: placement?.selectionStatus || student.status
        }
      }),
    [students, placementByStudentId]
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return enriched
      .filter((student) => {
        if (!search) return true
        const placement = student.placement || {}
        const text = [
          student.candidateName,
          student.mobileNumber,
          student.aadhaarNo,
          student.whatsappNo,
          student.emailId,
          student.appliedFor,
          student.interestedDepartment,
          student.preferredIndustry,
          student.preferredJobLocation,
          student.currentJobLocation,
          placement.companyName,
          placement.jobProfile
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(search)
      })
      .filter((student) => (filters.status === 'all' ? true : student.effectiveStatus === filters.status))
      .filter((student) => {
        if (filters.earning === 'all') return true
        if (filters.earning === 'recorded') return Boolean(student.placement)
        if (filters.earning === 'paid') return student.placement?.earningStatus === 'paid'
        if (filters.earning === 'pending') return student.placement?.earningStatus === 'pending'
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [enriched, filters])

  const stats = useMemo(() => {
    const totalSubmitted = students.length
    const selectedJoined = placements.filter(
      (placement) => placement.selectionStatus === 'selected' || placement.selectionStatus === 'joined'
    ).length
    const totalEarned = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    const pending = placements
      .filter((placement) => placement.earningStatus === 'pending')
      .reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    return { totalSubmitted, selectedJoined, totalEarned, pending }
  }, [students.length, placements])

  const buildStudentPayload = (student) => ({
    candidateName: student.candidateName,
    mobileNumber: student.mobileNumber,
    aadhaarNo: student.aadhaarNo,
    whatsappNo: student.whatsappNo,
    emailId: student.emailId,
    appliedFor: student.appliedFor,
    interestedDepartment: student.interestedDepartment,
    preferredIndustry: student.preferredIndustry,
    preferredJobLocation: student.preferredJobLocation,
    education: student.education,
    currentCompany: student.currentCompany,
    totalExperience: student.totalExperience === '' ? undefined : student.totalExperience,
    careerSummary: student.careerSummary,
    currentSalary: student.currentSalary,
    expectedSalary: student.expectedSalary,
    noticePeriod: student.noticePeriod === '' ? undefined : student.noticePeriod,
    reasonForJobChange: student.reasonForJobChange,
    currentJobLocation: student.currentJobLocation,
    availabilityForInterview: student.availabilityForInterview,
    marriageStatus: student.marriageStatus || undefined,
    documents: student.documents || []
  })

  const saveSelected = async () => {
    if (!selected) return

    setSavingFull(true)
    try {
      const { data } = await api.put(`/students/${selected._id}`, buildStudentPayload(selected))
      setStudents((current) => current.map((item) => (item._id === data._id ? data : item)))
      setSelected((current) => ({
        ...data,
        placement: current?.placement
      }))
      toast.success('Candidate details updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update candidate')
    } finally {
      setSavingFull(false)
    }
  }

  const uploadDocuments = async (files) => {
    if (!selected || !files?.length) return

    setUploadingDocuments(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('documents', file))
      const { data } = await api.post(`/students/${selected._id}/docs`, formData)
      setStudents((current) => current.map((item) => (item._id === data._id ? data : item)))
      setSelected((current) => ({
        ...data,
        placement: current?.placement
      }))
      toast.success('Documents uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload documents')
    } finally {
      setUploadingDocuments(false)
    }
  }

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Candidates</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {students.length}
          </span>
        </div>
        <Link
          to="/ba/students/new"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
        >
          Add Candidate
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Submitted" value={stats.totalSubmitted} />
        <StatCard label="Selected / Joined" value={stats.selectedJoined} />
        <StatCard label="Total Earned" value={formatMoney(stats.totalEarned)} />
        <StatCard label="Pending Payment" value={formatMoney(stats.pending)} />
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search by name, phone, aadhaar, email, job, company..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="not_viewed">Not Viewed</option>
          <option value="in_review">In Review</option>
          <option value="priority">Priority</option>
          <option value="done">Done</option>
          <option value="selected">Selected</option>
          <option value="joined">Joined</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.earning}
          onChange={(event) => setFilters((current) => ({ ...current, earning: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All Earnings</option>
          <option value="recorded">Earning recorded</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending payment</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Applied For</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Ref. Status</th>
                <th className="px-5 py-3">Next Process</th>
                <th className="px-5 py-3">My Earning</th>
                <th className="px-5 py-3">Documents</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <tr
                  key={student._id}
                  onClick={() => setSelected(student)}
                  className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50/50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{student.candidateName}</p>
                      {student.source === 'public_form' ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">Via form</span> : null}
                    </div>
                    <p className="text-xs text-slate-500">{student.mobileNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{student.appliedFor || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-600">{format(new Date(student.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-5 py-3">
                    {student.placement?.selectionStatus ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectionStatusColors[student.placement.selectionStatus] || selectionStatusColors.shortlisted
                        }`}
                      >
                        {selectionStatusLabel[student.placement.selectionStatus] || student.placement.selectionStatus}
                      </span>
                    ) : (
                      <StatusBadge status={student.status} />
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {student.placement?.processStage ? processStageLabel[student.placement.processStage] || student.placement.processStage : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <EarningCell placement={student.placement} />
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {student.documents?.length ? (
                      <span className="font-semibold text-indigo-600">{student.documents.length} files</span>
                    ) : (
                      <span className="text-slate-500">No files</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelected(student)
                      }}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No candidates found for current filters.
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
        fullEdit
        onItemChange={setSelected}
        onSaveFull={saveSelected}
        saveFullLabel="Update Student Data"
        savingFull={savingFull}
        onUploadDocuments={uploadDocuments}
        uploadingDocuments={uploadingDocuments}
      />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-3 sm:text-2xl">{value}</p>
    </div>
  )
}

function EarningCell({ placement }) {
  if (!placement) {
    return <span className="text-sm text-slate-500">Not placed yet</span>
  }

  if (placement.selectionStatus === 'rejected') {
    return <span className="text-sm text-slate-500">Not applicable</span>
  }

  return (
    <div>
      <p className="font-semibold text-emerald-700">{formatMoney(placement.earningAmount || 0)}</p>
    </div>
  )
}
