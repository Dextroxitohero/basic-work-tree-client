import { cleanParams, http } from './client'
import type { JobTitle, JobTitleCreate, JobTitleListParams, JobTitleUpdate, UUID } from './types'

// El catálogo no se pagina: es corto y los selects lo necesitan completo.
export async function listJobTitles(params: JobTitleListParams): Promise<JobTitle[]> {
  return (await http.get<JobTitle[]>('/job-titles', { params: cleanParams(params) })).data
}

export async function createJobTitle(body: JobTitleCreate): Promise<JobTitle> {
  return (await http.post<JobTitle>('/job-titles', body)).data
}

export async function updateJobTitle(id: UUID, body: JobTitleUpdate): Promise<JobTitle> {
  return (await http.patch<JobTitle>(`/job-titles/${id}`, body)).data
}
