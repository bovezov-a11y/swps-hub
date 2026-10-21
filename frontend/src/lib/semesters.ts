/**
 * Semesters are named like the backend expects: "2026/27 Winter" (October–February) and "2026/27 Summer" (March–September).
 */
export function semesterOf(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  if (month >= 10) return name(year, 'Winter')
  if (month <= 2) return name(year - 1, 'Winter')
  return name(year - 1, 'Summer')
}

/** The two upcoming semesters, the current one and the previous one, newest first. */
export function semesterOptions(today = new Date()) {
  const current = toIndex(semesterOf(today))
  return [2, 1, 0, -1].map((offset) => fromIndex(current + offset))
}

// Semesters as consecutive integers: every academic year has a Winter (even) and a Summer (odd) semester.
function toIndex(semester: string) {
  return Number(semester.slice(0, 4)) * 2 + (semester.endsWith('Summer') ? 1 : 0)
}

function fromIndex(index: number) {
  return name(Math.floor(index / 2), index % 2 === 0 ? 'Winter' : 'Summer')
}

function name(startYear: number, season: 'Winter' | 'Summer') {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')} ${season}`
}
