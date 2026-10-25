import { heatClass, heatLegend } from '../lib/heat'

export function HeatLegend() {
  return (
    <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-slate-500" aria-hidden="true">
      Fewer
      {heatLegend.map((count) => (
        <span key={count} className={`size-3.5 rounded ${heatClass(count)}`} />
      ))}
      More
    </div>
  )
}
