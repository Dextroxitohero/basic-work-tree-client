import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/api/keys'
import { listUsers, updateUser, type UserListParams, type UserUpdate } from '@/api/users'
import type { UUID } from '@/api/types'
import { useAuthStore } from '@/features/auth/store'
import { notify } from '@/lib/notify'

export function useUserList(params: UserListParams) {
  return useInfiniteQuery({
    queryKey: keys.users.list(params),
    queryFn: ({ pageParam }) => listUsers(params, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    placeholderData: keepPreviousData,
  })
}

export function useUpdateUser(id: UUID) {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: (body: UserUpdate) => updateUser(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.users.all })
      // Si el usuario editado es quien está en sesión, sus permisos cambiaron: se vuelven a pedir.
      if (me?.id === id) void qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      notify.success('Usuario actualizado')
    },
  })
}
