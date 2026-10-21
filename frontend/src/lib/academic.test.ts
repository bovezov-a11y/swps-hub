import { describe, expect, it } from 'vitest'
import { academicYearOf, academicYearOptions, formatFileSize } from './academic'

describe('academic helpers', () => {
  it('maps dates to the academic year starting in October', () => {
    expect(academicYearOf(new Date(2026, 9, 1))).toBe('2026/27')
    expect(academicYearOf(new Date(2027, 8, 30))).toBe('2026/27')
    expect(academicYearOf(new Date(2026, 8, 30))).toBe('2025/26')
    expect(academicYearOf(new Date(2099, 11, 1))).toBe('2099/00')
  })

  it('offers the current academic year and the five before it', () => {
    expect(academicYearOptions(new Date(2026, 9, 21))).toEqual([
      '2026/27',
      '2025/26',
      '2024/25',
      '2023/24',
      '2022/23',
      '2021/22',
    ])
  })

  it('formats file sizes for people', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(300 * 1024)).toBe('300 KB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})
