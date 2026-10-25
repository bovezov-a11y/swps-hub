/**
 * Sequential scale for counts on heatmaps: one hue from light to dark, with zero on a neutral surface so empty
 * cells read as "nothing" rather than "a little".
 */
export function heatClass(count: number) {
  if (count <= 0) return 'bg-slate-100 text-slate-400'
  if (count === 1) return 'bg-indigo-100 text-indigo-900'
  if (count === 2) return 'bg-indigo-300 text-indigo-950'
  if (count <= 4) return 'bg-indigo-500 text-white'
  return 'bg-indigo-700 text-white'
}

export const heatLegend = [0, 1, 2, 3, 5]
