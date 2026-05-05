import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Check, Pencil, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Skeleton from '../../components/Skeleton'
import socket from '../../socket'

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
  const [loading, setLoading] = useState(true)
  const [editingPlacementId, setEditingPlacementId] = useState('')
  const [advancingPlacementId, setAdvancingPlacementId] = useState('')
  const [editForm, setEditForm] = useState({
    offeredSalaryPM: '',
    salaryBasis: 1,
    earningPercent: '',
    processStage: 'appointment_letter_pending',
    selectionStatus: 'shortlisted',
    joiningDate: '',
    appointmentLetterDate: '',
    interviewDate: '',
    interviewMode: '',
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
    const [placementRes, baRes] = await Promise.all([api.get('/placements'), api.get('/ba/all')])
    setPlacements(placementRes.data)
    setBas(baRes.data)
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

    return () => {
      socket.off('placement_created', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_paid', refresh)
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
        return student.includes(search) || company.includes(search) || ba.includes(search)
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

  const startEdit = (placement) => {
    setEditingPlacementId(placement._id)
    setEditForm({
      offeredSalaryPM: placement.offeredSalaryPM ?? '',
      salaryBasis: placement.salaryBasis ?? 1,
      earningPercent: placement.earningPercent ?? '',
      processStage: placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending',
      selectionStatus: placement.selectionStatus || 'shortlisted',
      joiningDate: placement.joiningDate ? format(new Date(placement.joiningDate), 'yyyy-MM-dd') : '',
      appointmentLetterDate: placement.appointmentLetterDate ? format(new Date(placement.appointmentLetterDate), 'yyyy-MM-dd') : '',
      interviewDate: placement.interviewDate ? format(new Date(placement.interviewDate), 'yyyy-MM-dd') : '',
      interviewMode: placement.interviewMode || '',
      processNotes: placement.processNotes || '',
      adminNotes: placement.adminNotes || ''
    })
  }

  const cancelEdit = () => {
    setEditingPlacementId('')
  }

  const saveEdit = async (placementId) => {
    try {
      await api.put(`/placements/${placementId}`, {
        offeredSalaryPM: Number(editForm.offeredSalaryPM || 0),
        salaryBasis: Number(editForm.salaryBasis || 1),
        earningPercent: Number(editForm.earningPercent || 0),
        processStage: editForm.processStage,
        selectionStatus: editForm.selectionStatus,
        joiningDate: editForm.joiningDate || undefined,
        appointmentLetterDate: editForm.appointmentLetterDate || undefined,
        interviewDate: editForm.interviewDate || undefined,
        interviewMode: editForm.interviewMode || undefined,
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

  const advanceToNextStage = async (placement) => {
    const currentStage =
      placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending'
    const nextStage = getNextProcessStage(currentStage)

    if (!nextStage) {
      toast('This placement is already at the final stage')
      return
    }

    setAdvancingPlacementId(placement._id)
    try {
      await api.put(`/placements/${placement._id}`, {
        processStage: nextStage,
        selectionStatus: selectionStatusByProcessStage[nextStage] || placement.selectionStatus
      })
      toast.success(`Moved to ${processStageLabel[nextStage]}`)
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move to next process stage')
    } finally {
      setAdvancingPlacementId('')
    }
  }

  const markPaid = async (placement) => {
    const studentName = placement.studentId?.candidateName || 'this student'
    const amount = formatMoney(placement.earningAmount || 0)
    const confirmed = window.confirm(
      `Are you sure you want to mark advisor payment as paid for ${studentName} (${amount})?\n\nPress OK for Yes or Cancel for No.`
    )

    if (!confirmed) return

    try {
      await api.patch(`/placements/${placement._id}/pay`, {
        earningStatus: 'paid',
        earningPaidDate: new Date().toISOString()
      })
      toast.success('Marked as paid')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not mark as paid')
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
          placeholder="Search student/company/BA"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">BA</th>
                <th className="px-3 py-3">Process Stage</th>
                <th className="px-3 py-3">Selection</th>
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
                const isEditing = editingPlacementId === placement._id
                const currentProcessStage =
                  placement.processStage || processStageBySelectionStatus[placement.selectionStatus] || 'appointment_letter_pending'
                const nextProcessStage = getNextProcessStage(currentProcessStage)
                const preview = Math.round(
                  Number(editForm.offeredSalaryPM || 0) * Number(editForm.salaryBasis || 1) * (Number(editForm.earningPercent || 0) / 100)
                )

                return (
                  <tr key={placement._id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{placement.studentId?.candidateName || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{placement.companyId?.companyName || '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{placement.baId?.name || '-'}</td>

                    {isEditing ? (
                      <>
                        <td className="px-3 py-2">
                          <select
                            value={editForm.processStage}
                            onChange={(event) => {
                              const nextStage = event.target.value
                              setEditForm((current) => ({
                                ...current,
                                processStage: nextStage,
                                selectionStatus: selectionStatusByProcessStage[nextStage] || current.selectionStatus
                              }))
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            {Object.entries(processStageLabel).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={editForm.selectionStatus}
                            onChange={(event) => {
                              const nextStatus = event.target.value
                              setEditForm((current) => ({
                                ...current,
                                selectionStatus: nextStatus,
                                processStage: processStageBySelectionStatus[nextStatus] || current.processStage
                              }))
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="shortlisted">Shortlisted</option>
                            <option value="selected">Selected</option>
                            <option value="joined">Joined</option>
                            <option value="rejected">Rejected</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={editForm.offeredSalaryPM}
                            onChange={(event) => setEditForm((current) => ({ ...current, offeredSalaryPM: event.target.value }))}
                            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={editForm.salaryBasis}
                            onChange={(event) => setEditForm((current) => ({ ...current, salaryBasis: event.target.value }))}
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={editForm.earningPercent}
                            onChange={(event) => setEditForm((current) => ({ ...current, earningPercent: event.target.value }))}
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold text-emerald-700">{formatMoney(preview)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={editForm.joiningDate}
                            onChange={(event) => setEditForm((current) => ({ ...current, joiningDate: event.target.value }))}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={editForm.appointmentLetterDate}
                            onChange={(event) => setEditForm((current) => ({ ...current, appointmentLetterDate: event.target.value }))}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={editForm.interviewDate}
                              onChange={(event) => setEditForm((current) => ({ ...current, interviewDate: event.target.value }))}
                              className="rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                            <select
                              value={editForm.interviewMode}
                              onChange={(event) => setEditForm((current) => ({ ...current, interviewMode: event.target.value }))}
                              className="rounded border border-slate-300 px-2 py-1 text-sm"
                            >
                              <option value="">Select mode</option>
                              {interviewModes.map((mode) => (
                                <option key={mode} value={mode}>
                                  {mode}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editForm.processNotes}
                            onChange={(event) => setEditForm((current) => ({ ...current, processNotes: event.target.value }))}
                            placeholder="Add process note"
                            className="w-44 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <PaymentBadge status={placement.earningStatus} />
                        </td>
                        <td className="sticky right-0 bg-white px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(placement._id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-700">{processStageLabel[currentProcessStage] || '-'}</td>
                        <td className="px-3 py-2">
                          <SelectionBadge status={placement.selectionStatus} />
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
                        <td className="px-3 py-2 text-slate-700">{placement.processNotes || '-'}</td>
                        <td className="px-3 py-2">
                          <PaymentBadge status={placement.earningStatus} />
                        </td>
                        <td className="sticky right-0 bg-white px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {nextProcessStage && (
                              <button
                                type="button"
                                onClick={() => advanceToNextStage(placement)}
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
                            {placement.earningStatus !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => markPaid(placement)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
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
    </div>
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

function SelectionBadge({ status }) {
  const color =
    status === 'joined'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'selected'
        ? 'bg-blue-100 text-blue-700'
        : status === 'rejected'
          ? 'bg-rose-100 text-rose-700'
          : status === 'on_hold'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-700'

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{selectionStatusLabel[status] || status}</span>
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
