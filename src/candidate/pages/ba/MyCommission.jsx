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

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

export default function MyCommission() {
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
      toast.error('Could not load commission records')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('ba_commission_last_visited', new Date().toISOString())
    window.dispatchEvent(new Event('ba-commission-visited'))
  }, [placements.length])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const handlePlacement = async (payload) => {
      toast.success(`New placement recorded for ${payload.studentName || 'your candidate'}!`)
      await loadPlacements()
    }

    const handlePlacementUpdated = async (payload) => {
      toast.success(`Placement updated for ${payload.studentName || 'your candidate'}`)
      await loadPlacements()
    }

    const handlePaid = async (payload) => {
      toast.success(
        `Commission of ${formatMoney(payload.commissionAmount)} for ${payload.studentName || 'candidate'} has been marked as paid!`
      )
      await loadPlacements()
    }

    socket.on('my_placement', handlePlacement)
    socket.on('placement_updated', handlePlacementUpdated)
    socket.on('placement_deleted', handlePlacementUpdated)
    socket.on('commission_paid', handlePaid)

    return () => {
      socket.off('my_placement', handlePlacement)
      socket.off('placement_updated', handlePlacementUpdated)
      socket.off('placement_deleted', handlePlacementUpdated)
      socket.off('commission_paid', handlePaid)
      disconnectSocket()
    }
  }, [token])

  const summary = useMemo(() => {
    const totalStudentsPlaced = placements.length
    const totalCommissionEarned = placements.reduce((sum, placement) => sum + Number(placement.commissionAmount || 0), 0)
    const paidToMe = placements
      .filter((placement) => placement.commissionStatus === 'paid')
      .reduce((sum, placement) => sum + Number(placement.commissionAmount || 0), 0)
    const pendingPayment = totalCommissionEarned - paidToMe

    return { totalStudentsPlaced, totalCommissionEarned, paidToMe, pendingPayment }
  }, [placements])

  if (loading) {
    return <Skeleton rows={10} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Commission</h1>
        <p className="mt-1 text-sm text-slate-500">Live view of placed candidates and your commission payouts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Candidates Placed" value={summary.totalStudentsPlaced} />
        <SummaryCard label="Total Commission Earned" value={formatMoney(summary.totalCommissionEarned)} />
        <SummaryCard label="Paid To Me" value={formatMoney(summary.paidToMe)} />
        <SummaryCard label="Pending Payment" value={formatMoney(summary.pendingPayment)} />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Candidate Name</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Job Profile</th>
                <th className="px-5 py-3">Offered Salary</th>
                <th className="px-5 py-3">My Commission</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {placements.map((placement) => (
                <tr
                  key={placement._id}
                  onClick={() => setActivePlacement(placement)}
                  className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">{placement.student?.candidateName || 'Candidate'}</td>
                  <td className="px-5 py-3 text-slate-700">{placement.company?.companyName || 'Company'}</td>
                  <td className="px-5 py-3 text-slate-700">{placement.jobProfile || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-700">{placement.offeredSalary || 'Not provided'}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">{formatMoney(placement.commissionAmount)}</td>
                  <td className="px-5 py-3">
                    <SelectionBadge status={placement.selectionStatus} />
                  </td>
                  <td className="px-5 py-3">
                    <PaymentBadge status={placement.commissionStatus} />
                  </td>
                </tr>
              ))}
              {placements.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    No placements recorded yet. Once your referred candidates are placed, your commission details will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activePlacement && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/45" onClick={() => setActivePlacement(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{activePlacement.student?.candidateName || 'Placement'}</h2>
                <p className="text-sm text-slate-500">{activePlacement.company?.companyName || 'Company'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePlacement(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
              <Info label="Job Profile" value={activePlacement.jobProfile} />
              <Info label="Offered Salary" value={activePlacement.offeredSalary} />
              <Info
                label="Joining Date"
                value={
                  activePlacement.joiningDate ? format(new Date(activePlacement.joiningDate), 'dd MMM yyyy') : 'Not set'
                }
                icon={Calendar}
              />
              <Info label="Selection Status" value={selectionStatusLabel[activePlacement.selectionStatus]} />
              <Info label="Commission %" value={`${activePlacement.commissionPercent || 0}%`} icon={IndianRupee} />
              <Info label="Commission Amount" value={formatMoney(activePlacement.commissionAmount)} />
              <Info label="Payment Status" value={activePlacement.commissionStatus === 'paid' ? 'Paid' : 'Pending'} />
              <Info
                label="Paid Date"
                value={
                  activePlacement.commissionPaidDate
                    ? format(new Date(activePlacement.commissionPaidDate), 'dd MMM yyyy')
                    : 'Not paid yet'
                }
              />
            </div>
          </div>
        </div>
      )}
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
