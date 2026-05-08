import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Calendar, IndianRupee, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import Skeleton from '../../components/Skeleton'

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

export default function Earnings() {
  const token = useSelector((state) => state.auth.token)
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePlacement, setActivePlacement] = useState(null)

  const loadPlacements = async () => {
    const { data } = await api.get('/placements/my')
    setPlacements(data)
    setLoading(false)
  }

  useEffect(() => {
    loadPlacements().catch(() => {
      toast.error('Could not load earning records')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('ba_earnings_last_visited', new Date().toISOString())
    window.dispatchEvent(new Event('ba-earnings-visited'))
  }, [placements.length])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const handlePlacement = async (payload) => {
      toast.success(`New earning - ${formatMoney(payload.earningAmount || payload.commissionAmount)} for ${payload.studentName || 'candidate'}!`)
      await loadPlacements()
    }

    const handlePlacementUpdated = async () => {
      await loadPlacements()
    }

    const handlePaid = async (payload) => {
      toast.success(
        `${formatMoney(payload.earningAmount || payload.commissionAmount)} for ${payload.studentName || 'candidate'} has been paid!`
      )
      await loadPlacements()
    }

    socket.on('my_placement', handlePlacement)
    socket.on('placement_updated', handlePlacementUpdated)
    socket.on('placement_deleted', handlePlacementUpdated)
    socket.on('earning_paid', handlePaid)
    socket.on('commission_paid', handlePaid)

    return () => {
      socket.off('my_placement', handlePlacement)
      socket.off('placement_updated', handlePlacementUpdated)
      socket.off('placement_deleted', handlePlacementUpdated)
      socket.off('earning_paid', handlePaid)
      socket.off('commission_paid', handlePaid)
      disconnectSocket()
    }
  }, [token])

  const summary = useMemo(() => {
    const studentsPlaced = placements.length
    const totalIEarn = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || placement.commissionAmount || 0), 0)
    const received = placements
      .filter((placement) => (placement.earningStatus || placement.commissionStatus) === 'paid')
      .reduce((sum, placement) => sum + Number(placement.earningAmount || placement.commissionAmount || 0), 0)
    const pending = totalIEarn - received

    return { studentsPlaced, totalIEarn, received, pending }
  }, [placements])

  if (loading) {
    return <Skeleton rows={10} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">Once candidates are placed, your earnings and payouts appear here live.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Candidates Placed" value={summary.studentsPlaced} />
        <SummaryCard label="Total I Earn" value={formatMoney(summary.totalIEarn)} />
        <SummaryCard label="Received" value={formatMoney(summary.received)} />
        <SummaryCard label="Pending Payment" value={formatMoney(summary.pending)} />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Offered Salary</th>
                <th className="px-5 py-3">My %</th>
                <th className="px-5 py-3">I Earn</th>
                <th className="px-5 py-3">Selection Status</th>
                <th className="px-5 py-3">Next Process</th>
                <th className="px-5 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {placements.map((placement) => {
                const earning = placement.earningAmount || placement.commissionAmount || 0
                const paymentStatus = placement.earningStatus || placement.commissionStatus
                const paidDate = placement.earningPaidDate || placement.commissionPaidDate

                return (
                  <tr
                    key={placement._id}
                    onClick={() => setActivePlacement(placement)}
                    className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {placement.studentName || placement.student?.candidateName || 'Candidate'}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {placement.companyName || placement.company?.companyName || 'Company'}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(placement.offeredSalaryPM || 0)} PM</td>
                    <td className="px-5 py-3 text-slate-700">{placement.earningPercent || placement.commissionPercent || 0}%</td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">{formatMoney(earning)}</td>
                    <td className="px-5 py-3">
                      <SelectionBadge status={placement.selectionStatus} />
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {processStageLabel[placement.processStage] || placement.processStage || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <PaymentBadge status={paymentStatus} paidDate={paidDate} />
                    </td>
                  </tr>
                )
              })}
              {placements.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No earnings yet. Once your referred candidates are placed by the admin, your earnings will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activePlacement && (
        <EarningDetailModal placement={activePlacement} onClose={() => setActivePlacement(null)} />
      )}
    </div>
  )
}

function EarningDetailModal({ placement, onClose }) {
  const offered = Number(placement.offeredSalaryPM || 0)
  const percent = Number(placement.earningPercent || placement.commissionPercent || 0)
  const amount = Number(placement.earningAmount || placement.commissionAmount || 0)
  const paidDate = placement.earningPaidDate || placement.commissionPaidDate
  const paymentStatus = placement.earningStatus || placement.commissionStatus

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {placement.studentName || placement.student?.candidateName || 'Placement'}
            </h2>
            <p className="text-sm text-slate-500">{placement.companyName || placement.company?.companyName || 'Company'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
          <Info label="Job Profile" value={placement.jobProfile} />
          <Info label="Offered Salary PM" value={`${formatMoney(offered)} PM`} />
          <Info
            label="Joining Date"
            value={placement.joiningDate ? format(new Date(placement.joiningDate), 'dd MMM yyyy') : 'Not set'}
            icon={Calendar}
          />
          <Info label="Selection Status" value={selectionStatusLabel[placement.selectionStatus]} />
          <Info label="Next Process" value={processStageLabel[placement.processStage] || placement.processStage} />
          <Info
            label="Appointment Letter Date"
            value={placement.appointmentLetterDate ? format(new Date(placement.appointmentLetterDate), 'dd MMM yyyy') : 'Not set'}
          />
          <Info label="Interview Mode" value={placement.interviewMode} />
          <Info
            label="Interview Date"
            value={placement.interviewDate ? format(new Date(placement.interviewDate), 'dd MMM yyyy') : 'Not set'}
          />
          <Info label="Earning %" value={`${percent}%`} icon={IndianRupee} />
          <Info label="I Earn" value={formatMoney(amount)} />
          <Info label="Formula" value={`${percent}% of ${formatMoney(offered)} = ${formatMoney(amount)}`} />
          <Info
            label="Payment"
            value={paymentStatus === 'paid' ? `Paid${paidDate ? ` on ${format(new Date(paidDate), 'dd MMM yyyy')}` : ''}` : 'Pending'}
          />
          <Info label="Process Notes" value={placement.processNotes} />
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
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

function PaymentBadge({ status, paidDate }) {
  return (
    <div>
      <span
        className={`rounded-full px-2 py-1 text-xs font-semibold ${
          status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {status === 'paid' ? 'Paid' : 'Pending'}
      </span>
      {status === 'paid' && paidDate ? (
        <p className="mt-1 text-xs text-emerald-700">{format(new Date(paidDate), 'dd MMM yyyy')}</p>
      ) : null}
    </div>
  )
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">
        {Icon ? <Icon className="mr-1.5 inline h-4 w-4 text-slate-400" /> : null}
        {value || 'Not provided'}
      </p>
    </div>
  )
}
