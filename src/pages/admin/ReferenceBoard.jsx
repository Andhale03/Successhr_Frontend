import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import {
  // ArrowDown,
  // ArrowUp,
  AlertTriangle,
  Building2,
  Calendar,
  // GripVertical,
  Save,
  UserCircle2,
  UsersRound,
  Eye,
Pencil,
Trash2,
  X
} from 'lucide-react'
import api, { assetUrl } from '../../api/axios'
import socket from '../../socket'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const STATUS_COLUMNS = [
  { key: 'not_viewed', label: 'Not Viewed', headerClass: 'bg-slate-200 text-slate-700' },
  { key: 'in_review', label: 'In Review', headerClass: 'bg-blue-100 text-blue-700' },
  { key: 'priority', label: 'Priority', headerClass: 'bg-amber-100 text-amber-700' },
  { key: 'done', label: 'Done', headerClass: 'bg-emerald-100 text-emerald-700' }
]

const selectionStatuses = [
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'selected', label: 'Selected' },
  { value: 'joined', label: 'Joined' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' }
]

const processStages = [
  { value: 'appointment_letter_pending', label: 'Appointment Letter Pending' },
  { value: 'appointment_letter_shared', label: 'Appointment Letter Shared' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Completed' },
  { value: 'selected', label: 'Selected' },
  { value: 'joined', label: 'Joined' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' }
]

const processStageBySelectionStatus = {
  shortlisted: 'appointment_letter_pending',
  selected: 'selected',
  joined: 'joined',
  rejected: 'rejected',
  on_hold: 'on_hold'
}

const selectionStatusByProcessStage = {
  appointment_letter_pending: 'shortlisted',
  appointment_letter_shared: 'shortlisted',
  interview_scheduled: 'shortlisted',
  interview_completed: 'shortlisted',
  selected: 'selected',
  joined: 'joined',
  rejected: 'rejected',
  on_hold: 'on_hold'
}

const referenceLabel = (reference) => (reference.type === 'student' ? reference.candidateName : reference.companyName)
const referenceActivityTime = (reference) => reference.updatedAt || reference.createdAt

const parseSalary = (value) => {
  const amount = Number(String(value ?? '').replace(/,/g, '') || 0)
  return Number.isFinite(amount) ? amount : 0
}

const calcEarning = (salary, percent, basis) => {
  const salaryNum = parseSalary(salary)
  const percentNum = Number(percent || 0)
  const basisNum = Number(basis || 1)
  if (!Number.isFinite(percentNum) || !Number.isFinite(basisNum)) return 0
  return salaryNum * basisNum * (percentNum / 100)
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

const buildReferenceSearchText = (reference) => {
  const commonFields = [
    reference.type,
    reference.status,
    reference.adminNotes,
    reference.submittedBy?.name,
    reference.submittedBy?.email
  ]

  if (reference.type === 'student') {
    const studentFields = [
      reference.candidateName,
      reference.mobileNumber,
      reference.aadhaarNo,
      reference.whatsappNo,
      reference.emailId,
      reference.appliedFor,
      reference.interestedDepartment,
      reference.preferredIndustry,
      reference.preferredJobLocation,
      reference.education,
      reference.currentJobLocation,
      reference.careerSummary,
      reference.reasonForJobChange
    ]
    return [...commonFields, ...studentFields]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }

  const job = reference.jobRequirements || {}
  const about = reference.aboutCompany || {}
  const companyFields = [
    reference.companyName,
    reference.companyAddress,
    reference.contactPersonName,
    reference.contactPersonDesignation,
    reference.mobileNo,
    reference.emailId,
    job.jobProfile,
    job.education,
    job.experience,
    job.requiredKeySkills?.join(' '),
    job.rolesAndResponsibility,
    job.salaryRange,
    job.gender,
    job.numberOfVacancy,
    job.jobTime,
    job.shift,
    job.jobLocation,
    job.ageCriteria,
    job.castCriteria,
    job.marriageCriteria,
    job.facilities?.join(' '),
    about.manpower,
    about.turnover,
    about.plant,
    about.interviewMode,
    about.weeklyOff?.join(' ')
  ]

  return [...commonFields, ...companyFields]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const buildReferenceSearchDigits = (reference) => {
  if (reference.type === 'student') {
    return [reference.mobileNumber, reference.aadhaarNo, reference.whatsappNo]
      .map((value) => digitsOnly(value))
      .filter(Boolean)
      .join(' ')
  }

  return digitsOnly(reference.mobileNo)
}

export default function ReferenceBoard() {
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [bas, setBas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRef, setActiveRef] = useState(null)
  const [viewMode, setViewMode] = useState('view')
  const [newCardIds, setNewCardIds] = useState([])
  const [filters, setFilters] = useState({ type: 'all', ba: 'all', from: '', to: '', search: '' })
  const [placementForm, setPlacementForm] = useState({
    id: '',
    studentId: '',
    companyId: '',
    jobProfile: '',
    offeredSalaryPM: '',
    joiningDate: '',
    selectionStatus: 'shortlisted',
    processStage: 'appointment_letter_pending',
    appointmentLetterDate: '',
    interviewDate: '',
    interviewMode: '',
    processNotes: '',
    earningPercent: '',
    salaryBasis: 1,
    adminNotes: ''
  })
  const [placementSaving, setPlacementSaving] = useState(false)
  const [metaSaving, setMetaSaving] = useState(false)
  const [referenceSaving, setReferenceSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [placementBanner, setPlacementBanner] = useState('')

  const loadBoardData = async () => {
    const [studentRes, companyRes, baRes] = await Promise.all([api.get('/students'), api.get('/companies'), api.get('/ba/all')])
    setStudents(studentRes.data)
    setCompanies(companyRes.data)
    setBas(baRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadBoardData().catch(() => {
      toast.error('Could not load reference board')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const handleNewStudent = (student) => {
      setStudents((current) => [student, ...current.filter((item) => item._id !== student._id)])
      setNewCardIds((current) => [...current, `student-${student._id}`])
    }

    const handleNewCompany = (company) => {
      setCompanies((current) => [company, ...current.filter((item) => item._id !== company._id)])
      setNewCardIds((current) => [...current, `company-${company._id}`])
    }

    const refresh = () => {
      loadBoardData().catch(() => {})
    }

    socket.on('new_student', handleNewStudent)
    socket.on('new_company', handleNewCompany)
    socket.on('student_updated', refresh)
    socket.on('student_deleted', refresh)
    socket.on('company_updated', refresh)
    socket.on('company_deleted', refresh)
    socket.on('status_updated', refresh)
    socket.on('reordered', refresh)
    socket.on('placement_created', refresh)
    socket.on('placement_updated', refresh)
    socket.on('placement_paid', refresh)

    return () => {
      socket.off('new_student', handleNewStudent)
      socket.off('new_company', handleNewCompany)
      socket.off('student_updated', refresh)
      socket.off('student_deleted', refresh)
      socket.off('company_updated', refresh)
      socket.off('company_deleted', refresh)
      socket.off('status_updated', refresh)
      socket.off('reordered', refresh)
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
    }
  }, [])

  useEffect(() => {
    if (!newCardIds.length) return undefined
    const timer = setTimeout(() => {
      setNewCardIds([])
    }, 1400)
    return () => clearTimeout(timer)
  }, [newCardIds])

  const references = useMemo(() => {
    const studentRefs = students.map((student) => ({ ...student, type: 'student' }))
    const companyRefs = companies.map((company) => ({ ...company, type: 'company' }))
    return [...studentRefs, ...companyRefs]
  }, [students, companies])

  const filteredReferences = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const searchDigits = digitsOnly(search)

    return references
      .filter((reference) => (filters.type === 'all' ? true : reference.type === filters.type))
      .filter((reference) => (filters.ba === 'all' ? true : reference.submittedBy?._id === filters.ba))
      .filter((reference) => {
        if (!search) return true
        const text = buildReferenceSearchText(reference)
        if (text.includes(search)) return true
        if (searchDigits.length < 3) return false
        return buildReferenceSearchDigits(reference).includes(searchDigits)
      })
      .filter((reference) => {
        if (!filters.from && !filters.to) return true
        const created = new Date(reference.createdAt).getTime()
        if (filters.from && created < new Date(filters.from).getTime()) return false
        if (filters.to) {
          const end = new Date(filters.to)
          end.setHours(23, 59, 59, 999)
          if (created > end.getTime()) return false
        }
        return true
      })
      .sort((a, b) => {
        if ((a.priorityOrder || 0) !== (b.priorityOrder || 0)) {
          return (a.priorityOrder || 0) - (b.priorityOrder || 0)
        }
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [references, filters])

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, column) => {
      acc[column.key] = filteredReferences.filter((reference) => reference.status === column.key)
      return acc
    }, {})
  }, [filteredReferences])

  const updateReferenceStatus = async (reference, nextStatus) => {
    const endpoint = reference.type === 'student' ? `/students/${reference._id}/status` : `/companies/${reference._id}/status`
    const { data } = await api.patch(endpoint, {
      status: nextStatus,
      adminNotes: reference.adminNotes || ''
    })

    if (reference.type === 'student') {
      setStudents((current) => current.map((item) => (item._id === data._id ? data : item)))
    } else {
      setCompanies((current) => current.map((item) => (item._id === data._id ? data : item)))
    }
    setActiveRef((current) => (current && current._id === data._id ? { ...data, type: reference.type } : current))
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return

    const fromStatus = result.source.droppableId
    const toStatus = result.destination.droppableId
    if (fromStatus === toStatus) return

    const [type, id] = result.draggableId.split(':')
    const sourceList = grouped[fromStatus] || []
    const reference = sourceList.find((item) => item._id === id && item.type === type)
    if (!reference) return

    try {
      await updateReferenceStatus(reference, toStatus)
      toast.success('Reference status updated')
    } catch (_error) {
      toast.error('Could not move card')
    }
  }

  const openReference = async (reference, mode = 'view') => {
    setPlacementBanner('')
    setViewMode(mode)
    setActiveRef(reference)

    if (reference.type !== 'student') return

    try {
      const { data } = await api.get('/placements', { params: { studentId: reference._id } })
      const existing = data?.[0]
      if (existing) {
        setPlacementForm({
          id: existing._id,
          studentId: existing.studentId?._id || reference._id,
          companyId: existing.companyId?._id || '',
          jobProfile: existing.jobProfile || '',
          offeredSalaryPM: existing.offeredSalaryPM ?? '',
          joiningDate: existing.joiningDate ? format(new Date(existing.joiningDate), 'yyyy-MM-dd') : '',
          selectionStatus: existing.selectionStatus || 'shortlisted',
          processStage:
            existing.processStage ||
            processStageBySelectionStatus[existing.selectionStatus] ||
            'appointment_letter_pending',
          appointmentLetterDate: existing.appointmentLetterDate
            ? format(new Date(existing.appointmentLetterDate), 'yyyy-MM-dd')
            : '',
          interviewDate: existing.interviewDate ? format(new Date(existing.interviewDate), 'yyyy-MM-dd') : '',
          interviewMode: existing.interviewMode || '',
          processNotes: existing.processNotes || '',
          earningPercent: existing.earningPercent ?? existing.commissionPercent ?? '',
          salaryBasis: existing.salaryBasis ?? 1,
          adminNotes: existing.adminNotes || ''
        })
      } else {
        setPlacementForm({
          id: '',
          studentId: reference._id,
          companyId: '',
          jobProfile: '',
          offeredSalaryPM: '',
          joiningDate: '',
          selectionStatus: 'shortlisted',
          processStage: 'appointment_letter_pending',
          appointmentLetterDate: '',
          interviewDate: '',
          interviewMode: '',
          processNotes: '',
          earningPercent: '',
          salaryBasis: 1,
          adminNotes: ''
        })
      }
    } catch (_error) {
      setPlacementForm({
        id: '',
        studentId: reference._id,
        companyId: '',
        jobProfile: '',
        offeredSalaryPM: '',
        joiningDate: '',
        selectionStatus: 'shortlisted',
        processStage: 'appointment_letter_pending',
        appointmentLetterDate: '',
        interviewDate: '',
        interviewMode: '',
        processNotes: '',
        earningPercent: '',
        salaryBasis: 1,
        adminNotes: ''
      })
    }
  }

  const deleteReference = (reference) => {
    setDeleteConfirm(reference)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      if (deleteConfirm.type === 'student') {
        await api.delete(`/students/${deleteConfirm._id}`)
        setStudents((current) => current.filter((item) => item._id !== deleteConfirm._id))
      } else {
        await api.delete(`/companies/${deleteConfirm._id}`)
        setCompanies((current) => current.filter((item) => item._id !== deleteConfirm._id))
      }

      if (activeRef?.type === deleteConfirm.type && activeRef?._id === deleteConfirm._id) {
        setActiveRef(null)
      }

      toast.success('Record deleted successfully')
    } catch (error) {
      toast.error('Could not delete record')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const saveMeta = async () => {
    if (!activeRef) return
    setMetaSaving(true)

    try {
      await updateReferenceStatus(activeRef, activeRef.status)
      toast.success('Reference saved')
    } catch (_error) {
      toast.error('Could not save reference')
    } finally {
      setMetaSaving(false)
    }
  }

  const saveReferenceDetails = async () => {
    if (!activeRef) return
    setReferenceSaving(true)

    try {
      if (activeRef.type === 'student') {
        const payload = {
          candidateName: activeRef.candidateName,
          mobileNumber: activeRef.mobileNumber,
          aadhaarNo: activeRef.aadhaarNo,
          whatsappNo: activeRef.whatsappNo,
          emailId: activeRef.emailId,
          appliedFor: activeRef.appliedFor,
          interestedDepartment: activeRef.interestedDepartment,
          preferredIndustry: activeRef.preferredIndustry,
          preferredJobLocation: activeRef.preferredJobLocation,
          education: activeRef.education,
          totalExperience: activeRef.totalExperience === '' ? undefined : activeRef.totalExperience,
          careerSummary: activeRef.careerSummary,
          currentSalary: activeRef.currentSalary,
          expectedSalary: activeRef.expectedSalary,
          noticePeriod: activeRef.noticePeriod === '' ? undefined : activeRef.noticePeriod,
          reasonForJobChange: activeRef.reasonForJobChange,
          currentJobLocation: activeRef.currentJobLocation,
          availabilityForInterview: activeRef.availabilityForInterview,
          marriageStatus: activeRef.marriageStatus || undefined
        }

        const { data } = await api.put(`/students/${activeRef._id}`, payload)
        const updated = { ...data, type: 'student' }
        setActiveRef(updated)
        setStudents((current) => current.map((item) => (item._id === data._id ? data : item)))
      } else {
        const payload = {
          companyName: activeRef.companyName,
          companyAddress: activeRef.companyAddress,
          contactPersonName: activeRef.contactPersonName,
          contactPersonDesignation: activeRef.contactPersonDesignation,
          mobileNo: activeRef.mobileNo,
          emailId: activeRef.emailId,
          jobRequirements: activeRef.jobRequirements || {},
          aboutCompany: activeRef.aboutCompany || {}
        }

        const { data } = await api.put(`/companies/${activeRef._id}`, payload)
        const updated = { ...data, type: 'company' }
        setActiveRef(updated)
        setCompanies((current) => current.map((item) => (item._id === data._id ? data : item)))
      }

      toast.success('Reference details updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update reference details')
    } finally {
      setReferenceSaving(false)
    }
  }

  const savePlacement = async () => {
    if (!activeRef || activeRef.type !== 'student') return
    if (!placementForm.companyId) {
      toast.error('Please select a matched company')
      return
    }

    const offeredSalaryPM = parseSalary(placementForm.offeredSalaryPM)
    const earningPercent = Number(placementForm.earningPercent || 0)
    const salaryBasis = Number(placementForm.salaryBasis || 1)

    if (!Number.isFinite(offeredSalaryPM) || offeredSalaryPM < 0) {
      toast.error('Offered salary must be a valid non-negative number')
      return
    }

    if (!Number.isFinite(earningPercent) || earningPercent < 0 || earningPercent > 100) {
      toast.error('Earning % must be between 0 and 100')
      return
    }

    if (!Number.isInteger(salaryBasis) || salaryBasis < 1 || salaryBasis > 12) {
      toast.error('Salary basis must be an integer between 1 and 12')
      return
    }

    setPlacementSaving(true)
    try {
      const payload = {
        studentId: activeRef._id,
        companyId: placementForm.companyId,
        jobProfile: placementForm.jobProfile,
        offeredSalaryPM,
        joiningDate: placementForm.joiningDate || undefined,
        selectionStatus: placementForm.selectionStatus,
        processStage: placementForm.processStage,
        appointmentLetterDate: placementForm.appointmentLetterDate || undefined,
        interviewDate: placementForm.interviewDate || undefined,
        interviewMode: placementForm.interviewMode || undefined,
        processNotes: placementForm.processNotes,
        earningPercent,
        salaryBasis,
        adminNotes: placementForm.adminNotes
      }

      let response
      if (placementForm.id) {
        response = await api.put(`/placements/${placementForm.id}`, payload)
      } else {
        response = await api.post('/placements', payload)
      }

      setPlacementForm((current) => ({ ...current, id: response.data._id }))
      setPlacementBanner(`Placement saved - Advisor earns ${formatMoney(response.data.earningAmount)}`)
      toast.success(placementForm.id ? 'Placement updated' : 'Placement created')
      await loadBoardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save placement')
    } finally {
      setPlacementSaving(false)
    }
  }

  const earningPreview = useMemo(
    () => calcEarning(placementForm.offeredSalaryPM, placementForm.earningPercent, placementForm.salaryBasis),
    [placementForm.offeredSalaryPM, placementForm.earningPercent, placementForm.salaryBasis]
  )

  const isViewMode = viewMode === 'view'

  if (loading) {
    return <Skeleton rows={12} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reference Board</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track all student and company references in real-time, then create placements directly from student cards.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-5">
        <select
          value={filters.type}
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="student">Students</option>
          <option value="company">Companies</option>
        </select>
        <select
          value={filters.ba}
          onChange={(event) => setFilters((current) => ({ ...current, ba: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All BAs</option>
          {bas.map((ba) => (
            <option key={ba.userId?._id || ba._id} value={ba.userId?._id}>
              {ba.userId?.name || ba.fullName}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold uppercase text-slate-500">
          From
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm normal-case"
          />
        </label>
        <label className="text-xs font-semibold uppercase text-slate-500">
          To
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm normal-case"
          />
        </label>
        <label className="text-xs font-semibold uppercase text-slate-500 md:col-span-5">
          Search
          <input
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search by name, mobile, aadhaar, email, applied/job profile, company, contact person..."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm normal-case"
          />
        </label>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 xl:grid-cols-4">
          {STATUS_COLUMNS.map((column) => (
            <Droppable droppableId={column.key} key={column.key}>
              {(provided) => (
                <section
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex min-h-[520px] flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
                >
                  <header className={`flex items-center justify-between px-3 py-2 text-sm font-semibold ${column.headerClass}`}>
                    <span>{column.label}</span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{grouped[column.key]?.length || 0}</span>
                  </header>

                  <div className="flex-1 space-y-2 overflow-y-auto p-2">
                    {(grouped[column.key] || []).map((reference, index) => {
                      const draggableId = `${reference.type}:${reference._id}`
                      const animate = newCardIds.includes(`${reference.type}-${reference._id}`)
                      return (
                        <Draggable key={draggableId} draggableId={draggableId} index={index}>
                          {(dragProvided) => (
                            <article
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${
                                animate ? 'slide-in ring-1 ring-cyan-200' : ''
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    reference.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                                  }`}
                                  onClick={() => openReference(reference, 'view')}
                                >
                                  {reference.type === 'student' ? 'Student' : 'Company'}
                                </button>
                               <div className="flex items-center gap-1">
  {/* VIEW */}
  <button
    type="button"
    onClick={() => openReference(reference, 'view')}
    className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:bg-blue-100"
    title="View"
  >
    <Eye className="h-4 w-4" />
  </button>

  {/* EDIT */}
  <button
    type="button"
    onClick={() => openReference(reference, 'edit')}
    className="inline-flex h-7 w-7 items-center justify-center rounded text-emerald-600 hover:bg-emerald-100"
    title="Edit"
  >
    <Pencil className="h-4 w-4" />
  </button>

  {/* DELETE */}
  <button
    type="button"
    onClick={() => deleteReference(reference)}
    className="inline-flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-100"
    title="Delete"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</div>
                              </div>

                              <button type="button" className="w-full text-left" onClick={() => openReference(reference, 'view')}>
                                <p className="line-clamp-2 font-semibold text-slate-900">{referenceLabel(reference)}</p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {reference.type === 'student'
                                    ? `Applied for: ${reference.appliedFor || 'Not provided'}`
                                    : `Role: ${reference.jobRequirements?.jobProfile || 'Not provided'}`}
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                  <span>By</span>
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700">
                                    {reference.submittedBy?.name || 'BA'}
                                  </span>
                                  <span>|</span>
                                  <span>updated {formatDistanceToNow(new Date(referenceActivityTime(reference)), { addSuffix: true })}</span>
                                </p>
                              </button>
                            </article>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                </section>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {activeRef && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/45" onClick={() => setActiveRef(null)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      activeRef.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {activeRef.type === 'student' ? 'Student' : 'Company'}
                  </span>
                  <StatusBadge status={activeRef.status} />
                </div>
                <h2 className="truncate text-xl font-bold text-slate-900">{referenceLabel(activeRef)}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span>By</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                    {activeRef.submittedBy?.name || 'BA'}
                  </span>
                  <span>|</span>
                  <span>
                    Updated {format(new Date(referenceActivityTime(activeRef)), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRef(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase text-slate-500">Reference Details</h3>
                  { !isViewMode && (
                    <button
                      type="button"
                      onClick={saveReferenceDetails}
                      disabled={referenceSaving}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {referenceSaving ? 'Saving...' : 'Save Details'}
                    </button>
                  ) }
                </div>
                {activeRef.type === 'student' ? (
                  <>
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Candidate Name"
                        value={activeRef.candidateName}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, candidateName: value }))}
                      />
                      <Field
                        label="Mobile Number"
                        value={activeRef.mobileNumber}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, mobileNumber: value }))}
                      />
                      <Field
                        label="Aadhaar Number"
                        value={activeRef.aadhaarNo}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, aadhaarNo: value }))}
                      />
                      <Field
                        label="Email"
                        value={activeRef.emailId}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, emailId: value }))}
                      />
                      <Field
                        label="Applied For"
                        value={activeRef.appliedFor}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, appliedFor: value }))}
                      />
                      <Field
                        label="Interested Department"
                        value={activeRef.interestedDepartment}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, interestedDepartment: value }))}
                      />
                      <Field
                        label="Preferred Industry"
                        value={activeRef.preferredIndustry}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, preferredIndustry: value }))}
                      />
                      <Field
                        label="Preferred Job Location"
                        value={activeRef.preferredJobLocation}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, preferredJobLocation: value }))}
                      />
                      <Field
                        label="Education"
                        value={activeRef.education}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, education: value }))}
                      />
                      <Field
                        label="Experience (years)"
                        value={activeRef.totalExperience}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, totalExperience: value }))}
                      />
                      <Field
                        label="Current Salary"
                        value={activeRef.currentSalary}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, currentSalary: value }))}
                      />
                      <Field
                        label="Expected Salary"
                        value={activeRef.expectedSalary}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, expectedSalary: value }))}
                      />
                      <Field
                        label="Notice Period (months)"
                        value={activeRef.noticePeriod}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, noticePeriod: value }))}
                      />
                      <Field
                        label="Current Job Location"
                        value={activeRef.currentJobLocation}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, currentJobLocation: value }))}
                      />
                      <label className="text-sm font-semibold text-slate-700">
                        Marriage Status
                        <select
                          value={activeRef.marriageStatus || ''}
                          onChange={(event) => setActiveRef((current) => ({ ...current, marriageStatus: event.target.value }))}
                          disabled={isViewMode}
                          className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                            isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                          }`}
                        >
                          <option value="">Select status</option>
                          <option value="Married">Married</option>
                          <option value="Unmarried">Unmarried</option>
                          <option value="Single">Single</option>
                        </select>
                      </label>
                    </div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Career Summary
                      <textarea
                        rows={3}
                        value={activeRef.careerSummary || ''}
                        onChange={(event) =>
                          setActiveRef((current) => ({ ...current, careerSummary: event.target.value }))
                        }
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      />
                    </label>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Reason for Job Change
                      <textarea
                        rows={3}
                        value={activeRef.reasonForJobChange || ''}
                        onChange={(event) =>
                          setActiveRef((current) => ({ ...current, reasonForJobChange: event.target.value }))
                        }
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      />
                    </label>
                    <StudentDetail student={activeRef} />
                  </>
                ) : (
                  <>
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Company Name"
                        value={activeRef.companyName}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, companyName: value }))}
                      />
                      <Field
                        label="Contact Person"
                        value={activeRef.contactPersonName}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, contactPersonName: value }))}
                      />
                      <Field
                        label="Designation"
                        value={activeRef.contactPersonDesignation}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, contactPersonDesignation: value }))}
                      />
                      <Field
                        label="Mobile"
                        value={activeRef.mobileNo}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, mobileNo: value }))}
                      />
                      <Field
                        label="Email"
                        value={activeRef.emailId}
                        readOnly={isViewMode}
                        onChange={(value) => setActiveRef((current) => ({ ...current, emailId: value }))}
                      />
                      <Field
                        label="Job Profile"
                        value={activeRef.jobRequirements?.jobProfile}
                        readOnly={isViewMode}
                        onChange={(value) =>
                          setActiveRef((current) => ({
                            ...current,
                            jobRequirements: {
                              ...(current.jobRequirements || {}),
                              jobProfile: value
                            }
                          }))
                        }
                      />
                    </div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Company Address
                      <textarea
                        rows={3}
                        value={activeRef.companyAddress || ''}
                        onChange={(event) =>
                          setActiveRef((current) => ({ ...current, companyAddress: event.target.value }))
                        }
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      />
                    </label>
                    <CompanyDetail company={activeRef} />
                  </>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Admin Controls</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Status
                    <select
                      value={activeRef.status}
                      onChange={(event) => setActiveRef((current) => ({ ...current, status: event.target.value }))}
                      disabled={isViewMode}
                      className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                        isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                      }`}
                    >
                      <option value="not_viewed">Not Viewed</option>
                      <option value="in_review">In Review</option>
                      <option value="priority">Priority</option>
                      <option value="done">Done</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Admin Notes
                    <textarea
                      rows={3}
                      value={activeRef.adminNotes || ''}
                      onChange={(event) => setActiveRef((current) => ({ ...current, adminNotes: event.target.value }))}
                      onBlur={isViewMode ? undefined : saveMeta}
                      disabled={isViewMode}
                      className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                        isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                      }`}
                    />
                  </label>
                </div>
                { !isViewMode && (
                  <button
                    type="button"
                    onClick={saveMeta}
                    disabled={metaSaving}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {metaSaving ? 'Saving...' : 'Save'}
                  </button>
                ) }
              </section>

              {activeRef.type === 'student' && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase text-slate-500">
                      {isViewMode ? 'Placement Details' : placementForm.id ? 'Edit Placement' : 'Create Placement'}
                    </h3>
                    {placementBanner ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{placementBanner}</span> : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Matched Company
                      <select
                        value={placementForm.companyId}
                        onChange={(event) => setPlacementForm((current) => ({ ...current, companyId: event.target.value }))}
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company._id} value={company._id}>
                            {company.companyName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Field
                      label="Job Profile"
                      value={placementForm.jobProfile}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, jobProfile: value }))}
                    />
                    <Field
                      label="Offered Salary (PM)"
                      type="number"
                      value={placementForm.offeredSalaryPM}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, offeredSalaryPM: value }))}
                    />
                    <Field
                      label="Joining Date"
                      type="date"
                      value={placementForm.joiningDate}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, joiningDate: value }))}
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Selection Status
                      <select
                        value={placementForm.selectionStatus}
                        onChange={(event) => {
                          const nextSelectionStatus = event.target.value
                          setPlacementForm((current) => ({
                            ...current,
                            selectionStatus: nextSelectionStatus,
                            processStage:
                              processStageBySelectionStatus[nextSelectionStatus] || current.processStage
                          }))
                        }}
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      >
                        {selectionStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Next Process
                      <select
                        value={placementForm.processStage}
                        onChange={(event) => {
                          const nextProcessStage = event.target.value
                          setPlacementForm((current) => ({
                            ...current,
                            processStage: nextProcessStage,
                            selectionStatus:
                              selectionStatusByProcessStage[nextProcessStage] || current.selectionStatus
                          }))
                        }}
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      >
                        {processStages.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Appointment Letter Date"
                      type="date"
                      value={placementForm.appointmentLetterDate}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, appointmentLetterDate: value }))}
                    />
                    <Field
                      label="Interview Date"
                      type="date"
                      value={placementForm.interviewDate}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, interviewDate: value }))}
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Interview Mode
                      <select
                        value={placementForm.interviewMode}
                        onChange={(event) => setPlacementForm((current) => ({ ...current, interviewMode: event.target.value }))}
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      >
                        <option value="">Select mode</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Telephonic">Telephonic</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </label>
                    <Field
                      label="Earning %"
                      type="number"
                      value={placementForm.earningPercent}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, earningPercent: value }))}
                    />
                    <Field
                      label="Salary Basis (months)"
                      type="number"
                      value={placementForm.salaryBasis}
                      readOnly={isViewMode}
                      onChange={(value) => setPlacementForm((current) => ({ ...current, salaryBasis: value }))}
                    />
                    <div className="sm:col-span-2 -mt-2 text-xs text-slate-500">
                      Advisor earns % of (salary x basis months)
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      <p className="text-xs uppercase text-slate-500">Earning Amount</p>
                      <p className="mt-1 text-base text-emerald-700">{formatMoney(earningPreview)}</p>
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      {[8.33, 16.67, 25].map((percent) => (
                        <button
                          key={percent}
                          type="button"
                          onClick={() => setPlacementForm((current) => ({ ...current, earningPercent: percent }))}
                          disabled={isViewMode}
                          className={`inline-flex min-h-8 items-center rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 ${
                            isViewMode ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-100'
                          }`}
                        >
                          {percent}%
                        </button>
                      ))}
                      <span className="inline-flex min-h-8 items-center rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-600">
                        Custom
                      </span>
                    </div>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Process Notes
                      <textarea
                        rows={2}
                        value={placementForm.processNotes}
                        onChange={(event) =>
                          setPlacementForm((current) => ({ ...current, processNotes: event.target.value }))
                        }
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Admin Notes
                      <textarea
                        rows={3}
                        value={placementForm.adminNotes}
                        onChange={(event) =>
                          setPlacementForm((current) => ({ ...current, adminNotes: event.target.value }))
                        }
                        disabled={isViewMode}
                        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
                          isViewMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                        }`}
                      />
                    </label>
                  </div>

                  { !isViewMode && (
                    <button
                      type="button"
                      onClick={savePlacement}
                      disabled={placementSaving}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      <Save className="h-4 w-4" />
                      {placementSaving ? 'Saving...' : placementForm.id ? 'Save Placement' : 'Create Placement'}
                    </button>
                  ) }
                </section>
              )}
            </div>
          </aside>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
            <div className="mb-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Delete Record</h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 ${
          readOnly ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
        }`}
      />
    </label>
  )
}

