import { X } from 'lucide-react'

const cardClass = 'rounded-xl bg-slate-50 p-4'

function InfoCard({ label, value }) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || '-'}</p>
    </div>
  )
}

export default function CandidatePopup({ open, candidate, onClose, onEdit }) {
  if (!open || !candidate) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[95vh] sm:rounded-3xl">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Candidate</span>
                {candidate.createdAt ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Created {new Date(candidate.createdAt).toLocaleString('en-IN')}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 truncate text-xl font-bold text-slate-900 sm:text-2xl">{candidate.fullName || 'Candidate'}</h2>
              <p className="mt-1 text-sm text-slate-500">ID: {candidate.id}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Candidate Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Full Name" value={candidate.fullName} />
                <InfoCard label="Mobile" value={candidate.mobile} />
                <InfoCard label="Aadhaar Number" value={candidate.aadhaarNo} />
                <InfoCard label="Email" value={candidate.email} />
                <InfoCard label="Date Of Birth" value={candidate.dob} />
                <InfoCard label="Gender" value={candidate.gender} />
                <InfoCard label="Current Location" value={candidate.currentLocation} />
                <InfoCard label="Education" value={candidate.education} />
                <InfoCard label="Experience" value={candidate.experience} />
                <InfoCard label="Current Salary" value={candidate.currentSalary} />
                <InfoCard label="Expected Salary" value={candidate.expectedSalary} />
                <InfoCard label="Notice Period" value={candidate.noticePeriod} />
                <InfoCard label="Job Type" value={candidate.jobType} />
                <InfoCard label="Department" value={candidate.department} />
                <InfoCard label="Preferred Location" value={candidate.preferredLocation} />
                <InfoCard label="Skills" value={(candidate.skills || []).join(', ')} />
                <InfoCard label="Languages" value={(candidate.languages || []).join(', ')} />
                <InfoCard label="Reference Source" value={candidate.referenceSource} />
              </div>
              <div className="mt-4">
                <InfoCard label="Additional Notes" value={candidate.additionalNotes} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Interviews</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Reference Person</th>
                      <th className="px-4 py-3">Remark</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(candidate.interviews || []).map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">{row.companyName || '-'}</td>
                        <td className="px-4 py-3">{row.referencePerson || '-'}</td>
                        <td className="px-4 py-3">{row.remark || '-'}</td>
                        <td className="px-4 py-3">{row.date || '-'}</td>
                        <td className="px-4 py-3">{row.status || '-'}</td>
                      </tr>
                    ))}
                    {(candidate.interviews || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No interviews.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

