import { http } from './client'
import type { Permission, UUID } from './types'

export interface AuthUser {
  id: UUID
  email: string
  full_name: string | null
  is_active: boolean
  permissions: Permission[]
}

export interface AuthSession {
  access_token: string
  token_type: 'bearer'
  /** Segundos hasta que expira el token. */
  expires_in: number
  user: AuthUser
}

export interface LoginBody {
  email: string
  password: string
}

export interface SignupBody extends LoginBody {
  full_name: string
}

export async function login(body: LoginBody): Promise<AuthSession> {
  return (await http.post<AuthSession>('/auth/login', body)).data
}

export async function signup(body: SignupBody): Promise<AuthSession> {
  return (await http.post<AuthSession>('/auth/signup', body)).data
}

export async function fetchMe(): Promise<AuthUser> {
  return (await http.get<AuthUser>('/auth/me')).data
}
