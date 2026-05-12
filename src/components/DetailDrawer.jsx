import { X } from 'lucide-react'
import { format } from 'date-fns'
import StatusBadge from './StatusBadge'
import { assetUrl } from '../api/axios'

const labels = {
  candidateName: 'Candidate Name',
  mobileNumber: 'Mobile Number',
  aadhaarNo: 'Aadhaar Number',
  whatsappNo: 'WhatsApp No',
  emailId: 'Email',
  appliedFor: 'Applied For',
  interestedDepartment: 'Interested Department',
  preferredIndustry: 'Preferred Industry',
  preferredJobLocation: 'Preferred Job Location',
  education: 'Education',
  currentCompany: 'Current Company',
  totalExperience: 'Total Experience',
  careerSummary: 'Career Summary',
  currentSalary: 'Current Salary',
  expectedSalary: 'Expected Salary',
  noticePeriod: 'Notice Period',
  reasonForJobChange: 'Reason For Job Change',
  currentJobLocation: 'Current Job Location',
  availabilityForInterview: 'Availability For Interview',
  marriageStatus: 'Marriage Status',
  companyName: 'Company Name',
  companyAddress: 'Company Address',
  contactPersonName: 'Contact Person',
  contactPersonDesignation: 'Designation',
  mobileNo: 'Mobile No',
  jobProfile: 'Job Profile',
  requiredKeySkills: 'Required Key Skills',
  rolesAndResponsibility: 'Roles And Responsibility',
  salaryRange: 'Salary Range',
  gender: 'Gender',
  numberOfVacancy: 'Vacancies',
  jobTime: 'Job Time',
  shift: 'Shift',
  jobLocation: 'Job Location',
  ageCriteria: 'Age Criteria',
  castCriteria: 'Caste Criteria',
  marriageCriteria: 'Marriage Criteria',
  facilities: 'Facilities',
  manpower: 'Manpower',
  turnover: 'Turnover',
  plant: 'Plant',
  interviewMode: 'Interview Mode',
  weeklyOff: 'Weekly Off'
}

const valueText = (value) => {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not provided'
  if (typeof value === 'object') return null
  return String(value)
}

const dateInputValue = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return format(parsed, 'yyyy-MM-dd')
}

