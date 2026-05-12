import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../api/axios'

const initial = {
  fullName: '',
  mobileNumber: '',
  aadhaarNo: '',
  whatsappNo: '',
  emailId: '',
  appliedFor: '',
  interestedDepartment: '',
  preferredIndustry: '',
  preferredJobLocation: '',
  dateOfBirth: '',
  gender: '',
  currentAddress: '',
  permanentAddress: '',
  education: '',
  specialization: '',
  totalExperience: '',
  currentCompany: '',
  currentDesignation: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  keySkills: '',
  preferredLocation: '',
  marriageStatus: '',
  languagesKnown: ''
}

const panelTitles = ['Candidate Basic Information', 'Success Remarks & Status', 'Interview History', 'Interviewer Updates']

export default function CandidateForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(initial)
  const [successForm, setSuccessForm] = useState({
    currentStatus: '',
    processStage: '',
    profilePriority: '',
    followUpDate: '',
    remarks: '',
    riskFlag: false,
    readyForInterview: false
  })
  const [interviewHistoryForm, setInterviewHistoryForm] = useState({
    companyName: '',
    interviewRound: '',
    interviewDate: '',
    result: '',
    interviewerName: '',
    feedback: ''
  })
  const [interviewerUpdateForm, setInterviewerUpdateForm] = useState({
    updatedBy: '',
    designation: '',
    updateMode: '',
    updateDate: '',
    nextAction: '',
    internalNotes: ''
  })
  const [activePanel, setActivePanel] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return

    const load = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        const c = data.candidate
        setForm({
          fullName: c.fullName || '',
          mobileNumber: c.mobileNumber || '',
          aadhaarNo: c.aadhaarNo || '',
          whatsappNo: c.whatsappNo || '',
          emailId: c.emailId || '',
          appliedFor: c.appliedFor || '',
          interestedDepartment: c.interestedDepartment || '',
          preferredIndustry: c.preferredIndustry || '',
          preferredJobLocation: c.preferredJobLocation || '',
          dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : '',
          gender: c.gender || '',
          currentAddress: c.currentAddress || '',
          permanentAddress: c.permanentAddress || '',
          education: c.education || '',
          specialization: c.specialization || '',
          totalExperience: c.totalExperience ?? '',
          currentCompany: c.currentCompany || '',
          currentDesignation: c.currentDesignation || '',
          currentSalary: c.currentSalary || '',
          expectedSalary: c.expectedSalary || '',
          noticePeriod: c.noticePeriod || '',
          keySkills: (c.keySkills || []).join(', '),
          preferredLocation: c.preferredLocation || '',
          marriageStatus: c.marriageStatus || '',
          languagesKnown: (c.languagesKnown || []).join(', ')
        })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load candidate')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isEdit])

  const payload = useMemo(
    () => ({
      ...form,
      totalExperience: form.totalExperience === '' ? undefined : Number(form.totalExperience),
      keySkills: form.keySkills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      languagesKnown: form.languagesKnown
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }),
    [form]
  )

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.fullName || !form.mobileNumber) {
      toast.error('Full name and mobile number are required')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/cms/candidates/${id}`, payload)
        toast.success('Candidate updated')
      } else {
        await api.post('/cms/candidates', payload)
        toast.success('Candidate created')
      }

      navigate('/candidate/admin/cms/candidates')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save candidate')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading candidate...</p>
  }

  if (!isEdit) {
    return (
      <form onSubmit={submit} className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button type="button" onClick={() => navigate('/candidate/admin/cms/candidates')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
              {'<- Candidates'}
            </button>
            <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">Add Candidate</h1>
          </div>
        </div>

        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <h2 className="text-lg font-bold text-slate-950">Candidate Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Each panel has a different form layout.</p>

          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-lg bg-slate-100 p-1">
              {panelTitles.map((title, index) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setActivePanel(index)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                    activePanel === index ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {activePanel === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Candidate Basic Information</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {[
                  ['fullName', 'Candidate Name *'],
                  ['mobileNumber', 'Mobile Number *'],
                  ['aadhaarNo', 'Aadhaar Number'],
                  ['whatsappNo', 'WhatsApp No'],
                  ['emailId', 'Email Id'],
                  ['appliedFor', 'Applied For'],
                  ['interestedDepartment', 'Interested Department'],
                  ['preferredIndustry', 'Preferred Industry'],
                  ['preferredJobLocation', 'Preferred Job Location']
                ].map(([key, label]) => (
                  <label key={key} className="text-sm font-semibold text-slate-700">
                    {label}
                    <input
                      value={form[key]}
                      onChange={(event) => update(key, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                ))}
              </div>
              </div>
            ) : null}

            {activePanel === 1 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Success Remarks & Status</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Current Status
                  <select
                    value={successForm.currentStatus}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, currentStatus: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="not_viewed">Not Viewed</option>
                    <option value="in_review">In Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Process Stage
                  <select
                    value={successForm.processStage}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, processStage: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="screening">Screening</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="joining">Joining</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Profile Priority
                  <select
                    value={successForm.profilePriority}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, profilePriority: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Follow-up Date
                  <input
                    type="date"
                    value={successForm.followUpDate}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, followUpDate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                  Success Remarks
                  <textarea
                    rows={3}
                    value={successForm.remarks}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, remarks: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={successForm.riskFlag}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, riskFlag: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Risk Flag
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={successForm.readyForInterview}
                    onChange={(event) => setSuccessForm((current) => ({ ...current, readyForInterview: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Ready For Interview
                </label>
              </div>
              </div>
            ) : null}

            {activePanel === 2 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Interview History</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Company Name
                  <input
                    value={interviewHistoryForm.companyName}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, companyName: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Interview Round
                  <select
                    value={interviewHistoryForm.interviewRound}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, interviewRound: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="telephonic">Telephonic</option>
                    <option value="hr">HR Round</option>
                    <option value="technical">Technical Round</option>
                    <option value="final">Final Round</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Interview Date
                  <input
                    type="date"
                    value={interviewHistoryForm.interviewDate}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, interviewDate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Result
                  <select
                    value={interviewHistoryForm.result}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, result: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                    <option value="hold">On Hold</option>
                  </select>
                </label>
                <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                  Interviewer Name
                  <input
                    value={interviewHistoryForm.interviewerName}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, interviewerName: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                  Interview Feedback
                  <textarea
                    rows={3}
                    value={interviewHistoryForm.feedback}
                    onChange={(event) => setInterviewHistoryForm((current) => ({ ...current, feedback: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {activePanel === 3 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Interviewer Updates</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Updated By
                  <input
                    value={interviewerUpdateForm.updatedBy}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, updatedBy: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Designation
                  <input
                    value={interviewerUpdateForm.designation}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, designation: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Update Mode
                  <select
                    value={interviewerUpdateForm.updateMode}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, updateMode: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Select</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="portal">Portal Update</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Update Date
                  <input
                    type="date"
                    value={interviewerUpdateForm.updateDate}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, updateDate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                  Next Action
                  <textarea
                    rows={2}
                    value={interviewerUpdateForm.nextAction}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, nextAction: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                  Internal Notes
                  <textarea
                    rows={3}
                    value={interviewerUpdateForm.internalNotes}
                    onChange={(event) => setInterviewerUpdateForm((current) => ({ ...current, internalNotes: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/candidate/admin/cms/candidates')}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/candidate/admin/cms/candidates')} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            {'<- Candidates'}
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['fullName', 'Full Name *'],
            ['mobileNumber', 'Mobile Number *'],
            ['whatsappNo', 'WhatsApp No'],
            ['emailId', 'Email Id'],
            ['dateOfBirth', 'Date Of Birth', 'date'],
            ['gender', 'Gender'],
            ['education', 'Education'],
            ['specialization', 'Specialization'],
            ['totalExperience', 'Total Experience (years)', 'number'],
            ['currentCompany', 'Current Company'],
            ['currentDesignation', 'Current Designation'],
            ['currentSalary', 'Current Salary'],
            ['expectedSalary', 'Expected Salary'],
            ['noticePeriod', 'Notice Period'],
            ['preferredLocation', 'Preferred Location'],
            ['marriageStatus', 'Marriage Status']
          ].map(([key, label, type = 'text']) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(event) => update(key, event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          ))}

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Current Address
            <textarea
              value={form.currentAddress}
              onChange={(event) => update('currentAddress', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Permanent Address
            <textarea
              value={form.permanentAddress}
              onChange={(event) => update('permanentAddress', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Key Skills (comma separated)
            <input
              value={form.keySkills}
              onChange={(event) => update('keySkills', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Languages Known (comma separated)
            <input
              value={form.languagesKnown}
              onChange={(event) => update('languagesKnown', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70 sm:w-auto"
      >
        {saving ? 'Saving...' : isEdit ? 'Update Candidate' : 'Create Candidate'}
      </button>
    </form>
  )
}
