import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
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

export default function Candidates() {
  const token = useSelector((state) => state.auth.token)
  const [Candidates, setCandidates] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    earning: 'all'
  })

  const loadData = async () => {
    const [CandidateRes, placementRes] = await Promise.all([api.get('/candidates'), api.get('/placements/my')])
    setCandidates(CandidateRes.data)
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
    socket.on('candidate_updated', refresh)
    socket.on('candidate_deleted', refresh)

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('placement_deleted', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      socket.off('candidate_updated', refresh)
      socket.off('candidate_deleted', refresh)
      disconnectSocket()
    }
  }, [token])

  const placementBycandidateId = useMemo(
    () =>
      new Map(
        placements.map((placement) => [placement.candidate?._id || placement.candidateId?._id || placement.candidateId, placement])
      ),
    [placements]
  )

  const enriched = useMemo(
    () =>
      Candidates.map((Candidate) => {
        const placement = placementBycandidateId.get(Candidate._id)
        return {
          ...candidate,
          placement,
          effectiveStatus: placement?.selectionStatus || Candidate.status
        }
      }),
    [Candidates, placementBycandidateId]
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return enriched
      .filter((Candidate) => {
        if (!search) return true
        const placement = Candidate.placement || {}
        const text = [
          Candidate.candidateName,
          Candidate.mobileNumber,
          Candidate.aadhaarNo,
          Candidate.whatsappNo,
          Candidate.emailId,
          Candidate.appliedFor,
          Candidate.interestedDepartment,
          Candidate.preferredIndustry,
          Candidate.preferredJobLocation,
          Candidate.currentJobLocation,
          placement.companyName,
          placement.jobProfile
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(search)
      })
      .filter((Candidate) => (filters.status === 'all' ? true : Candidate.effectiveStatus === filters.status))
      .filter((Candidate) => {
        if (filters.earning === 'all') return true
        if (filters.earning === 'recorded') return Boolean(Candidate.placement)
        if (filters.earning === 'paid') return Candidate.placement?.earningStatus === 'paid'
        if (filters.earning === 'pending') return Candidate.placement?.earningStatus === 'pending'
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [enriched, filters])

  const stats = useMemo(() => {
    const totalSubmitted = Candidates.length
    const selectedJoined = placements.filter(
      (placement) => placement.selectionStatus === 'selected' || placement.selectionStatus === 'joined'
    ).length
    const totalEarned = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    const pending = placements
      .filter((placement) => placement.earningStatus === 'pending')
      .reduce((sum, placement) => sum + Number(placement.earningAmount || 0), 0)
    return { totalSubmitted, selectedJoined, totalEarned, pending }
  }, [Candidates.length, placements])

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Candidates</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {Candidates.length}
          </span>
        </div>
        <Link
          to="/ba/candidates/new"
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((Candidate) => (
                <tr
                  key={Candidate._id}
                  onClick={() => setSelected(Candidate)}
                  className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50/50"
                >
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{Candidate.candidateName}</p>
                    <p className="text-xs text-slate-500">{Candidate.mobileNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{Candidate.appliedFor || 'Not provided'}</td>
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
                  <td className="px-5 py-3 text-slate-700">
                    {Candidate.placement?.processStage ? processStageLabel[Candidate.placement.processStage] || Candidate.placement.processStage : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <EarningCell placement={Candidate.placement} />
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {Candidate.documents?.length ? (
                      <span className="font-semibold text-indigo-600">{Candidate.documents.length} files</span>
                    ) : (
                      <span className="text-slate-500">No files</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    No Candidates found for current filters.
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
        type="Candidate"
        onClose={() => setSelected(null)}
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