function StudentDetail({ student }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Candidate Name" value={student.candidateName} icon={UserCircle2} />
        <Info label="Mobile Number" value={student.mobileNumber} />
        <Info label="Aadhaar Number" value={student.aadhaarNo} />
        <Info label="Email" value={student.emailId} />
        <Info label="Applied For" value={student.appliedFor} />
        <Info label="Interested Department" value={student.interestedDepartment} />
        <Info label="Preferred Industry" value={student.preferredIndustry} />
        <Info label="Preferred Job Location" value={student.preferredJobLocation} />
        <Info label="Education" value={student.education} />
        <Info label="Experience (years)" value={student.totalExperience} />
        <Info label="Current Salary" value={student.currentSalary} />
        <Info label="Expected Salary" value={student.expectedSalary} />
        <Info label="Notice Period (months)" value={student.noticePeriod} />
        <Info label="Current Job Location" value={student.currentJobLocation} />
        <Info label="Marriage Status" value={student.marriageStatus} />
      </div>
      <Info label="Career Summary" value={student.careerSummary} multiline />
      <Info label="Reason for Job Change" value={student.reasonForJobChange} multiline />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Documents</p>
        {student.documents?.length ? (
          <div className="space-y-2">
            {student.documents.map((doc) => (
              <a
                key={doc._id || doc.fileUrl}
                href={assetUrl(doc.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                {doc.fileName || 'Document'} ·{' '}
                {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'Uploaded'}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No documents uploaded.</p>
        )}
      </div>
    </div>
  )
}

function CompanyDetail({ company }) {
  const job = company.jobRequirements || {}
  const about = company.aboutCompany || {}

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Company Name" value={company.companyName} icon={Building2} />
        <Info label="Company Address" value={company.companyAddress} />
        <Info label="Contact Person" value={company.contactPersonName} />
        <Info label="Designation" value={company.contactPersonDesignation} />
        <Info label="Mobile" value={company.mobileNo} />
        <Info label="Email" value={company.emailId} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Job Profile" value={job.jobProfile} />
        <Info label="Education" value={job.education} />
        <Info label="Experience" value={job.experience} />
        <Info label="Salary Range" value={job.salaryRange} />
        <Info label="Gender" value={job.gender} />
        <Info label="Vacancies" value={job.numberOfVacancy} />
        <Info label="Job Time" value={job.jobTime} />
        <Info label="Shift" value={job.shift} />
        <Info label="Job Location" value={job.jobLocation} />
        <Info label="Age Criteria" value={job.ageCriteria} />
        <Info label="Caste Criteria" value={job.castCriteria} />
        <Info label="Marriage Criteria" value={job.marriageCriteria} />
        <Info label="Facilities" value={job.facilities?.join(', ')} multiline />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Manpower" value={about.manpower} icon={UsersRound} />
        <Info label="Turnover" value={about.turnover} />
        <Info label="Plant" value={about.plant} />
        <Info label="Interview Mode" value={about.interviewMode} />
        <Info label="Weekly Off" value={about.weeklyOff?.join(', ')} />
        <Info
          label="Availability For Interview"
          value={
            about.availabilityForInterview?.date
              ? `${format(new Date(about.availabilityForInterview.date), 'dd MMM yyyy')} ${
                  about.availabilityForInterview.time || ''
                }`
              : ''
          }
          icon={Calendar}
        />
      </div>
    </div>
  )
}

function Info({ label, value, multiline = false, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`text-sm text-slate-900 ${multiline ? '' : 'truncate'}`}>
        {Icon ? <Icon className="mr-1.5 inline h-4 w-4 text-slate-400" /> : null}
        {value || 'Not provided'}
      </p>
    </div>
  )
}


