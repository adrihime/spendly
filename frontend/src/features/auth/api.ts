import { api } from '@/shared/lib/axios'

export interface User {
  email: string
  name: string | null
  picture: string | null
}

export async function loginWithGoogle(credential: string) {
  const { data } = await api.post<User>('/auth/google', { credential })
  return data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function getMe() {
  const { data } = await api.get<User>('/auth/me')
  return data
}
