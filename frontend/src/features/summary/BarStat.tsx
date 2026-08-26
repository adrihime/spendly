import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/shared/utils/format'

export function BarStat({
  label,
  amount,
  percent,
  indicatorClassName,
}: {
  label: string
  amount: number
  percent: number
  indicatorClassName: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-teal-200">{label}</span>
        <span className="text-white">{formatMoney(amount)}</span>
      </div>
      <Progress
        value={percent}
        className={cn(
          '**:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:bg-white/10',
          indicatorClassName,
        )}
      />
    </div>
  )
}
