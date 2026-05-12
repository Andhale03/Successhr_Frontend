export const RATING_VALUES = [1, 2, 3, 4, 5]
export const IQ_TQ_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const QUESTION_CHOICES = ['A', 'B', 'C']
export const INTERVIEW_QUESTION_COUNT = 10
export const QUESTION_MARK_MAX = 10

export const PROFESSIONAL_RATING_FIELDS = [
  { key: 'qualification', label: 'Qualification' },
  { key: 'technicalKnowledge', label: 'Technical Knowledge' },
  { key: 'professionalExperience', label: 'Professional Experience' },
  { key: 'competenceConfidence', label: 'Competence / Confidence' },
  { key: 'maturity', label: 'Maturity' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'communicationEngMar', label: 'Communication - Eng / Mar' },
  { key: 'stability', label: 'Stability' }
]

export const PERSONALITY_RATING_FIELDS = [
  { key: 'leadership', label: 'Leadership' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'interpersonalSkills', label: 'Interpersonal Skills' },
  { key: 'enthusiasm', label: 'Enthusiasm' },
  { key: 'intelligenceAlertness', label: 'Intelligence / Alertness' },
  { key: 'personalityHonesty', label: 'Personality / Honesty' },
  { key: 'financeStandard', label: 'Finance Standard' },
  { key: 'classOfCandidate', label: 'Class Of Candidate' }
]

const text = (value) => String(value ?? '')

const dateInput = (value) => (value ? String(value).slice(0, 10) : '')

const normalizedAllowed = (allowed) => allowed.map((item) => String(item))

export const normalizeSelections = (values, allowed) => {
  const selected = new Set((Array.isArray(values) ? values : []).map((item) => String(item)))
  const allowedStrings = normalizedAllowed(allowed)

  return allowed
    .filter((item, index) => selected.has(String(item)) && allowedStrings.indexOf(String(item)) === index)
    .map((item) => (typeof item === 'number' ? Number(item) : String(item)))
}

export const toggleSelection = (values, value, allowed) => {
  const normalized = normalizeSelections(values, allowed)
  const target = String(value)
  const hasValue = normalized.some((item) => String(item) === target)
  const next = hasValue ? normalized.filter((item) => String(item) !== target) : [...normalized, value]

  return normalizeSelections(next, allowed)
}

export const emptyRatings = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.key] = []
    return acc
  }, {})

const normalizeRatings = (ratings, fields, allowed = RATING_VALUES) =>
  fields.reduce((acc, field) => {
    acc[field.key] = normalizeSelections(ratings?.[field.key], allowed)
    return acc
  }, {})

export const normalizeQuestionMarks = (value) => {
  const raw = text(value).trim()
  if (!raw) return ''

  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return ''

  const clamped = Math.max(0, Math.min(QUESTION_MARK_MAX, numeric))
  return Number.isInteger(clamped) ? String(clamped) : String(clamped)
}

export const emptyQuestionRow = () => ({ question: '', choices: [], marks: '' })

const normalizeQuestionRow = (row = {}) => ({
  question: text(row.question),
  choices: normalizeSelections(row.choices, QUESTION_CHOICES),
  marks: normalizeQuestionMarks(row.marks ?? row.grade)
})

const questionHasContent = (row) => Boolean(text(row.question).trim() || row.choices?.length || normalizeQuestionMarks(row.marks))

export const buildQuestionRows = (rows) => {
  const source = Array.isArray(rows) ? rows.map(normalizeQuestionRow) : []
  const lastContentIndex = source.reduce((lastIndex, row, index) => (questionHasContent(row) ? index : lastIndex), -1)
  const targetLength = Math.max(INTERVIEW_QUESTION_COUNT, lastContentIndex + 1)

  return Array.from({ length: targetLength }, (_, index) => source[index] || emptyQuestionRow())
}

export const questionMarksScore = (row) => {
  const marks = normalizeQuestionMarks(row?.marks ?? row?.grade)
  if (!marks) return null

  const numeric = Number(marks)

  return Number.isFinite(numeric) ? numeric : null
}

export const calculateQuestionMarksResult = (questions, options = {}) => {
  const rows = options.preserveRows && Array.isArray(questions) && questions.length ? questions.map(normalizeQuestionRow) : buildQuestionRows(questions)
  const scores = rows.map(questionMarksScore)
  const total = scores.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0)

  return {
    rows,
    scores,
    total,
    maxTotal: scores.length * QUESTION_MARK_MAX
  }
}

