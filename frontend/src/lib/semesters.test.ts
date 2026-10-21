import { describe, expect, it } from 'vitest'
import { semesterOf, semesterOptions } from './semesters'

describe('semesters', () => {
  it('maps dates to the academic semester', () => {
    expect(semesterOf(new Date(2026, 9, 1))).toBe('2026/27 Winter')
    expect(semesterOf(new Date(2027, 1, 28))).toBe('2026/27 Winter')
    expect(semesterOf(new Date(2027, 2, 1))).toBe('2026/27 Summer')
    expect(semesterOf(new Date(2027, 8, 30))).toBe('2026/27 Summer')
  })

  it('offers upcoming, current and previous semesters, newest first', () => {
    expect(semesterOptions(new Date(2026, 9, 21))).toEqual([
      '2027/28 Winter',
      '2026/27 Summer',
      '2026/27 Winter',
      '2025/26 Summer',
    ])
  })
})
