export const calcEarning = (salary, basis = 1, percent = 0) => {
  const safeSalary = Number(salary || 0)
  const safeBasis = Number(basis || 1)
  const safePercent = Number(percent || 0)

  if (!Number.isFinite(safeSalary) || !Number.isFinite(safeBasis) || !Number.isFinite(safePercent)) {
    return 0
  }

  return Math.round(safeSalary * safeBasis * (safePercent / 100))
}
