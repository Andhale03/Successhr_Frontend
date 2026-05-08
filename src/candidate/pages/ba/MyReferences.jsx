import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import api from '../../api/axios'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

export default function MyReferences() {
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [studentRes, companyRes] = await Promise.all([api.get('/students'), api.get('/companies')])
      setStudents(studentRes.data)
      setCompanies(companyRes.data)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">My References</h1>
        <p className="mt-1 text-sm text-slate-500">Track submitted candidates and companies.</p>
      </div>

      <div className="inline-flex rounded-lg bg-slate-200 p-1">
        {[
          ['students', 'Candidates'],
          ['companies', 'Companies']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`min-h-9 rounded-md px-4 text-sm font-semibold ${activeTab === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'students' ? (
        <StudentTable students={students} onSelect={(item) => setSelected({ type: 'student', item })} />
      ) : (
        <CompanyTable companies={companies} onSelect={(item) => setSelected({ type: 'company', item })} />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        item={selected?.item}
        type={selected?.type}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function StudentTable({ students, onSelect }) {
  return (
    <Table
      headers={['Name', 'Mobile', 'Applied For', 'Submitted Date', 'Status']}
      empty="No candidate references submitted."
      rows={students.map((student) => ({
        id: student._id,
        onClick: () => onSelect(student),
        cells: [
          student.candidateName,
          student.mobileNumber,
          student.appliedFor || 'Not provided',
          format(new Date(student.createdAt), 'dd MMM yyyy'),
          <StatusBadge status={student.status} />
        ]
      }))}
    />
  )
}

function CompanyTable({ companies, onSelect }) {
  return (
    <Table
      headers={['Company Name', 'Contact Person', 'Job Profile', 'Submitted Date', 'Status']}
      empty="No company references submitted."
      rows={companies.map((company) => ({
        id: company._id,
        onClick: () => onSelect(company),
        cells: [
          company.companyName,
          company.contactPersonName || 'Not provided',
          company.jobRequirements?.jobProfile || 'Not provided',
          format(new Date(company.createdAt), 'dd MMM yyyy'),
          <StatusBadge status={company.status} />
        ]
      }))}
    />
  )
}

function Table({ headers, rows, empty }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
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
            {rows.map((row) => (
              <tr key={row.id} onClick={row.onClick} className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-sky-50">
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-5 py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-5 py-10 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