function FieldGrid({ data, fields }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const value = valueText(data?.[field])

        if (value === null) return null

        return (
          <div key={field} className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">{labels[field] || field}</p>
            <p className="mt-1 break-words text-sm text-slate-900">{value}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function DetailDrawer({
  item,
  type,
  open,
  onClose,
  adminControls,
  onStatusChange,
  onNotesChange,
  onSave,
  fullEdit = false,
  onItemChange,
  onSaveFull,
  saveFullLabel = 'Save All Changes',
  savingFull = false,
  onUploadDocuments,
  uploadingDocuments = false
}) {
  if (!open || !item) return null

  const title = type === 'student' ? item.candidateName : item.companyName
  const subtitle = item.submittedBy?.name ? `Submitted by ${item.submittedBy.name}` : 'Submitted reference'
  const updatedAt = item.updatedAt || item.createdAt

  const updateField = (field, value) => {
    onItemChange?.((current) => ({ ...current, [field]: value }))
  }

  const updateNested = (parent, field, value) => {
    onItemChange?.((current) => ({
      ...current,
      [parent]: {
        ...(current?.[parent] || {}),
        [field]: value
      }
    }))
  }

  const updateAvailability = (field, value) => {
    onItemChange?.((current) => ({
      ...current,
      aboutCompany: {
        ...(current?.aboutCompany || {}),
        availabilityForInterview: {
          ...(current?.aboutCompany?.availabilityForInterview || {}),
          [field]: value
        }
      }
    }))
  }

  const updateArrayField = (parent, field, rawValue) => {
    const value = rawValue
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    updateNested(parent, field, value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close details"
      />
      <aside className="relative flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in sm:h-[95vh] sm:rounded-3xl">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    type === 'student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {type === 'student' ? 'Candidate' : 'Company'}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <h2 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{subtitle}</span>
                {updatedAt ? (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>Updated {format(new Date(updatedAt), 'dd MMM yyyy, hh:mm a')}</span>
                  </>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {type === 'student' ? (
            fullEdit ? (
              <>
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Submission Info</h3>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                    Submitted via: {item.source === 'public_form' ? 'Public Form' : 'BA Admin Panel'}
                  </div>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Edit Candidate Data</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField label="Candidate Name" value={item.candidateName || ''} onChange={(value) => updateField('candidateName', value)} />
                    <InputField label="Mobile Number" value={item.mobileNumber || ''} onChange={(value) => updateField('mobileNumber', value)} />
                    <InputField label="Aadhaar Number" value={item.aadhaarNo || ''} onChange={(value) => updateField('aadhaarNo', value)} />
                    <InputField label="WhatsApp No" value={item.whatsappNo || ''} onChange={(value) => updateField('whatsappNo', value)} />
                    <InputField label="Email" value={item.emailId || ''} onChange={(value) => updateField('emailId', value)} />
                    <InputField label="Applied For" value={item.appliedFor || ''} onChange={(value) => updateField('appliedFor', value)} />
                    <InputField label="Interested Department" value={item.interestedDepartment || ''} onChange={(value) => updateField('interestedDepartment', value)} />
                    <InputField label="Preferred Industry" value={item.preferredIndustry || ''} onChange={(value) => updateField('preferredIndustry', value)} />
                    <InputField label="Preferred Job Location" value={item.preferredJobLocation || ''} onChange={(value) => updateField('preferredJobLocation', value)} />
                    <InputField label="Education" value={item.education || ''} onChange={(value) => updateField('education', value)} />
                    <InputField label="Current Company" value={item.currentCompany || ''} onChange={(value) => updateField('currentCompany', value)} />
                    <InputField label="Total Experience" type="number" value={item.totalExperience ?? ''} onChange={(value) => updateField('totalExperience', value === '' ? undefined : Number(value))} />
                    <InputField label="Current Salary" value={item.currentSalary || ''} onChange={(value) => updateField('currentSalary', value)} />
                    <InputField label="Expected Salary" value={item.expectedSalary || ''} onChange={(value) => updateField('expectedSalary', value)} />
                    <InputField label="Notice Period" type="number" value={item.noticePeriod ?? ''} onChange={(value) => updateField('noticePeriod', value === '' ? undefined : Number(value))} />
                    <InputField label="Current Job Location" value={item.currentJobLocation || ''} onChange={(value) => updateField('currentJobLocation', value)} />
                    <InputField label="Availability For Interview" value={item.availabilityForInterview || ''} onChange={(value) => updateField('availabilityForInterview', value)} />
                    <SelectField
                      label="Marriage Status"
                      value={item.marriageStatus || ''}
                      onChange={(value) => updateField('marriageStatus', value)}
                      options={['', 'Married', 'Unmarried', 'Single']}
                    />
                    <TextAreaField label="Career Summary" value={item.careerSummary || ''} onChange={(value) => updateField('careerSummary', value)} className="sm:col-span-2" />
                    <TextAreaField label="Reason For Job Change" value={item.reasonForJobChange || ''} onChange={(value) => updateField('reasonForJobChange', value)} className="sm:col-span-2" />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Documents</h3>
                  {(item.documents || []).length ? (
                    <div className="space-y-2">
                      {item.documents.map((doc, index) => (
                        <div key={doc._id || `${doc.fileUrl}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <a href={assetUrl(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                            {doc.fileName || 'Document'} · {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'Uploaded'}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              onItemChange?.((current) => ({
                                ...current,
                                documents: (current.documents || []).filter((_, itemIndex) => itemIndex !== index)
                              }))
                            }
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No documents uploaded.</p>
                  )}

                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    {uploadingDocuments ? 'Uploading...' : 'Upload New Documents'}
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={(event) => {
                        const files = Array.from(event.target.files || [])
                        if (files.length) {
                          onUploadDocuments?.(files)
                        }
                        event.target.value = ''
                      }}
                    />
                  </label>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Submission Info</h3>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                    Submitted via: {item.source === 'public_form' ? 'Public Form' : 'BA Admin Panel'}
                  </div>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Candidate Details</h3>
                  <FieldGrid
                    data={item}
                    fields={[
                      'candidateName',
                      'mobileNumber',
                      'aadhaarNo',
                      'whatsappNo',
                      'emailId',
                      'appliedFor',
                      'interestedDepartment',
                      'preferredIndustry',
                      'preferredJobLocation',
                      'education',
                      'currentCompany',
                      'totalExperience',
                      'careerSummary',
                      'currentSalary',
                      'expectedSalary',
                      'noticePeriod',
                      'reasonForJobChange',
                      'currentJobLocation',
                      'availabilityForInterview',
                      'marriageStatus'
                    ]}
                  />
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Documents</h3>
                  {item.documents?.length ? (
                    <div className="space-y-2">
                      {item.documents.map((doc) => (
                        <a
                          key={doc._id || doc.fileUrl}
                          href={assetUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
                        >
                          {doc.fileName || 'Document'} · {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'Uploaded'}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No documents uploaded.</p>
                  )}
                </section>
              </>
            )
          ) : fullEdit ? (
            <>
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Edit Company Data</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Company Name" value={item.companyName || ''} onChange={(value) => updateField('companyName', value)} />
                  <InputField label="Company Address" value={item.companyAddress || ''} onChange={(value) => updateField('companyAddress', value)} />
                  <InputField label="Contact Person Name" value={item.contactPersonName || ''} onChange={(value) => updateField('contactPersonName', value)} />
                  <InputField label="Contact Person Designation" value={item.contactPersonDesignation || ''} onChange={(value) => updateField('contactPersonDesignation', value)} />
                  <InputField label="Mobile No" value={item.mobileNo || ''} onChange={(value) => updateField('mobileNo', value)} />
                  <InputField label="Email" value={item.emailId || ''} onChange={(value) => updateField('emailId', value)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Job Requirements</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Job Profile" value={item.jobRequirements?.jobProfile || ''} onChange={(value) => updateNested('jobRequirements', 'jobProfile', value)} />
                  <InputField label="Education" value={item.jobRequirements?.education || ''} onChange={(value) => updateNested('jobRequirements', 'education', value)} />
                  <InputField label="Experience" value={item.jobRequirements?.experience || ''} onChange={(value) => updateNested('jobRequirements', 'experience', value)} />
                  <InputField label="Salary Range" value={item.jobRequirements?.salaryRange || ''} onChange={(value) => updateNested('jobRequirements', 'salaryRange', value)} />
                  <SelectField label="Gender" value={item.jobRequirements?.gender || ''} onChange={(value) => updateNested('jobRequirements', 'gender', value)} options={['', 'Male', 'Female', 'Any']} />
                  <InputField label="Number Of Vacancy" type="number" value={item.jobRequirements?.numberOfVacancy ?? ''} onChange={(value) => updateNested('jobRequirements', 'numberOfVacancy', value === '' ? undefined : Number(value))} />
                  <InputField label="Job Time" value={item.jobRequirements?.jobTime || ''} onChange={(value) => updateNested('jobRequirements', 'jobTime', value)} />
                  <InputField label="Shift" value={item.jobRequirements?.shift || ''} onChange={(value) => updateNested('jobRequirements', 'shift', value)} />
                  <InputField label="Job Location" value={item.jobRequirements?.jobLocation || ''} onChange={(value) => updateNested('jobRequirements', 'jobLocation', value)} />
                  <InputField label="Age Criteria" value={item.jobRequirements?.ageCriteria || ''} onChange={(value) => updateNested('jobRequirements', 'ageCriteria', value)} />
                  <InputField label="Caste Criteria" value={item.jobRequirements?.castCriteria || ''} onChange={(value) => updateNested('jobRequirements', 'castCriteria', value)} />
                  <SelectField label="Marriage Criteria" value={item.jobRequirements?.marriageCriteria || ''} onChange={(value) => updateNested('jobRequirements', 'marriageCriteria', value)} options={['', 'Married', 'Unmarried', 'Any']} />
                  <TextAreaField label="Required Key Skills (comma separated)" value={(item.jobRequirements?.requiredKeySkills || []).join(', ')} onChange={(value) => updateArrayField('jobRequirements', 'requiredKeySkills', value)} className="sm:col-span-2" />
                  <TextAreaField label="Facilities (comma separated)" value={(item.jobRequirements?.facilities || []).join(', ')} onChange={(value) => updateArrayField('jobRequirements', 'facilities', value)} className="sm:col-span-2" />
                  <TextAreaField label="Roles And Responsibility" value={item.jobRequirements?.rolesAndResponsibility || ''} onChange={(value) => updateNested('jobRequirements', 'rolesAndResponsibility', value)} className="sm:col-span-2" />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">About Company</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Manpower" value={item.aboutCompany?.manpower || ''} onChange={(value) => updateNested('aboutCompany', 'manpower', value)} />
                  <InputField label="Turnover" value={item.aboutCompany?.turnover || ''} onChange={(value) => updateNested('aboutCompany', 'turnover', value)} />
                  <InputField label="Plant" value={item.aboutCompany?.plant || ''} onChange={(value) => updateNested('aboutCompany', 'plant', value)} />
                  <SelectField label="Interview Mode" value={item.aboutCompany?.interviewMode || ''} onChange={(value) => updateNested('aboutCompany', 'interviewMode', value)} options={['', 'Online', 'Offline']} />
                  <InputField label="Interview Date" type="date" value={dateInputValue(item.aboutCompany?.availabilityForInterview?.date)} onChange={(value) => updateAvailability('date', value || undefined)} />
                  <InputField label="Interview Time" value={item.aboutCompany?.availabilityForInterview?.time || ''} onChange={(value) => updateAvailability('time', value)} />
                  <TextAreaField label="Weekly Off (comma separated)" value={(item.aboutCompany?.weeklyOff || []).join(', ')} onChange={(value) => updateArrayField('aboutCompany', 'weeklyOff', value)} className="sm:col-span-2" />
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Company Details</h3>
                <FieldGrid
                  data={item}
                  fields={[
                    'companyName',
                    'companyAddress',
                    'contactPersonName',
                    'contactPersonDesignation',
                    'mobileNo',
                    'emailId'
                  ]}
                />
              </section>
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Job Requirements</h3>
                <FieldGrid
                  data={item.jobRequirements}
                  fields={[
                    'jobProfile',
                    'education',
                    'experience',
                    'requiredKeySkills',
                    'rolesAndResponsibility',
                    'salaryRange',
                    'gender',
                    'numberOfVacancy',
                    'jobTime',
                    'shift',
                    'jobLocation',
                    'ageCriteria',
                    'castCriteria',
                    'marriageCriteria',
                    'facilities'
                  ]}
                />
              </section>
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">About Company</h3>
                <FieldGrid data={item.aboutCompany} fields={['manpower', 'turnover', 'plant', 'interviewMode', 'weeklyOff']} />
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Availability For Interview</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {item.aboutCompany?.availabilityForInterview?.date
                      ? format(new Date(item.aboutCompany.availabilityForInterview.date), 'dd MMM yyyy')
                      : 'Not provided'}{' '}
                    {item.aboutCompany?.availabilityForInterview?.time || ''}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>

        {(adminControls || fullEdit) && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
            {adminControls && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Status
                  <select
                    value={item.status}
                    onChange={(event) => {
                      onStatusChange?.(event.target.value)
                      if (fullEdit) updateField('status', event.target.value)
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="not_viewed">Not Viewed</option>
                    <option value="in_review">In Review</option>
                    <option value="priority">Priority</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Admin Notes
                  <textarea
                    value={item.adminNotes || ''}
                    onChange={(event) => {
                      onNotesChange?.(event.target.value)
                      if (fullEdit) updateField('adminNotes', event.target.value)
                    }}
                    onBlur={fullEdit ? undefined : onSave}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </div>
            )}

            {fullEdit ? (
              <button
                type="button"
                onClick={onSaveFull}
                disabled={savingFull}
                className={`${adminControls ? 'mt-3' : ''} inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70`}
              >
                {savingFull ? 'Saving...' : saveFullLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSave}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Save
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange, className = '' }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'Select'}
          </option>
        ))}
      </select>
    </label>
  )
}
