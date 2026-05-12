import {
  INTERVIEW_QUESTION_COUNT,
  PROFESSIONAL_RATING_FIELDS,
  buildQuestionRows,
  calculateQuestionMarksResult,
  emptyCandidateForm,
  formatQuestionSummary,
  formatRatingSummary,
  mapApiToCandidateForm,
  mapCandidateFormToApi,
  toggleSelection
} from '../../src/candidate/pages/admin/Candidates/candidateFormModel'

describe('candidate PDF form model', () => {
  test('builds empty defaults for ratings and default question rows', () => {
    const form = emptyCandidateForm()

    expect(form.interviewForm.questions).toHaveLength(INTERVIEW_QUESTION_COUNT)
    expect(form.interviewForm.professionalRatings.qualification).toEqual([])
    expect(form.interviews).toHaveLength(1)
  })

  test('maps API data into normalized form state', () => {
    const form = mapApiToCandidateForm({
      candidate: {
        _id: 'candidate-id',
        fullName: 'Asha Kale',
        mobileNumber: '9876543210',
        formMeta: { receiptNo: 'R-12', date: '2026-05-11T00:00:00.000Z' },
        familyDetails: { fatherOccupation: 'Business' },
        interviewForm: {
          professionalRatings: { qualification: [1, '3', 9] },
          iqSelections: [1, '10', 11],
          questions: [{ question: 'Tell me about yourself', choices: ['A', 'D', 'C'], marks: '4' }]
        }
      },
      interviews: []
    })

    expect(form.id).toBe('candidate-id')
    expect(form.formMeta.date).toBe('2026-05-11')
    expect(form.familyDetails.fatherOccupation).toBe('Business')
    expect(form.interviewForm.professionalRatings.qualification).toEqual([1, 3])
    expect(form.interviewForm.iqSelections).toEqual([1, 10])
    expect(form.interviewForm.questions).toHaveLength(INTERVIEW_QUESTION_COUNT)
    expect(form.interviewForm.questions[0]).toEqual({ question: 'Tell me about yourself', choices: ['A', 'C'], marks: '4' })
  })

  test('maps form state into API payload with nested PDF fields', () => {
    const form = emptyCandidateForm()
    form.fullName = '  Asha Kale  '
    form.mobile = '9876543210'
    form.collegeName = 'Success College'
    form.totalExperience = '2.5'
    form.interviewForm.professionalRatings.qualification = [2, 5]
    form.interviewForm.questions[0] = { question: 'Question one', choices: ['B', 'C'], marks: '9' }

    const payload = mapCandidateFormToApi(form)

    expect(payload.fullName).toBe('Asha Kale')
    expect(payload.mobileNumber).toBe('9876543210')
    expect(payload.collegeName).toBe('Success College')
    expect(payload.totalExperience).toBe(2.5)
    expect(payload.interviewForm.professionalRatings.qualification).toEqual([2, 5])
    expect(payload.interviewForm.questions).toHaveLength(INTERVIEW_QUESTION_COUNT)
    expect(payload.interviewForm.questions[0]).toEqual({ question: 'Question one', choices: ['B', 'C'], marks: '9' })
  })

  test('supports multi-checkbox toggling and summaries', () => {
    expect(toggleSelection([1, 3], 3, [1, 2, 3, 4, 5])).toEqual([1])
    expect(toggleSelection([1, 3], 5, [1, 2, 3, 4, 5])).toEqual([1, 3, 5])
    expect(toggleSelection(['A'], 'C', ['A', 'B', 'C'])).toEqual(['A', 'C'])

    const ratings = { qualification: [1, 5] }
    expect(formatRatingSummary(ratings, PROFESSIONAL_RATING_FIELDS)).toContain('Qualification: 1/5')
    expect(formatQuestionSummary(buildQuestionRows([{ question: 'Ready?', choices: ['A', 'B'] }]))).toBe('Q1 [A/B]: Ready?')
  })

  test('calculates question total from manually entered marks', () => {
    const result = calculateQuestionMarksResult([
      { question: 'One', choices: ['A'], marks: '4' },
      { question: 'Two', choices: ['B'], marks: '7' },
      { question: 'Three', choices: ['C'], marks: '2' },
      { question: 'Four', choices: ['B', 'C'], marks: '10' },
      { question: 'Ignored A/B/C score', choices: ['A'] }
    ])

    expect(result.scores.slice(0, 5)).toEqual([4, 7, 2, 10, null])
    expect(result.total).toBe(23)
    expect(result.maxTotal).toBe(100)
  })

  test('expands question total when extra question rows have content', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      question: `Q${index + 1}`,
      choices: [],
      marks: '1'
    }))
    const result = calculateQuestionMarksResult(rows)

    expect(result.scores).toHaveLength(12)
    expect(result.total).toBe(12)
    expect(result.maxTotal).toBe(120)
  })
})
