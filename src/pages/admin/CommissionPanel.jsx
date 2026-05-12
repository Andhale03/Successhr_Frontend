import { Fragment, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Check, ChevronDown, ChevronUp, IndianRupee, Pencil, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import socket from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import Skeleton from '../../components/Skeleton'
import { ConfirmDialog } from '../../components/ActionDialogs'

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

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

export default function CommissionPanel() {
  const [searchParams] = useSearchParams()
  const [placements, setPlacements] = useState([])
  const [summaryRows, setSummaryRows] = useState([])
  const [bas, setBas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBa, setExpandedBa] = useState('')
  const [editingPlacementId, setEditingPlacementId] = useState('')
  const [editForm, setEditForm] = useState({
    jobProfile: '',
    offeredSalaryPM: '',
    joiningDate: '',
    selectionStatus: 'shortlisted',
    earningPercent: '',
    salaryBasis: 1,
    adminNotes: ''
  })
  const [filters, setFilters] = useState(() => ({
    ba: searchParams.get('ba') || 'all',
    earningStatus: searchParams.get('earningStatus') || 'all',
    selectionStatus: searchParams.get('selectionStatus') || 'all',
    processStage: searchParams.get('processStage') || 'all',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    search: searchParams.get('search') || ''
  }))
  const [detail, setDetail] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const loadData = async () => {
    const [summaryRes, placementRes, baRes] = await Promise.all([
      api.get('/placements/summary'),
      api.get('/placements'),
      api.get('/ba/all')
    ])

    setSummaryRows(summaryRes.data)
    setPlacements(placementRes.data)
    setBas(baRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      toast.error('Could not load earnings panel')
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
    const searchDigits = digitsOnly(search)

    return placements
      .filter((placement) => (filters.ba === 'all' ? true : placement.baId?._id === filters.ba))
      .filter((placement) => (filters.earningStatus === 'all' ? true : placement.earningStatus === filters.earningStatus))
      .filter((placement) => (filters.selectionStatus === 'all' ? true : placement.selectionStatus === filters.selectionStatus))
      .filter((placement) => (filters.processStage === 'all' ? true : placement.processStage === filters.processStage))
      .filter((placement) => {
        if (!search) return true

        const searchableText = [
          placement.studentId?.candidateName,
          placement.studentId?.appliedFor,
          placement.companyId?.companyName,
          placement.baId?.name,
          placement.baId?.email,
          placement.jobProfile,
          placement.selectionStatus,
          selectionStatusLabel[placement.selectionStatus],
          placement.processStage,
          processStageLabel[placement.processStage],
          placement.earningStatus
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (searchableText.includes(search)) return true

        if (searchDigits.length < 3) return false

        const searchableDigits = [
          placement.studentId?.mobileNumber,
          placement.offeredSalaryPM,
          placement.salaryBasis,
          placement.earningPercent,
          placement.earningAmount
        ]
          .map((value) => digitsOnly(value))
          .filter(Boolean)
          .join(' ')

        return searchableDigits.includes(searchDigits)
      })
      .filter((placement) => {
        if (!filters.from && !filters.to) return true
        const createdAt = new Date(placement.createdAt).getTime()
        if (filters.from && createdAt < new Date(filters.from).getTime()) return false
        if (filters.to) {
          const end = new Date(filters.to)
          end.setHours(23, 59, 59, 999)
          if (createdAt > end.getTime()) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [placements, filters])

  const topStats = useMemo(() => {
    const totalPlacements = filteredPlacements.length
    const totalEarnings = filteredPlacements.reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    const totalPaid = filteredPlacements
      .filter((placement) => placement.earningStatus === 'paid')
      .reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    const totalPending = totalEarnings - totalPaid

    return { totalPlacements, totalEarnings, totalPaid, totalPending }
  }, [filteredPlacements])

  const baWise = useMemo(() => {
    const useServerSummary =
      filters.ba === 'all' &&
      filters.earningStatus === 'all' &&
      filters.selectionStatus === 'all' &&
      filters.processStage === 'all' &&
      !filters.from &&
      !filters.to &&
      !filters.search.trim()

    if (useServerSummary && summaryRows.length) {
      return summaryRows.map((row) => ({
        baId: String(row.baId),
        baName: row.baName,
        totalPlacements: row.totalPlacements,
        totalEarnings: Number(row.totalEarnings || row.totalCommission || 0),
        paidAmount: Number(row.paidAmount || 0),
        pendingAmount: Number(row.pendingAmount || 0)
      }))
    }

    const grouped = new Map()

    filteredPlacements.forEach((placement) => {
      const baId = placement.baId?._id
      if (!baId) return

      if (!grouped.has(baId)) {
        grouped.set(baId, {
          baId,
          baName: placement.baId?.name || 'Business Advisor',
          totalPlacements: 0,
          totalEarnings: 0,
          paidAmount: 0,
          pendingAmount: 0
        })
      }

      const row = grouped.get(baId)
      row.totalPlacements += 1
      row.totalEarnings += Number(placement.earningAmount || 0)
      if (placement.earningStatus === 'paid') {
        row.paidAmount += Number(placement.earningAmount || 0)
      } else {
        row.pendingAmount += Number(placement.earningAmount || 0)
      }
    })

    return [...grouped.values()].sort((a, b) => b.totalEarnings - a.totalEarnings)
  }, [filteredPlacements, summaryRows, filters])

  const placementsByBa = useMemo(() => {
    return filteredPlacements.reduce((acc, placement) => {
      const baId = placement.baId?._id
      if (!baId) return acc
      if (!acc[baId]) acc[baId] = []
      acc[baId].push(placement)
      return acc
    }, {})
  }, [filteredPlacements])

  const startEdit = (placement) => {
    setEditingPlacementId(placement._id)
    setEditForm({
      jobProfile: placement.jobProfile || '',
      offeredSalaryPM: placement.offeredSalaryPM ?? '',
      joiningDate: placement.joiningDate ? format(new Date(placement.joiningDate), 'yyyy-MM-dd') : '',
      selectionStatus: placement.selectionStatus || 'shortlisted',
      earningPercent: placement.earningPercent ?? '',
      salaryBasis: placement.salaryBasis ?? 1,
      adminNotes: placement.adminNotes || ''
    })
  }

  const cancelEdit = () => {
    setEditingPlacementId('')
  }

  const requestSaveEdit = (placement) => {
    setConfirmAction({
      title: 'Save Placement Changes',
      message: `Save earning updates for ${placement.studentId?.candidateName || 'this candidate'}?`,
      confirmText: 'Save Changes',
      onConfirm: () => saveEdit(placement._id)
    })
  }

  const saveEdit = async (placementId) => {
    try {
      await api.put(`/placements/${placementId}`, {
        jobProfile: editForm.jobProfile,
        offeredSalaryPM: Number(editForm.offeredSalaryPM || 0),
        joiningDate: editForm.joiningDate || undefined,
        selectionStatus: editForm.selectionStatus,
        earningPercent: Number(editForm.earningPercent || 0),
        salaryBasis: Number(editForm.salaryBasis || 1),
        adminNotes: editForm.adminNotes
      })
      toast.success('Placement updated')
      setEditingPlacementId('')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update placement')
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

      toast.success(nextStatus === 'paid' ? 'Earning marked as paid' : 'Payment moved to pending')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update payment status')
    }
  }

  const openDetail = async (type, id) => {
    try {
      const endpoint = type === 'student' ? `/students/${id}` : `/companies/${id}`
      const { data } = await api.get(endpoint)
      setDetail({ type, item: data })
    } catch (_error) {
      toast.error('Could not load detail')
    }
  }

  if (loading) {
    return <Skeleton rows={12} />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Advisor Earnings Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage BA-wise earnings, placement edits, and payout status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Earnings Generated" value={formatMoney(topStats.totalEarnings)} />
        <StatCard label="Total Paid Out" value={formatMoney(topStats.totalPaid)} />
        <StatCard label="Total Pending" value={formatMoney(topStats.totalPending)} />
        <StatCard label="Total Candidates Placed" value={topStats.totalPlacements} />
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-6">
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
          value={filters.earningStatus}
          onChange={(event) => setFilters((current) => ({ ...current, earningStatus: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
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

        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search BA / candidate / company / salary / earning"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">BA Name</th>
                <th className="px-5 py-3">Placed</th>
                <th className="px-5 py-3">Total Earnings</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Pending</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baWise.map((row) => (
                <Fragment key={row.baId}>
                  <tr className="odd:bg-white even:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{row.baName}</td>
                    <td className="px-5 py-3 text-slate-700">{row.totalPlacements}</td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(row.totalEarnings)}</td>
                    <td className="px-5 py-3 text-emerald-700">{formatMoney(row.paidAmount)}</td>
                    <td className="px-5 py-3 text-amber-700">{formatMoney(row.pendingAmount)}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedBa((current) => (current === row.baId ? '' : row.baId))}
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {expandedBa === row.baId ? 'Hide' : 'View'}
                        {expandedBa === row.baId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>

                  {expandedBa === row.baId && (
                    <tr>
                      <td colSpan="6" className="bg-slate-50 px-5 py-4">
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                                <tr>
                                  <th className="px-3 py-2">Candidate</th>
                                  <th className="px-3 py-2">Company</th>
                                  <th className="px-3 py-2">Salary/PM</th>
                                  <th className="px-3 py-2">Basis</th>
                                  <th className="px-3 py-2">%</th>
                                  <th className="px-3 py-2">Earns</th>
                                  <th className="px-3 py-2">Status</th>
                                  <th className="px-3 py-2">Paid?</th>
                                  <th className="px-3 py-2">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(placementsByBa[row.baId] || []).map((placement) => {
                                  const isEditing = editingPlacementId === placement._id
                                  const preview = Math.round(
                                    Number(editForm.offeredSalaryPM || 0) *
                                      Number(editForm.salaryBasis || 1) *
                                      (Number(editForm.earningPercent || 0) / 100)
                                  )

                                  return (
                                    <tr key={placement._id} className="odd:bg-white even:bg-slate-50">
                                      <td className="px-3 py-2">
                                        <button
                                          type="button"
                                          onClick={() => openDetail('student', placement.studentId?._id)}
                                          className="font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                          {placement.studentId?.candidateName || 'Candidate'}
                                        </button>
                                      </td>
                                      <td className="px-3 py-2">
                                        <button
                                          type="button"
                                          onClick={() => openDetail('company', placement.companyId?._id)}
                                          className="font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                          {placement.companyId?.companyName || 'Company'}
                                        </button>
                                      </td>

                                      {isEditing ? (
                                        <>
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={editForm.offeredSalaryPM}
                                              onChange={(event) =>
                                                setEditForm((current) => ({ ...current, offeredSalaryPM: event.target.value }))
                                              }
                                              className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                          </td>
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={editForm.salaryBasis}
                                              onChange={(event) =>
                                                setEditForm((current) => ({ ...current, salaryBasis: event.target.value }))
                                              }
                                              className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                          </td>
                                          <td className="px-3 py-2">
                                            <input
                                              type="number"
                                              value={editForm.earningPercent}
                                              onChange={(event) =>
                                                setEditForm((current) => ({ ...current, earningPercent: event.target.value }))
                                              }
                                              className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                                            />
                                          </td>
                                          <td className="px-3 py-2 font-semibold text-emerald-700">{formatMoney(preview)}</td>
                                          <td className="px-3 py-2">
                                            <select
                                              value={editForm.selectionStatus}
                                              onChange={(event) =>
                                                setEditForm((current) => ({ ...current, selectionStatus: event.target.value }))
                                              }
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
                                            <PaymentBadge status={placement.earningStatus} />
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => requestSaveEdit(placement)}
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
                                          <td className="px-3 py-2 text-slate-700">{formatMoney(placement.offeredSalaryPM || 0)}</td>
                                          <td className="px-3 py-2 text-slate-700">{placement.salaryBasis || 1} mo</td>
                                          <td className="px-3 py-2 text-slate-700">{placement.earningPercent || 0}%</td>
                                          <td className="px-3 py-2 font-semibold text-emerald-700">
                                            {formatMoney(placement.earningAmount || 0)}
                                          </td>
                                          <td className="px-3 py-2">
                                            <SelectionBadge status={placement.selectionStatus} />
                                          </td>
                                          <td className="px-3 py-2">
                                            <PaymentBadge status={placement.earningStatus} />
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  requestPaymentStatusUpdate(
                                                    placement,
                                                    placement.earningStatus === 'paid' ? 'pending' : 'paid'
                                                  )
                                                }
                                                className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-white ${
                                                  placement.earningStatus === 'paid'
                                                    ? 'bg-amber-600'
                                                    : 'bg-emerald-600'
                                                }`}
                                              >
                                                <Check className="h-3.5 w-3.5" />
                                                {placement.earningStatus === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => startEdit(placement)}
                                                className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-700"
                                              >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                              </button>
                                            </div>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!baWise.length && (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No earning rows found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer open={Boolean(detail)} type={detail?.type} item={detail?.item} onClose={() => setDetail(null)} />
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <IndianRupee className="h-5 w-5 text-indigo-500" />
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-3 sm:text-2xl">{value}</p>
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
