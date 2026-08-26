import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getCategoryLabel } from '@/shared/config/categories'
import type { Transaction, TransactionType } from '@/shared/types/transaction'
import { formatCurrency, formatMoney } from '@/shared/utils/format'
import { groupByCategory, sumAmount } from './transactions'

export function CategoryBalanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function CategoryBalance({
  type,
  transactions,
}: {
  type: TransactionType
  transactions: Transaction[]
}) {
  const categories = groupByCategory(transactions)
  const total = sumAmount(transactions)
  const maxAmount = Math.max(...categories.map(([, amount]) => amount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between uppercase">
          <span
            className={type === 'income' ? 'text-base text-emerald-400' : 'text-base text-red-400'}
          >
            {type === 'income' ? 'Receitas' : 'Despesas'} por categoria
          </span>
          <span className="text-base text-zinc-200">{formatCurrency(total)}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {categories.length === 0 && (
          <span className="text-sm text-zinc-500">Nenhum lançamento no período.</span>
        )}
        {categories.map(([category, amount]) => (
          <div key={category} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{getCategoryLabel(category)}</span>
              <span className="text-zinc-200">{formatMoney(amount)}</span>
            </div>
            <Progress
              value={(amount / maxAmount) * 100}
              className={cn(
                '**:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:bg-zinc-800',
                type === 'income'
                  ? '**:data-[slot=progress-indicator]:bg-emerald-400'
                  : '**:data-[slot=progress-indicator]:bg-red-400',
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
