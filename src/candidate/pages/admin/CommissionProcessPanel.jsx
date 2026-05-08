import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Check, Pencil, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Skeleton from '../../components/Skeleton'
import socket from '../../socket'
import { ConfirmDialog } from '../../components/ActionDialogs'

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

const interviewModes = ['Online', 'Offline', 'Telephonic', 'Hybrid']

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

const processStageFlow = [
  'appointment_letter_pending',
  'appointment_letter_shared',
  'interview_scheduled',
  'interview_completed',
  'selected',
  'joined'
]

const getNextProcessStage = (currentStage) => {
  const currentIndex = processStageFlow.indexOf(currentStage)
  if (currentIndex === -1) return processStageFlow[0]
  if (currentIndex >= processStageFlow.length - 1) return null
  return processStageFlow[currentIndex + 1]
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

export default function CommissionProcessPanel() {
  const [placements, setPlacements] = useState([])
  const [bas, setBas] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPlacementId, setEditingPlacementId] = useState('')
  const [advancingPlacementId, setAdvancingPlacementId] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [editForm, setEditForm] = useState({
    companyId: '',
    jobProfile: '',
    offeredSalaryPM: '',
    salaryBasis: 1,
    earningPercent: '',
    processStage: 'appointment_letter_pending',
    selectionStatus: 'shortlisted',
    joiningDate: '',
    appointmentLetterDate: '',
    interviewDate: '',
    interviewMode: '',
    earningStatus: 'pending',
    earningPaidDate: '',
    processNotes: '',
    adminNotes: ''
  })
  const [filters, setFilters] = useState({
    ba: 'all',
    selectionStatus: 'all',
    processStage: 'all',
    earningStatus: 'all',
    search: ''
  })

  const loadData = async () => {
    const [placementRes, baRes, companyRes] = await Promise.all([api.get('/placements'), api.get('/ba/all'), api.get('/companies')])
    setPlacements(placementRes.data)
    setBas(baRes.data)
    setCompanies(companyRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      toast.error('Could not load process panel')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const refresh = () => {
      loadData().catch(() => {})
    }

    socket.on('placement_created', refresh)
    socket.on('placement_updated', refresh)
    socket.on('placement_paid', refresh)
    socket.on('placement_deleted', refresh)

    return () => {
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
      socket.off('placement_deleted', refresh)
    }
  }, [])

  const filteredPlacements = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return placements
      .filter((placement) => (filters.ba === 'all' ? true : placement.baId?._id === filters.ba))
      .filter((placement) => (filters.selectionStatus === 'all' ? true : placement.selectionStatus === filters.selectionStatus))
      .filter((placement) => (filters.processStage === 'all' ? true : placement.processStage === filters.processStage))
      .filter((placement) => (filters.earningStatus === 'all' ? true : placement.earningStatus === filters.earningStatus))
      .filter((placement) => {
        if (!search) return true
        const student = (placement.studentId?.candidateName || '').toLowerCase()
        const company = (placement.companyId?.companyName || '').toLowerCase()
        const ba = (placement.baId?.name || '').toLowerCase()
        const jobProfile = (placement.companyId?.jobRequirements?.jobProfile || placement.jobProfile || '').toLowerCase()
        return student.includes(search) || company.includes(search) || ba.includes(search) || jobProfile.includes(search)
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }, [placements, filters])

  const stats = useMemo(() => {
    const total = filteredPlacements.length
    const selected = filteredPlacements.filter((placement) => placement.selectionStatus === 'selected').length
    const joined = filteredPlacements.filter((placement) => placement.selectionStatus === 'joined').length
    const pendingPayments = filteredPlacements.filter((placement) => placement.earningStatus !== 'paid').length

    return { total, selected, joined, pendingPayments }
  }, [filteredPlacements])

  const editingPlacement = useMemo(
    () => placements.find((placement) => placement._id === editingPlacementId) || null,
    [placements, editingPlacementId]
  )

  const startEdit = (placement) => {
    setEditingPlacementId(placement._id)
    setEditForm({
      companyId: placement.companyId?._id || '',
      jobProfile: placement.jobProfile || placement.companyId?.jobRequirements?.jobProfile || '',
      offeredSalaryPM: placement.offeredSalaryPM ?? '',
      salaryBasis: placement.salaryBasis ?? 1,
      earningPercent: placement.earningPercent ?? '',
      processStage: placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending',
      selectionStatus: placement.selectionStatus || 'shortlisted',
      joiningDate: placement.joiningDate ? format(new Date(placement.joiningDate), 'yyyy-MM-dd') : '',
      appointmentLetterDate: placement.appointmentLetterDate ? format(new Date(placement.appointmentLetterDate), 'yyyy-MM-dd') : '',
      interviewDate: placement.interviewDate ? format(new Date(placement.interviewDate), 'yyyy-MM-dd') : '',
      interviewMode: placement.interviewMode || '',
      earningStatus: placement.earningStatus || 'pending',
      earningPaidDate: placement.earningPaidDate ? format(new Date(placement.earningPaidDate), 'yyyy-MM-dd') : '',
      processNotes: placement.processNotes || '',
      adminNotes: placement.adminNotes || ''
    })
  }

  const cancelEdit = () => {
    setEditingPlacementId('')
  }

  const requestSaveEdit = (placement) => {
    setConfirmAction({
      title: 'Save Process Changes',
      message: `Save process and earning updates for ${placement.studentId?.candidateName || 'this candidate'}?`,
      confirmText: 'Save Changes',
      onConfirm: () => saveEdit(placement._id)
    })
  }

  const saveEdit = async (placementId) => {
    try {
      await api.put(`/placements/${placementId}`, {
        companyId: editForm.companyId || undefined,
        jobProfile: editForm.jobProfile,
        offeredSalaryPM: Number(editForm.offeredSalaryPM || 0),
        salaryBasis: Number(editForm.salaryBasis || 1),
        earningPercent: Number(editForm.earningPercent || 0),
        processStage: editForm.processStage,
        selectionStatus: editForm.selectionStatus,
        joiningDate: editForm.joiningDate || undefined,
        appointmentLetterDate: editForm.appointmentLetterDate || undefined,
        interviewDate: editForm.interviewDate || undefined,
        interviewMode: editForm.interviewMode || undefined,
        earningStatus: editForm.earningStatus,
        earningPaidDate: editForm.earningStatus === 'paid' ? editForm.earningPaidDate || undefined : undefined,
        processNotes: editForm.processNotes,
        adminNotes: editForm.adminNotes
      })
      toast.success('Process details updated')
      setEditingPlacementId('')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update placement')
    }
  }

  const requestAdvanceToNextStage = (placement) => {
    const currentStage =
      placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending'
    const nextStage = getNextProcessStage(currentStage)

    if (!nextStage) {
      toast('This placement is already at the final stage')
      return
    }

    setConfirmAction({
      title: 'Move Process Stage',
      message: `Move ${placement.studentId?.candidateName || 'this candidate'} to ${processStageLabel[nextStage]}?`,
      confirmText: 'Move Stage',
      onConfirm: () => advanceToNextStage(placement, nextStage)
    })
  }

  const advanceToNextStage = async (placement, nextStage) => {
    const resolvedNextStage =
      nextStage ||
      getNextProcessStage(
        placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending'
      )

    if (!resolvedNextStage) {
      toast('This placement is already at the final stage')
      return
    }

    setAdvancingPlacementId(placement._id)
    try {
      await api.put(`/placements/${placement._id}`, {
        processStage: resolvedNextStage,
        selectionStatus: selectionStatusByProcessStage[resolvedNextStage] || placement.selectionStatus
      })
      toast.success(`Moved to ${processStageLabel[resolvedNextStage]}`)
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move to next process stage')
    } finally {
      setAdvancingPlacementId('')
    }
  }

  const requestPaymentStatusUpdate = (placement, nextStatus) => {
    const studentName = placement.studentId?.candidateName || 'this candidate'
    const amount = formatMoney(placement.earningAmount || 0)
    const actionText = nextStatus === 'paid' ? 'mark advisor payment as paid' : 'move advisor payment back to pending'

    setConfirmAction({
      title: nextStatus === 'paid' ? 'Mark Payment Paid' : 'Mark Payment Pending',
      message: `Are you sure you want to ${actionText} for ${studentName} (${amount})?`,
      confirmText: nextStatus === 'paid' ? 'Mark Paid' : 'Mark Pending',
      onConfirm: () => updatePaymentStatus(placement, nextStatus)
    })
  }

  const updatePaymentStatus = async (placement, nextStatus) => {
    try {
      if (nextStatus === 'paid') {
        await api.patch(`/placements/${placement._id}/pay`, {
          earningStatus: 'paid',
          earningPaidDate: new Date().toISOString()
        })
      } else {
        await api.put(`/placements/${placement._id}`, {
          earningStatus: 'pending'
        })
      }

      toast.success(nextStatus === 'paid' ? 'Marked as paid' : 'Payment moved to pending')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update payment status')
    }
  }

  if (loading) {
    return <Skeleton rows={12} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Process Stage & Salary Panel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Super admin can update selected/joined stage, salary, commission percent, and payment status from one panel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Placements" value={stats.total} />
        <StatCard label="Selected" value={stats.selected} />
        <StatCard label="Joined" value={stats.joined} />
        <StatCard label="Pending Payout" value={stats.pendingPayments} />
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-5">
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

        <select
          value={filters.selectionStatus}
          onChange={(event) => setFilters((current) => ({ ...current, selectionStatus: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Selection Statuses</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="selected">Selected</option>
          <option value="joined">Joined</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </select>

        <select
          value={filters.processStage}
          onChange={(event) => setFilters((current) => ({ ...current, processStage: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Process Stages</option>
          {Object.entries(processStageLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.earningStatus}
          onChange={(event) => setFilters((current) => ({ ...current, earningStatus: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>

        <input
          type="text"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search candidate/company/BA/job profile"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Candidate</th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">BA</th>
                <th className="px-3 py-3">Process Stage</th>
                <th className="px-3 py-3">Job Profile</th>
                <th className="px-3 py-3">Salary/PM</th>
                <th className="px-3 py-3">Basis</th>
                <th className="px-3 py-3">%</th>
                <th className="px-3 py-3">Earning</th>
                <th className="px-3 py-3">Joining</th>
                <th className="px-3 py-3">Appt. Letter</th>
                <th className="px-3 py-3">Interview</th>
                <th className="px-3 py-3">Process Notes</th>
                <th className="px-3 py-3">Payment</th>
                <th className="sticky right-0 z-10 bg-slate-50 px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlacements.map((placement) => {
                const currentProcessStage =
                  placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending'
                const nextProcessStage = getNextProcessStage(currentProcessStage)

                return (
                  <tr key={placement._id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{placement.studentId?.candidateName || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{placement.companyId?.companyName || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{placement.baId?.name || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{processStageLabel[currentProcessStage] || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {placement.companyId?.jobRequirements?.jobProfile || placement.jobProfile || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{formatMoney(placement.offeredSalaryPM || 0)}</td>
                    <td className="px-3 py-2 text-slate-700">{placement.salaryBasis || 1} mo</td>
                    <td className="px-3 py-2 text-slate-700">{placement.earningPercent || 0}%</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">{formatMoney(placement.earningAmount || 0)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {placement.joiningDate ? format(new Date(placement.joiningDate), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {placement.appointmentLetterDate ? format(new Date(placement.appointmentLetterDate), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <div className="space-y-0.5">
                        <p>{placement.interviewDate ? format(new Date(placement.interviewDate), 'dd MMM yyyy') : '-'}</p>
                        <p className="text-xs text-slate-500">{placement.interviewMode || '-'}</p>
                      </div>
                    </td>
                    <td className="max-w-56 truncate px-3 py-2 text-slate-700" title={placement.processNotes || ''}>
                      {placement.processNotes || '-'}
                    </td>
                    <td className="px-3 py-2">
                      <PaymentBadge status={placement.earningStatus} />
                    </td>
                    <td className="sticky right-0 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {nextProcessStage && (
                          <button
                            type="button"
                            onClick={() => requestAdvanceToNextStage(placement)}
                            disabled={advancingPlacementId === placement._id}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 text-xs font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {advancingPlacementId === placement._id ? 'Updating...' : 'Next Stage'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(placement)}
                          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestPaymentStatusUpdate(
                              placement,
                              placement.earningStatus === 'paid' ? 'pending' : 'paid'
                            )
                          }
                          className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-white ${
                            placement.earningStatus === 'paid' ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {placement.earningStatus === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!filteredPlacements.length && (
                <tr>
                  <td colSpan="15" className="px-5 py-10 text-center text-slate-500">
                    No placements found. Create a placement from Reference Board first, then process updates will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcessEditModal
        open={Boolean(editingPlacement)}
        placement={editingPlacement}
        form={editForm}
        companies={companies}
        onChange={setEditForm}
        onClose={cancelEdit}
        onSave={() => editingPlacement && requestSaveEdit(editingPlacement)}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        danger={confirmAction?.danger}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          const action = confirmAction?.onConfirm
          setConfirmAction(null)
          await action?.()
        }}
      />
    </div>
  )
}

function ProcessEditModal({ open, placement, form, companies, onChange, onClose, onSave }) {
  if (!open || !placement) return null

  const update = (field, value) => {
    onChange((current) => ({ ...current, [field]: value }))
  }

  const earningPreview = Math.round(
    Number(form.offeredSalaryPM || 0) * Number(form.salaryBasis || 1) * (Number(form.earningPercent || 0) / 100)
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close process form" />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Process Update Form</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {placement.studentId?.candidateName || 'Candidate Process'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update candidate process, interview, salary, earning, and payment details in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryBox label="Candidate" value={placement.studentId?.candidateName || '-'} detail={placement.studentId?.mobileNumber} />
            <SummaryBox label="Business Advisor" value={placement.baId?.name || '-'} detail={placement.baId?.email} />
            <SummaryBox label="Current Payment" value={form.earningStatus === 'paid' ? 'Paid' : 'Pending'} detail={formatMoney(earningPreview)} />
          </div>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Company & Job</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Matched Company
                <select
                  value={form.companyId}
                  onChange={(event) => update('companyId', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <FormInput label="Job Profile" value={form.jobProfile} onChange={(value) => update('jobProfile', value)} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Process Status</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Process Stage
                <select
                  value={form.processStage}
                  onChange={(event) => {
                    const nextStage = event.target.value
                    onChange((current) => ({
                      ...current,
                      processStage: nextStage,
                      selectionStatus: selectionStatusByProcessStage[nextStage] || current.selectionStatus
                    }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                >
                  {Object.entries(processStageLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Selection Status
                <select
                  value={form.selectionStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value
                    onChange((current) => ({
                      ...current,
                      selectionStatus: nextStatus,
                      processStage: processStageBySelectionStatus[nextStatus] || current.processStage
                    }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="joined">Joined</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Dates & Interview</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <FormInput label="Joining Date" type="date" value={form.joiningDate} onChange={(value) => update('joiningDate', value)} />
              <FormInput
                label="Appt. Letter Date"
                type="date"
                value={form.appointmentLetterDate}
                onChange={(value) => update('appointmentLetterDate', value)}
              />
              <FormInput label="Interview Date" type="date" value={form.interviewDate} onChange={(value) => update('interviewDate', value)} />
              <label className="block text-sm font-semibold text-slate-700">
                Interview Mode
                <select
                  value={form.interviewMode}
                  onChange={(event) => update('interviewMode', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Select mode</option>
                  {interviewModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Salary, Earning & Payment</h3>
            <div className="grid gap-4 md:grid-cols-5">
              <FormInput
                label="Offered Salary PM"
                type="number"
                min="0"
                value={form.offeredSalaryPM}
                onChange={(value) => update('offeredSalaryPM', value)}
              />
              <FormInput
                label="Salary Basis"
                type="number"
                min="1"
                max="12"
                value={form.salaryBasis}
                onChange={(value) => update('salaryBasis', value)}
              />
              <FormInput
                label="Earning %"
                type="number"
                min="0"
                max="100"
                value={form.earningPercent}
                onChange={(value) => update('earningPercent', value)}
              />
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-xs font-bold uppercase text-emerald-700">Earning Amount</p>
                <p className="mt-2 text-lg font-bold text-emerald-800">{formatMoney(earningPreview)}</p>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Payment Status
                <select
                  value={form.earningStatus}
                  onChange={(event) => {
                    const earningStatus = event.target.value
                    onChange((current) => ({
                      ...current,
                      earningStatus,
                      earningPaidDate: earningStatus === 'paid' ? current.earningPaidDate : ''
                    }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <FormInput
                label="Paid Date"
                type="date"
                value={form.earningPaidDate}
                disabled={form.earningStatus !== 'paid'}
                onChange={(value) => update('earningPaidDate', value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Notes</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormTextarea label="Process Notes" value={form.processNotes} onChange={(value) => update('processNotes', value)} />
              <FormTextarea label="Admin Notes" value={form.adminNotes} onChange={(value) => update('adminNotes', value)} />
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Save className="h-4 w-4" />
            Save Process
          </button>
        </div>
      </form>
    </div>
  )
}

function SummaryBox({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
      {detail ? <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p> : null}
    </div>
  )
}

function FormInput({ label, value, onChange, disabled = false, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        {...props}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100 ${
          disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white'
        }`}
      />
    </label>
  )
}

function FormTextarea({ label, value, onChange }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <textarea
        rows={4}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function PaymentBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {status === 'paid' ? 'Paid' : 'Pending'}
    </span>
  )
}
