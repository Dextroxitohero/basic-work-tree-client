import type { AuthUser } from './auth'
import { cleanParams, http } from './client'
import type { Page, Permission, SortOrder, UUID } from './types'

export interface UserListParams {
  q?: string
  is_active?: boolean
  sort?: 'email' | 'created_at'
  order?: SortOrder
}

export interface UserUpdate {
  permissions?: Permission[]
  is_active?: boolean
}

export async function listUsers(params: UserListParams, cursor?: string): Promise<Page<AuthUser>> {
  const { data } = await http.get<Page<AuthUser>>('/users', { params: cleanParams({ ...params, after: cursor }) })
  return data
}

export async function updateUser(id: UUID, body: UserUpdate): Promise<AuthUser> {
  return (await http.patch<AuthUser>(`/users/${id}`, body)).data
}
