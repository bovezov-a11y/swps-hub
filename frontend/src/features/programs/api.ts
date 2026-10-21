import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Program } from '../../lib/types'

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: () => api<Program[]>('/programs'),
    staleTime: 5 * 60_000,
  })
}
