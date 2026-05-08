import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Eye, Trash2, Pencil } from 'lucide-react'
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

  return Number.isNaN(date.getTime())
    ? ''
    : format(date, formatStr)
}

const csvCell = (value) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

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
    candidate.currentCompany,
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

export default function Students() {
  const [searchParams] = useSearchParams()

  const [students, setStudents] = useState([])
  const [placements, setPlacements] = useState([])
  const [bas, setBas] = useState([])

  const [loading, setLoading] = useState(true)
  const [savingFull, setSavingFull] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    ba: searchParams.get('ba') || 'all'
  }))

  const [selected, setSelected] = useState(null)

  // NEW STATE
  const [drawerMode, setDrawerMode] = useState('view')
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)

const [deletePrompt, setDeletePrompt] = useState({
  open: false,
  student: null
})

  const load = async () => {
    const [studentRes, baRes, placementRes] = await Promise.all([
      api.get('/students'),
      api.get('/ba/all'),
      api.get('/placements')
    ])

    setStudents(studentRes.data)
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
    socket.on('new_student', refresh)
    socket.on('student_updated', refresh)
    socket.on('student_deleted', refresh)

    return () => {
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('new_student', refresh)
      socket.off('student_updated', refresh)
      socket.off('student_deleted', refresh)
    }
  }, [])

  const placementCandidateId = (placement) =>
    placement.studentId?._id || placement.studentId || placement.candidateId?._id || placement.candidateId

  const placementByStudentId = useMemo(
    () =>
      new Map(
        placements.map((placement) => [
          placement.studentId?._id || placement.studentId,
          placement
        ])
      ),
    [placements]
  )

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()

    return students
      .map((student) => {
        const placement = placementByStudentId.get(student._id)

        return {
          ...student,
          placement,
          effectiveStatus:
            placement?.selectionStatus || student.status
        }
      })
      .filter((student) =>
        search
          ? `${student.candidateName} ${student.mobileNumber}`
              .toLowerCase()
              .includes(search)
          : true
      )
      .filter((student) =>
        filters.status === 'all'
          ? true
          : student.effectiveStatus === filters.status
      )
      .filter((student) =>
        filters.ba === 'all'
          ? true
          : student.submittedBy?._id === filters.ba
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      )
  }, [students, filters, placementByStudentId])

  const deleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.candidateName}?`))
      return

    try {
      await api.delete(`/students/${student._id}`)

      setStudents((current) =>
        current.filter((item) => item._id !== student._id)
      )

      toast.success('Student deleted')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not delete student'
      )
    }
  }

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
    totalExperience:
      student.totalExperience === ''
        ? undefined
        : student.totalExperience,
    careerSummary: student.careerSummary,
    currentSalary: student.currentSalary,
    expectedSalary: student.expectedSalary,
    noticePeriod:
      student.noticePeriod === ''
        ? undefined
        : student.noticePeriod,
    reasonForJobChange: student.reasonForJobChange,
    currentJobLocation: student.currentJobLocation,
    availabilityForInterview:
      student.availabilityForInterview,
    marriageStatus: student.marriageStatus || undefined,
    documents: student.documents || [],
    status: student.status,
    adminNotes: student.adminNotes,
    selectionStatus: student.selectionStatus
  })

  const saveSelected = async () => {
    if (!selected) return

    setSavingFull(true)

    try {
      const { data } = await api.put(
        `/students/${selected._id}`,
        buildStudentPayload(selected)
      )

      setStudents((current) =>
        current.map((item) =>
          item._id === data._id ? data : item
        )
      )

      setSelected(data)

      toast.success('Student updated')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not update student'
      )
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

      files.forEach((file) =>
        formData.append('documents', file)
      )

      const { data } = await api.post(
        `/students/${selected._id}/docs`,
        formData
      )

      setStudents((current) =>
        current.map((item) =>
          item._id === data._id ? data : item
        )
      )

      setSelected(data)

      toast.success('Documents uploaded')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not upload documents'
      )
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
        'Current Company',
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

      const rows = filtered.map((student) => {
        const placement = student.placement || {}

        return [
          student.candidateName,
          student.mobileNumber,
          student.whatsappNo,
          student.emailId,
          student.aadhaarNo,
          student.appliedFor,
          student.interestedDepartment,
          student.preferredIndustry,
          student.preferredJobLocation,
          student.education,
          student.currentCompany,
          student.totalExperience,
          student.currentSalary,
          student.expectedSalary,
          student.noticePeriod,
          student.currentJobLocation,
          student.marriageStatus,
          student.submittedBy?.name || 'BA',
          safeDate(student.createdAt),
          statusLabel(student.status),
          placement.selectionStatus
            ? selectionStatusLabel[
                placement.selectionStatus
              ] || placement.selectionStatus
            : '',
          placement.processStage
            ? processStageLabel[
                placement.processStage
              ] || placement.processStage
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
          student.adminNotes || ''
        ]
      })

      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(','))
        .join('\n')

      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;'
      })

      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = `student-references-${
        safeDate(new Date()) || 'export'
      }.csv`

      link.click()

      URL.revokeObjectURL(link.href)

      toast.success('Student export downloaded')
    } catch (_error) {
      toast.error('Could not export candidate data')
    }
  }

  if (loading) return <Skeleton rows={9} />

  return (
    <div className="space-y-6">
      <Header
        title="Students"
        subtitle="Search, filter, view, edit, export, and delete student references."
        onExport={exportCsv}
      />

      <Filters
        filters={filters}
        setFilters={setFilters}
        bas={bas}
        searchPlaceholder="Search by name or mobile"
      />

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
              {filtered.map((student) => (
                <tr
                  key={student._id}
                  className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {student.candidateName}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.mobileNumber}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.appliedFor || 'Not provided'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.submittedBy?.name || 'BA'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {format(
                      new Date(student.createdAt),
                      'dd MMM yyyy'
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {student.placement?.selectionStatus ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectionStatusColors[
                            student.placement.selectionStatus
                          ] ||
                          selectionStatusColors.shortlisted
                        }`}
                      >
                        {selectionStatusLabel[
                          student.placement.selectionStatus
                        ] ||
                          student.placement.selectionStatus}
                      </span>
                    ) : (
                      <StatusBadge status={student.status} />
                    )}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {student.placement?.processStage
                      ? processStageLabel[
                          student.placement.processStage
                        ] ||
                        student.placement.processStage
                      : '-'}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-2">

                      {/* VIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode('view')
                          setSelected(student)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50"
                        aria-label="View student"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* EDIT BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode('edit')
                          setSelected(student)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                        aria-label="Edit student"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                       onClick={() =>
  setDeletePrompt({
    open: true,
    student
  })
}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No matching student references.
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
  mode={drawerMode}
  onClose={() => setSelected(null)}
  adminControls
  fullEdit={drawerMode === 'edit'}
  onItemChange={setSelected}
  onStatusChange={(status) =>
    setSelected((current) => ({
      ...current,
      status
    }))
  }
  onNotesChange={(adminNotes) =>
    setSelected((current) => ({
      ...current,
      adminNotes
    }))
  }
  onSaveFull={requestSaveSelected}
  savingFull={savingFull}
  onUploadDocuments={uploadDocuments}
  uploadingDocuments={uploadingDocuments}
/>
      <ConfirmDialog
        open={saveConfirmOpen}
        title="Save Candidate Changes"
        message={`Save updates for ${selected?.candidateName || 'this candidate'}?`}
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
        message={`Type DELETE to confirm deleting ${deletePrompt.student?.candidateName || 'this candidate'}. Linked process-panel data will also be removed.`}
        placeholder="Type DELETE"
        confirmText="Delete"
        inputType="text"
        onCancel={() => setDeletePrompt({ open: false, student: null })}
        onConfirm={async (value) => {
          if (String(value || '').trim().toUpperCase() !== 'DELETE') {
            toast.error('Please type DELETE to confirm')
            return
          }
          const student = deletePrompt.student
          setDeletePrompt({ open: false, student: null })
          if (student) {
            await deleteStudent(student)
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
        <h1 className="text-2xl font-bold text-slate-950">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  )
}

function Filters({
  filters,
  setFilters,
  bas,
  searchPlaceholder
}) {
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
      <input
        value={filters.search}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            search: event.target.value
          }))
        }
        placeholder={searchPlaceholder}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />

      <select
        value={filters.status}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            status: event.target.value
          }))
        }
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
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

      <select
        value={filters.ba}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            ba: event.target.value
          }))
        }
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        <option value="all">All BAs</option>

        {bas.map((ba) => (
          <option
            key={ba.userId?._id || ba._id}
            value={ba.userId?._id}
          >
            {ba.userId?.name || ba.fullName}
          </option>
        ))}
      </select>
    </div>
  )
}