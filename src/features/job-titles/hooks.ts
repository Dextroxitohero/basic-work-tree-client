import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJobTitle, listJobTitles, updateJobTitle } from '@/api/job-titles'
import { keys } from '@/api/keys'
import type { JobTitleCreate, JobTitleListParams, JobTitleUpdate, UUID } from '@/api/types'
import { notify } from '@/lib/notify'

/** El catálogo no se pagina: es corto y los selects lo necesitan completo. */
export function useJobTitles(params: JobTitleListParams = {}) {
  return useQuery({
    queryKey: keys.jobTitles.list(params),
    queryFn: () => listJobTitles(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateJobTitle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: JobTitleCreate) => createJobTitle(body),
    onSuccess: (title) => {
      void qc.invalidateQueries({ queryKey: keys.jobTitles.all })
      notify.success('Puesto creado', title.name)
    },
  })
}

export function useUpdateJobTitle(id: UUID) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: JobTitleUpdate) => updateJobTitle(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.jobTitles.all })
      // El nombre del puesto aparece en las fichas.
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      notify.success('Cambios guardados')
    },
  })
}
