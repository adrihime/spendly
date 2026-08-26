import { cn } from '@/lib/utils'
import { formatMoney } from '@/shared/utils/format'

export function Stat({
  label,
  amount,
  accentClassName = 'text-zinc-300',
}: {
  label: string
  amount: number
  accentClassName?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn('text-xs uppercase tracking-wide', accentClassName)}>{label}</span>
      <span className="text-xl font-semibold text-white">{formatMoney(amount)}</span>
    </div>
  )
}
