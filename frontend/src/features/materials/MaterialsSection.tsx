import { useState } from 'react'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { academicYearOptions, materialTypeOrder, materialTypes } from '../../lib/academic'
import type { CourseDetail, Material } from '../../lib/types'
import { useDeleteMaterial, useMaterials, useVote, type MaterialFilters } from './api'
import { MaterialCard } from './MaterialCard'
import { UploadForm } from './UploadForm'

export function MaterialsSection({ course }: { course: CourseDetail }) {
  const [filters, setFilters] = useState<MaterialFilters>({ type: '', year: '', sort: 'top' })
  const [isUploading, setIsUploading] = useState(false)
  const [years] = useState(() => academicYearOptions())
  const materials = useMaterials(course.id, filters)
  const vote = useVote(course.id)
  const deleteMaterial = useDeleteMaterial()

  const remove = (material: Material) => {
    if (window.confirm(`Delete "${material.title}"? It will be removed for everyone.`)) {
      deleteMaterial.mutate(material.id)
    }
  }

  const typeChips: { value: MaterialFilters['type']; label: string }[] = [
    { value: '', label: 'All' },
    ...materialTypeOrder.map((type) => ({ value: type, label: materialTypes[type].plural })),
  ]
  const isFiltered = filters.type !== '' || filters.year !== ''

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Material type">
          {typeChips.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              aria-pressed={filters.type === chip.value}
              onClick={() => setFilters({ ...filters, type: chip.value })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filters.type === chip.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {!isUploading && <Button onClick={() => setIsUploading(true)}>Share a file</Button>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={filters.year}
          onChange={(event) => setFilters({ ...filters, year: event.target.value })}
          aria-label="Academic year"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">All years</option>
          {years.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(event) => setFilters({ ...filters, sort: event.target.value as MaterialFilters['sort'] })}
          aria-label="Sort by"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="top">Most helpful</option>
          <option value="new">Newest</option>
        </select>
        {materials.isFetching && !materials.isPending && <Spinner className="size-4 text-indigo-600" />}
      </div>

      {isUploading && (
        <div className="mt-5">
          <UploadForm courseId={course.id} onDone={() => setIsUploading(false)} />
        </div>
      )}

      <div className="mt-6">
        {materials.isPending ? (
          <div className="flex justify-center py-10 text-indigo-600">
            <Spinner />
          </div>
        ) : materials.isError ? (
          <ErrorState text="Could not load materials." />
        ) : materials.data.length === 0 ? (
          <EmptyState
            title={isFiltered ? 'Nothing matches these filters' : 'No materials yet'}
            text={
              isFiltered
                ? 'Try another type or year.'
                : 'Have notes or last year’s exam? Share them and help everyone who takes this course after you.'
            }
            action={
              !isFiltered && !isUploading ? (
                <Button onClick={() => setIsUploading(true)}>Share the first file</Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {materials.data.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onVote={(voted) => vote.mutate({ material, voted })}
                onDelete={() => remove(material)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
