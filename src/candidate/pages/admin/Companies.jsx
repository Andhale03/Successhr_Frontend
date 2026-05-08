import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import socket from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { ConfirmDialog, PromptDialog } from '../../components/ActionDialogs'

const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

const buildCompanySearchText = (company) => {
  const job = company.jobRequirements || {}
  const about = company.aboutCompany || {}

  return [
    company.companyName,
    company.companyAddress,
    company.contactPersonName,
    company.contactPersonDesignation,
    company.mobileNo,
    company.emailId,
    company.status,
    company.adminNotes,
    company.submittedBy?.name,
    company.submittedBy?.email,
    job.jobProfile,
    job.education,
    job.experience,
    ...(job.requiredKeySkills || []),
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
    ...(job.facilities || []),
    about.manpower,
    about.turnover,
    about.plant,
    about.interviewMode,
    about.availabilityForInterview?.date,
    about.availabilityForInterview?.time,
    ...(about.weeklyOff || []),
    company.createdAt ? format(new Date(company.createdAt), 'dd MMM yyyy') : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const buildCompanySearchDigits = (company) => {
  const job = company.jobRequirements || {}
  const about = company.aboutCompany || {}

  return [
    company.mobileNo,
    job.numberOfVacancy,
    job.salaryRange,
    job.experience,
    about.manpower,
    about.turnover,
    about.availabilityForInterview?.date,
    about.availabilityForInterview?.time,
    company.createdAt
  ]
    .map((value) => digitsOnly(value))
    .filter(Boolean)
    .join(' ')
}

export default function Companies() {
  const [searchParams] = useSearchParams()
  const [companies, setCompanies] = useState([])
  const [bas, setBas] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingFull, setSavingFull] = useState(false)
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    ba: searchParams.get('ba') || 'all'
  }))

  const [selected, setSelected] = useState(null)

  // NEW STATE
  const [drawerMode, setDrawerMode] = useState('view')
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)

