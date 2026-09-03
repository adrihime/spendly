import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getMonthLabel } from '@/shared/config/months'
import { formatCurrency, formatMoney } from '@/shared/utils/format'
import type { Summary } from './api'
import { getResultTier } from './resultTiers'
import { Stat } from './Stat'
import { BarStat } from './BarStat'

export function BalanceCardSkeleton() {
  return (
    <Card className="gap-0">
      <CardContent className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="flex flex-col justify-center gap-2 pb-4 md:pr-6 md:pb-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-col justify-center gap-3 py-4 md:px-6 md:py-0">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4 pt-4 md:pl-6 md:pt-0">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-1.5 w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BalanceCard({
  month,
  summary,
  accumulatedBalance,
  openingBalance,
}: {
  month?: string
  summary: Summary
  accumulatedBalance: number
  openingBalance: number
}) {
  const {
    total_income: income,
    total_expenses: expenses,
    third_party_expenses: thirdParty,
    net_savings: netResult,
  } = summary
  const percentOfIncome = income > 0 ? (netResult / income) * 100 : 0
  const maxValue = Math.max(income, expenses, 1)
  const tier = getResultTier(percentOfIncome)

  return (
    <Card className={cn('gap-0 bg-linear-to-br ring-white/10', tier.gradient)}>
      <CardContent className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="flex flex-col justify-center gap-2 pb-4 md:pr-6 md:pb-0">
          <span className={cn('text-sm uppercase tracking-wide', tier.accent)}>
            Resultado de {month ? getMonthLabel(month) : ''}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-semibold text-white">
              {formatCurrency(netResult, undefined, undefined, {
                maximumFractionDigits: 0,
                signDisplay: 'exceptZero',
              })}
            </span>
            {income > 0 && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tier.badge)}>
                {Math.round(percentOfIncome)}% da renda
              </span>
            )}
          </div>
          <span className="text-sm text-white/60">
            <b>{formatMoney(income)}</b> de renda – <b>{formatMoney(expenses)}</b> de despesas
          </span>
          {thirdParty > 0 && (
            <span className="text-sm text-white/40">
              {formatMoney(thirdParty)} de terceiros (fora da economia)
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 py-4 md:px-6 md:py-0">
          <Stat label="Saldo acumulado" amount={accumulatedBalance} accentClassName={tier.accent} />
          <Stat
            label="Saldo inicial do mês"
            amount={openingBalance}
            accentClassName={tier.accent}
          />
        </div>

        <div className="flex flex-col justify-center gap-4 pt-4 md:pl-6 md:pt-0">
          <BarStat
            label="Renda"
            amount={income}
            percent={(income / maxValue) * 100}
            indicatorClassName="**:data-[slot=progress-indicator]:bg-lime-400"
          />
          <BarStat
            label="Despesas"
            amount={expenses}
            percent={(expenses / maxValue) * 100}
            indicatorClassName="**:data-[slot=progress-indicator]:bg-red-400"
          />
        </div>
      </CardContent>
    </Card>
  )
}
