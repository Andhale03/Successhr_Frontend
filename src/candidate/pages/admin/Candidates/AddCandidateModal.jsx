import { useState } from 'react'
import { X, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const initialForm = {
  // Section 1
  name: '',
  email: '',
  dob: '',
  address: '',
  permanentAddress: '',
  mobile: '',
  whatsapp: '',
  gender: '',
  aadhar: '',
  pan: '',
  age: '',
  maritalStatus: '',

  // Section 2
  education: '',
  college: '',
  computerCourses: '',
  professorName: '',
  professorContact: '',
  passingYear: '',
  achievements: '',

  // Section 3
  responsibilities: '',
  jobProfile: '',
  experience: '',
  ctc: '',
  company: '',
  jobLocation: '',
  lookingFor: '',
  preferredLocation: '',
  expectedSalary: '',

  // Section 4
  referredBy: '',
  referenceContact: '',

  // Section 5
  motherName: '',
  motherMobile: '',
  motherOccupation: '',
  fatherName: '',
  fatherMobile: '',
  fatherOccupation: '',
  siblingsName: '',
  siblingsContact: '',
  siblingsDetails: '',

  feedback: '',
  suggestion: ''
}

export default function AddCandidateModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState({
    aadharFile: null,
    resume: null,
    photo: null
  })

  if (!open) return null

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleFile = (name, file) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File must be less than 10MB')
      return
    }
    setFiles((f) => ({ ...f, [name]: file }))
  }

  const validate = () => {
    if (!form.name || !form.email || !form.mobile) {
      toast.error('Please fill required fields')
      return false
    }
    if (!files.resume) {
      toast.error('Resume is required')
      return false
    }
    return true
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return

    console.log(form, files)
    toast.success('Candidate added (connect API)')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-xl p-5 shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex justify-between mb-5">
          <h2 className="text-lg font-bold">Add Candidate</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* SECTION 1 */}
        <Section title="Basic Details">
          <Input label="Candidate Name " value={form.name} onChange={(v) => update('name', v)} />
          <Input label="Email " value={form.email} onChange={(v) => update('email', v)} />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={(v) => update('dob', v)} />
          <Input label="Current Address" value={form.address} onChange={(v) => update('address', v)} />
          <Input label="Permanent Address" value={form.permanentAddress} onChange={(v) => update('permanentAddress', v)} />
          <Input label="Mobile Number" value={form.mobile} onChange={(v) => update('mobile', v)} />
          <Input label="Whatsapp Number" value={form.whatsapp} onChange={(v) => update('whatsapp', v)} />
          <Input label="Gender" value={form.gender} onChange={(v) => update('gender', v)} />
          <Input label="Aadhar Card Number" value={form.aadhar} onChange={(v) => update('aadhar', v)} />
          <File label="Upload Aadhar Card" onChange={(f) => handleFile('aadharFile', f)} />
          <Input label="PAN Card Number" value={form.pan} onChange={(v) => update('pan', v)} />
          <Input label="Age" value={form.age} onChange={(v) => update('age', v)} />

          <Select
            label="Marital Status"
            value={form.maritalStatus}
            onChange={(v) => update('maritalStatus', v)}
            options={['married', 'unmarried', 'divorced', 'widow']}
          />
        </Section>

        {/* SECTION 2 */}
        <Section title="Education">
          <Input label="Highest Qualification" value={form.education} onChange={(v) => update('education', v)} />
          <Input label="College/Institute Name" value={form.college} onChange={(v) => update('college', v)} />
          <Input label="Professor/Staff/TPO Name" value={form.professorName} onChange={(v) => update('professorName', v)} />
          <Input label="Professor/Staff/TPO Contact" value={form.professorContact} onChange={(v) => update('professorContact', v)} />
          <Input label="Passing Year" value={form.passingYear} onChange={(v) => update('passingYear', v)} />
           <Input label="Computer Courses" value={form.computerCourses} onChange={(v) => update('computerCourses', v)} />
          <Input label="Other Achievements" value={form.achievements} onChange={(v) => update('achievements', v)} />
        </Section>

        {/* SECTION 3 */}
        <Section title="Experience">
          <Input label="Key Responsibilities in Previous Job" value={form.responsibilities} onChange={(v) => update('responsibilities', v)} />
          <Input label="Current/Last Job Profile" value={form.jobProfile} onChange={(v) => update('jobProfile', v)} />
          <Input label="Experience (years)" value={form.experience} onChange={(v) => update('experience', v)} />
          <Input label="Current CTC/Salary" value={form.ctc} onChange={(v) => update('ctc', v)} />
          <Input label="Current/Last Company Name" value={form.company} onChange={(v) => update('company', v)} />
          <Input label="Current/Last Job Location" value={form.jobLocation} onChange={(v) => update('jobLocation', v)} />
          <Input label="Looking For" value={form.lookingFor} onChange={(v) => update('lookingFor', v)} />
           <Input label="Looking For Job in Which Field?" value={form.lookingForJobField} onChange={(v) => update('lookingForJobField', v)} />
          <Input label="Preferred Location" value={form.preferredLocation} onChange={(v) => update('preferredLocation', v)} />
          <Input label="Expected CTC/Salary" value={form.expectedSalary} onChange={(v) => update('expectedSalary', v)} />
        </Section>

        {/* SECTION 4 */}
        <Section title="Reference">
          <Input label="Referred By" value={form.referredBy} onChange={(v) => update('referredBy', v)} />
          <Input label="Reference Contact Number" value={form.referenceContact} onChange={(v) => update('referenceContact', v)} />
          <File label="Upload Resume *" onChange={(f) => handleFile('resume', f)} />
          <File label="Upload Passport Size Photograph" onChange={(f) => handleFile('photo', f)} />
        </Section>

        {/* SECTION 5 */}
        <Section title="Family Details">
          <Input label="Mother Name" value={form.motherName} onChange={(v) => update('motherName', v)} />
          <Input label="Mother Mobile Number" value={form.motherMobile} onChange={(v) => update('motherMobile', v)} />
          <Input label="Mother Occupation" value={form.motherOccupation} onChange={(v) => update('motherOccupation', v)} />
          <Input label="Father/Husband Name" value={form.fatherName} onChange={(v) => update('fatherName', v)} />
          <Input label="Father/Husband Mobile Number" value={form.fatherMobile} onChange={(v) => update('fatherMobile', v)} />
          <Input label="Father/Husband Occupation" value={form.fatherOccupation} onChange={(v) => update('fatherOccupation', v)} />
        </Section>

        {/* FEEDBACK */}
        <Section title="Feedback">
          <Input label="Rating (1-5)" value={form.feedback} onChange={(v) => update('feedback', v)} />
          <Input label="Any Suggestion" value={form.suggestion} onChange={(v) => update('suggestion', v)} />
        </Section>

        <button className="w-full mt-6 bg-sky-600 text-white py-3 rounded-lg">
          Save Candidate
        </button>
      </form>
    </div>
  )
}

/* reusable components */

function Section({ title, children }) {
  return (
    <div className="border p-4 rounded-xl mb-6">
      <h3 className="mb-4 font-bold text-sm uppercase text-gray-500">{title}</h3>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border px-3 py-2 rounded-lg"
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border px-3 py-2 rounded-lg"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function File({ label, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1">{label}</p>
      <label className="flex items-center justify-center border-dashed border p-2 rounded-lg cursor-pointer">
        <UploadCloud className="mr-2" />
        Upload
        <input
          type="file"
          className="hidden"
          onChange={(e) => onChange(e.target.files[0])}
        />
      </label>
    </div>
  )
}