const [deletePrompt, setDeletePrompt] = useState({
  open: false,
  company: null
})

  useEffect(() => {
    const load = async () => {
      const [companyRes, baRes] = await Promise.all([
        api.get('/companies'),
        api.get('/ba/all')
      ])

      setCompanies(companyRes.data)
      setBas(baRes.data)
      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    const refresh = async () => {
      try {
        const [companyRes, baRes] = await Promise.all([
          api.get('/companies'),
          api.get('/ba/all')
        ])

        setCompanies(companyRes.data)
        setBas(baRes.data)
      } catch (_error) {
        // no-op
      }
    }

    socket.on('new_company', refresh)
    socket.on('company_updated', refresh)
    socket.on('company_deleted', refresh)
    socket.on('placement_deleted', refresh)

    return () => {
      socket.off('new_company', refresh)
      socket.off('company_updated', refresh)
      socket.off('company_deleted', refresh)
      socket.off('placement_deleted', refresh)
    }
  }, [])

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()

    return companies
      .filter((company) =>
        search
          ? company.companyName?.toLowerCase().includes(search)
          : true
      )
      .filter((company) =>
        filters.status === 'all'
          ? true
          : company.status === filters.status
      )
      .filter((company) =>
        filters.ba === 'all'
          ? true
          : company.submittedBy?._id === filters.ba
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [companies, filters])

  const deleteCompany = async (company) => {
    try {
      await api.delete(`/companies/${company._id}`)

      setCompanies((current) =>
        current.filter((item) => item._id !== company._id)
      )

      toast.success('Company deleted')
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not delete company'
      )
    }
  }

  const buildCompanyPayload = (company) => ({
    companyName: company.companyName,
    companyAddress: company.companyAddress,
    contactPersonName: company.contactPersonName,
    contactPersonDesignation: company.contactPersonDesignation,
    mobileNo: company.mobileNo,
    emailId: company.emailId,
    jobRequirements: company.jobRequirements || {},
    aboutCompany: company.aboutCompany || {},
    status: company.status,
    adminNotes: company.adminNotes
  })

  const saveSelected = async () => {
    if (!selected) return

    setSavingFull(true)

    try {
      const { data } = await api.put(
        `/companies/${selected._id}`,
        buildCompanyPayload(selected)
      )

      setCompanies((current) =>
        current.map((item) =>
          item._id === data._id ? data : item
        )
      )

      setSelected(data)

      toast.success('Company updated')
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not update company'
      )
    } finally {
      setSavingFull(false)
    }
  }

  const requestSaveSelected = () => {
    if (!selected) return
    setSaveConfirmOpen(true)
  }

  if (loading) return <Skeleton rows={9} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Companies
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search, filter, view, edit, and delete company references.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <input
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              search: event.target.value
            }))
          }
          placeholder="Search by company name"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value
            }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="all">All Statuses</option>
          <option value="not_viewed">Not Viewed</option>
          <option value="in_review">In Review</option>
          <option value="priority">Priority</option>
          <option value="done">Done</option>
        </select>

        <select
          value={filters.ba}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              ba: event.target.value
            }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="all">All BAs</option>

          {bas.map((ba) => (
            <option
              key={ba.userId?._id || ba._id}
              value={ba.userId?._id}
            >
              {ba.userId?.name || ba.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Company Name</th>
                <th className="px-5 py-3">Contact Person</th>
                <th className="px-5 py-3">Job Profile</th>
                <th className="px-5 py-3">Vacancies</th>
                <th className="px-5 py-3">Submitted By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((company) => (
                <tr
                  key={company._id}
                  className="odd:bg-white even:bg-slate-50 hover:bg-sky-50/40"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {company.companyName}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {company.contactPersonName || 'Not provided'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {company.jobRequirements?.jobProfile ||
                      'Not provided'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {company.jobRequirements?.numberOfVacancy ||
                      'Not provided'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {company.submittedBy?.name || 'BA'}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {format(
                      new Date(company.createdAt),
                      'dd MMM yyyy'
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={company.status} />
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-2">

                      {/* VIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode('view')
                          setSelected(company)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50"
                        aria-label="View company"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* EDIT BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerMode('edit')
                          setSelected(company)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                        aria-label="Edit company"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                       onClick={() =>
  setDeletePrompt({
    open: true,
    company
  })
}
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
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No matching company references.
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
        type="company"
        mode={drawerMode}
        onClose={() => setSelected(null)}
        adminControls
        fullEdit={drawerMode === 'edit'}
        onItemChange={setSelected}
        onStatusChange={(status) =>
          setSelected((current) => ({
            ...current,
            status
          }))
        }
        onNotesChange={(adminNotes) =>
          setSelected((current) => ({
            ...current,
            adminNotes
          }))
        }
        onSaveFull={saveSelected}
        savingFull={savingFull}
      />
      <ConfirmDialog
        open={saveConfirmOpen}
        title="Save Company Changes"
        message={`Save updates for ${selected?.companyName || 'this company'}?`}
        confirmText="Save Changes"
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={async () => {
          setSaveConfirmOpen(false)
          await saveSelected()
        }}
      />
      <PromptDialog
        open={deletePrompt.open}
        title="Delete Company"
        message={`Type DELETE to confirm deleting ${deletePrompt.company?.companyName || 'this company'}. Linked process-panel data will also be removed.`}
        placeholder="Type DELETE"
        confirmText="Delete"
        inputType="text"
        onCancel={() => setDeletePrompt({ open: false, company: null })}
        onConfirm={async (value) => {
          if (String(value || '').trim().toUpperCase() !== 'DELETE') {
            toast.error('Please type DELETE to confirm')
            return
          }
          const company = deletePrompt.company
          setDeletePrompt({ open: false, company: null })
          if (company) {
            await deleteCompany(company)
          }
        }}
      />
    </div>
  )
}