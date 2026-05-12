import { calcEarning } from '../../../src/utils/earningPreview'

describe('Live earning preview', () => {
  test('matches server formula exactly', () => {
    expect(calcEarning(25000, 1, 8.33)).toBe(2083)
  })

  test('returns 0 for empty salary or percent', () => {
    expect(calcEarning('', 1, 8.33)).toBe(0)
    expect(calcEarning(null, 1, 8.33)).toBe(0)
    expect(calcEarning(25000, 1, '')).toBe(0)
  })

  test('never returns NaN and always returns integer', () => {
    expect(Number.isNaN(calcEarning(undefined, undefined, undefined))).toBe(false)
    expect(Number.isInteger(calcEarning(17777, 1, 8.33))).toBe(true)
  })
})
