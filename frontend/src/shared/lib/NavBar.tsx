import { useEffect, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import type { User } from '@/features/auth/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateShort, formatTime } from '../utils/format'

function getInitials(user: User) {
  const source = user.name?.trim() || user.email
  const parts = source.split(/\s+/).filter(Boolean)
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return initials.toUpperCase()
}

export function NavBar({
  user,
  isPending,
  onLogout,
}: {
  user?: User
  isPending?: boolean
  onLogout: () => void
}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full text-2xl pb-4 px-2 flex items-center">
      <span>Spendly</span>
      <div className="ml-auto flex gap-4 items-center text-zinc-300 font-mono">
        <span className="hidden uppercase text-base md:inline">{formatDate(now)}</span>
        <span className="uppercase text-base md:hidden">{formatDateShort(now)}</span>
        <span className="uppercase text-base">{formatTime(now)}</span>
        {isPending && (
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 outline-none">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? user.email}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-sm font-semibold text-white">
                  {getInitials(user)}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
