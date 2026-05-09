import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api from '../../../api/axios'
import Skeleton from '../../../components/Skeleton'
import { ConfirmDialog } from '../../../components/ActionDialogs'

export default function CompaniesList() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get('/cms/companies', {
        params: search.trim() ? { search: search.trim() } : undefined
      })
      setCompanies(data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return companies

    return companies.filter((company) => {
      const fields = [
        company.companyName,
        company.companyAddress,
        company.contactPersonName,
        company.contactPersonDesignation,
        company.mobileNo,
        company.emailId,
        company.jobRequirements?.jobProfile,
        company.jobRequirements?.jobLocation
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [companies, search])

  const handleDelete = async () => {
    if (!deleting?._id) return
    try {
      await api.delete(`/cms/companies/${deleting._id}`)
      setCompanies((current) => current.filter((item) => item._id !== deleting._id))
      toast.success('Company deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete company')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">Candidate Management System</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/cms/companies/new')}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by company, contact, mobile, email, profile, location"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Contact Person</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Job Profile</th>
                <th className="px-5 py-3">Vacancy</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((company) => (
                <tr key={company._id} className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40">
                  <td className="px-5 py-3 font-semibold text-slate-900">{company.companyName}</td>
                  <td className="px-5 py-3 text-slate-700">{company.contactPersonName || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{company.mobileNo || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{company.jobRequirements?.jobProfile || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{company.jobRequirements?.numberOfVacancy ?? '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/companies/${company._id}/edit`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                        aria-label="Edit company"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(company)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="Delete company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Company"
        message={`Delete ${deleting?.companyName || 'this company'}?`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
