import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from '@/components/ui/toast'
import { getMe, loginWithGoogle, logout as logoutRequest, type User } from './api'

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  })

  const login = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (user: User) => queryClient.setQueryData(['me'], user),
    onError: (error) => {
      const forbidden = isAxiosError(error) && error.response?.status === 403
      toast.add({
        title: 'Acesso negado',
        description: forbidden
          ? 'Essa conta Google não tem permissão pra acessar o Spendly.'
          : 'Não deu pra entrar. Tenta de novo.',
        type: 'error',
        timeout: 4000,
      })
    },
  })

  const logout = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => queryClient.setQueryData(['me'], undefined),
  })

  return { user, isPending, login, logout }
}
