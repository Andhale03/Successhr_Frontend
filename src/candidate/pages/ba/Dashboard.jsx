import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, BriefcaseBusiness, IndianRupee, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))

export default function Dashboard() {
  const token = useSelector((state) => state.auth.token)
  const [profile, setProfile] = useState(null)
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [profileRes, studentRes, companyRes, placementRes] = await Promise.all([
      api.get('/ba/profile'),
      api.get('/students'),
      api.get('/companies'),
      api.get('/placements/my')
    ])

    setProfile(profileRes.data)
    setStudents(studentRes.data)
    setCompanies(companyRes.data)
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
    socket.on('earning_paid', refresh)
    socket.on('commission_paid', refresh)

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      disconnectSocket()
    }
  }, [token])

  const stats = useMemo(() => {
    const totalStudentsSubmitted = students.length
    const totalCompaniesSubmitted = companies.length
    const studentsPlaced = placements.length
    const totalEarned = placements.reduce((sum, placement) => sum + Number(placement.earningAmount || placement.commissionAmount || 0), 0)
    return { totalStudentsSubmitted, totalCompaniesSubmitted, studentsPlaced, totalEarned }
  }, [students.length, companies.length, placements])

  if (loading) {
    return <Skeleton rows={8} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Hello, {profile?.fullName || 'Business Advisor'}</h1>
        <p className="mt-1 text-sm text-slate-500">Snapshot of your submissions, placements, and earnings.</p>
      </div>

      {!profile?.isProfileComplete && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Complete your profile</p>
              <p className="text-sm text-amber-800">Upload documents and bank details to finish onboarding.</p>
            </div>
          </div>
          <Link
            to="/ba/profile"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Go to Profile
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Candidates Submitted" value={stats.totalStudentsSubmitted} icon={Users} />
        <StatCard label="Total Companies Submitted" value={stats.totalCompaniesSubmitted} icon={Building2} />
        <StatCard label="Candidates Placed" value={stats.studentsPlaced} icon={BriefcaseBusiness} />
        <StatCard label="Total Earned" value={formatMoney(stats.totalEarned)} icon={IndianRupee} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent Candidates</h2>
          </div>
          <Table
            headers={['Name', 'Applied For', 'Status']}
            rows={[...students]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((student) => [
              <div key={student._id}>
                <p className="font-semibold text-slate-900">{student.candidateName}</p>
                <p className="text-xs text-slate-500">{format(new Date(student.createdAt), 'dd MMM yyyy')}</p>
              </div>,
              student.appliedFor || 'Not provided',
              <StatusBadge status={student.status} />
            ])}
            empty="No candidate submissions yet."
          />
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent Companies</h2>
          </div>
          <Table
            headers={['Company', 'Job Profile', 'Status']}
            rows={[...companies]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((company) => [
              <div key={company._id}>
                <p className="font-semibold text-slate-900">{company.companyName}</p>
                <p className="text-xs text-slate-500">{format(new Date(company.createdAt), 'dd MMM yyyy')}</p>
              </div>,
              company.jobRequirements?.jobProfile || 'Not provided',
              <StatusBadge status={company.status} />
            ])}
            empty="No company submissions yet."
          />
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Icon className="h-5 w-5 text-indigo-500" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function Table({ headers, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-5 py-10 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