export const emptyInterviewRow = () => ({
  id: Date.now() + Math.random(),
  companyName: '',
  referencePerson: '',
  remark: '',
  date: '',
  status: 'Pending',
  baId: '',
  commissionPercent: ''
})

export const emptyCandidateForm = () => ({
  id: null,
  candidateCode: '',
  createdAt: '',
  formMeta: {
    day: '',
    receiptNo: '',
    rcWrc: '',
    date: ''
  },
  fullName: '',
  mobile: '',
  collegeName: '',
  whatsappNo: '',
  email: '',
  education: '',
  appliedFor: '',
  preferredJobLocation: '',
  totalExperience: '',
  experienceDepartment: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  currentJobLocation: '',
  reasonForJobChange: '',
  familyDetails: {
    fatherOccupation: '',
    motherOccupation: '',
    brotherOccupation: '',
    sisterOccupation: ''
  },
  goalAim: '',
  documents: [],
  interviewForm: {
    suitableIndustry: '',
    suitableDepartment: '',
    hrInterviewer: '',
    remark: '',
    professionalRatings: emptyRatings(PROFESSIONAL_RATING_FIELDS),
    personalityRatings: emptyRatings(PERSONALITY_RATING_FIELDS),
    iqSelections: [],
    tqSelections: [],
    grade: '',
    questions: buildQuestionRows()
  },
  interviews: [emptyInterviewRow()]
})

export const mapInterviewToForm = (row, fallbackReference = '') => ({
  id: row?._id || Date.now() + Math.random(),
  companyName: text(row?.companyName),
  referencePerson: text(row?.reference || fallbackReference),
  remark: text(row?.remark),
  date: dateInput(row?.interviewDate),
  status: row?.result || 'Pending',
  baId: '',
  commissionPercent: ''
})

export const mapApiToCandidateForm = (payload) => {
  const base = emptyCandidateForm()
  const candidate = payload?.candidate || payload || {}
  const interviewForm = candidate?.interviewForm || {}

  return {
    ...base,
    id: candidate?._id || null,
    candidateCode: text(candidate?.candidateCode),
    createdAt: text(candidate?.createdAt),
    formMeta: {
      day: text(candidate?.formMeta?.day),
      receiptNo: text(candidate?.formMeta?.receiptNo),
      rcWrc: text(candidate?.formMeta?.rcWrc),
      date: dateInput(candidate?.formMeta?.date)
    },
    fullName: text(candidate?.fullName),
    mobile: text(candidate?.mobileNumber),
    collegeName: text(candidate?.collegeName),
    whatsappNo: text(candidate?.whatsappNo),
    email: text(candidate?.emailId),
    education: text(candidate?.education),
    appliedFor: text(candidate?.appliedFor || candidate?.currentDesignation),
    preferredJobLocation: text(candidate?.preferredJobLocation || candidate?.preferredLocation),
    totalExperience: candidate?.totalExperience ?? '',
    experienceDepartment: text(candidate?.experienceDepartment),
    currentSalary: text(candidate?.currentSalary),
    expectedSalary: text(candidate?.expectedSalary),
    noticePeriod: text(candidate?.noticePeriod),
    currentJobLocation: text(candidate?.currentJobLocation || candidate?.currentAddress),
    reasonForJobChange: text(candidate?.reasonForJobChange),
    familyDetails: {
      fatherOccupation: text(candidate?.familyDetails?.fatherOccupation),
      motherOccupation: text(candidate?.familyDetails?.motherOccupation),
      brotherOccupation: text(candidate?.familyDetails?.brotherOccupation),
      sisterOccupation: text(candidate?.familyDetails?.sisterOccupation)
    },
    goalAim: text(candidate?.goalAim),
    documents: Array.isArray(candidate?.documents) ? candidate.documents : [],
    interviewForm: {
      suitableIndustry: text(interviewForm?.suitableIndustry),
      suitableDepartment: text(interviewForm?.suitableDepartment),
      hrInterviewer: text(interviewForm?.hrInterviewer),
      remark: text(interviewForm?.remark),
      professionalRatings: normalizeRatings(interviewForm?.professionalRatings, PROFESSIONAL_RATING_FIELDS),
      personalityRatings: normalizeRatings(interviewForm?.personalityRatings, PERSONALITY_RATING_FIELDS),
      iqSelections: normalizeSelections(interviewForm?.iqSelections, IQ_TQ_VALUES),
      tqSelections: normalizeSelections(interviewForm?.tqSelections, IQ_TQ_VALUES),
      grade: text(interviewForm?.grade),
      questions: buildQuestionRows(interviewForm?.questions)
    },
    interviews:
      Array.isArray(payload?.interviews) && payload.interviews.length
        ? payload.interviews.map((row) => mapInterviewToForm(row))
        : base.interviews
  }
}

const numberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const mapCandidateFormToApi = (form) => ({
  formMeta: {
    day: text(form?.formMeta?.day),
    receiptNo: text(form?.formMeta?.receiptNo),
    rcWrc: text(form?.formMeta?.rcWrc),
    date: form?.formMeta?.date || null
  },
  fullName: text(form?.fullName).trim(),
  mobileNumber: text(form?.mobile).trim(),
  collegeName: text(form?.collegeName),
  whatsappNo: text(form?.whatsappNo),
  emailId: text(form?.email),
  education: text(form?.education),
  appliedFor: text(form?.appliedFor),
  preferredJobLocation: text(form?.preferredJobLocation),
  totalExperience: numberOrUndefined(form?.totalExperience),
  experienceDepartment: text(form?.experienceDepartment),
  currentSalary: text(form?.currentSalary),
  expectedSalary: text(form?.expectedSalary),
  noticePeriod: text(form?.noticePeriod),
  currentJobLocation: text(form?.currentJobLocation),
  reasonForJobChange: text(form?.reasonForJobChange),
  familyDetails: {
    fatherOccupation: text(form?.familyDetails?.fatherOccupation),
    motherOccupation: text(form?.familyDetails?.motherOccupation),
    brotherOccupation: text(form?.familyDetails?.brotherOccupation),
    sisterOccupation: text(form?.familyDetails?.sisterOccupation)
  },
  goalAim: text(form?.goalAim),
  interviewForm: {
    suitableIndustry: text(form?.interviewForm?.suitableIndustry),
    suitableDepartment: text(form?.interviewForm?.suitableDepartment),
    hrInterviewer: text(form?.interviewForm?.hrInterviewer),
    remark: text(form?.interviewForm?.remark),
    professionalRatings: normalizeRatings(form?.interviewForm?.professionalRatings, PROFESSIONAL_RATING_FIELDS),
    personalityRatings: normalizeRatings(form?.interviewForm?.personalityRatings, PERSONALITY_RATING_FIELDS),
    iqSelections: normalizeSelections(form?.interviewForm?.iqSelections, IQ_TQ_VALUES),
    tqSelections: normalizeSelections(form?.interviewForm?.tqSelections, IQ_TQ_VALUES),
    grade: text(form?.interviewForm?.grade),
    questions: buildQuestionRows(form?.interviewForm?.questions)
  }
})

export const isMongoId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''))

export const interviewHasContent = (row) =>
  Boolean(
    text(row?.companyName).trim() ||
      text(row?.referencePerson).trim() ||
      text(row?.remark).trim() ||
      text(row?.date).trim() ||
      (row?.status && row.status !== 'Pending')
  )

export const sanitizeInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => interviewHasContent(row) && text(row?.companyName).trim())

export const mapFormInterviewToApi = (row) => ({
  companyName: text(row?.companyName),
  reference: text(row?.referencePerson),
  interviewDate: row?.date || null,
  remark: text(row?.remark),
  result: row?.status || 'Pending'
})

export const formatRatingSummary = (ratings, fields) =>
  fields
    .map((field) => {
      const selected = normalizeSelections(ratings?.[field.key], RATING_VALUES)
      return selected.length ? `${field.label}: ${selected.join('/')}` : null
    })
    .filter(Boolean)
    .join(' ; ')

export const formatSelectionSummary = (values) => normalizeSelections(values, IQ_TQ_VALUES).join('/')

export const formatQuestionSummary = (questions) =>
  buildQuestionRows(questions)
    .map((row, index) => {
      const question = row.question.trim()
      const choices = row.choices.join('/')
      if (!question && !choices) return null
      return `Q${index + 1}${choices ? ` [${choices}]` : ''}${question ? `: ${question}` : ''}`
    })
    .filter(Boolean)
    .join(' ; ')
