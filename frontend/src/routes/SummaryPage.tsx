import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BalanceCard, BalanceCardSkeleton } from '@/features/summary/BalanceCard'
import { BudgetCard, BudgetCardSkeleton } from '@/features/summary/BudgetCard'
import { CategoryBalance, CategoryBalanceSkeleton } from '@/features/summary/CategoryBalance'
import { MonthSelector } from '@/features/summary/MonthSelector'
import { getSummary, listExpenses, listIncome, type Summary } from '@/features/summary/api'
import { expenseKeys, incomeKeys } from '@/features/summary/keys'
import { withType } from '@/features/summary/transactions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const YEAR = 2026
const EMPTY_SUMMARY: Summary = {
  total_income: 0,
  total_expenses: 0,
  third_party_expenses: 0,
  net_savings: 0,
  expenses_by_category: {},
  income_by_category: {},
  opening_balance: 0,
  accumulated_balance: 0,
}
const FADE = 'animate-in fade-in duration-300'

export function SummaryPage() {
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))

  const { data: expenses = [], isPending: isExpensesPending } = useQuery({
    queryKey: expenseKeys.list(month, YEAR),
    queryFn: () => listExpenses(month, YEAR),
    placeholderData: keepPreviousData,
  })
  const { data: income = [], isPending: isIncomePending } = useQuery({
    queryKey: incomeKeys.list(month, YEAR),
    queryFn: () => listIncome(month, YEAR),
    placeholderData: keepPreviousData,
  })
  const { data: summary = EMPTY_SUMMARY, isPending: isSummaryPending } = useQuery({
    queryKey: ['summary', month, YEAR],
    queryFn: () => getSummary(Number(month), YEAR),
    placeholderData: keepPreviousData,
  })

  const isLoading = isExpensesPending || isIncomePending || isSummaryPending

  const incomeTransactions = withType(income, 'income')
  const expenseTransactions = withType(expenses, 'expense')

  const openingBalance = summary.opening_balance
  const accumulatedBalance = summary.accumulated_balance

  return (
    <Tabs defaultValue="mes" className="flex-1 min-h-0">
      <TabsList>
        <TabsTrigger value="mes">Mês</TabsTrigger>
        <TabsTrigger value="ano">Ano</TabsTrigger>
      </TabsList>

      <TabsContent value="mes" className="flex flex-col gap-4 min-h-0">
        <MonthSelector month={month} onChange={setMonth} />

        <div className={FADE} key={isLoading ? 'balance-skeleton' : 'balance-card'}>
          {isLoading ? (
            <BalanceCardSkeleton />
          ) : (
            <BalanceCard
              month={month}
              summary={summary}
              accumulatedBalance={accumulatedBalance}
              openingBalance={openingBalance}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 w-full md:grid-cols-2 md:min-h-0 md:flex-1">
          {isLoading ? (
            <>
              <BudgetCardSkeleton />
              <BudgetCardSkeleton />
            </>
          ) : (
            <>
              <BudgetCard
                type="income"
                month={month}
                year={YEAR}
                transactions={incomeTransactions}
              />
              <BudgetCard
                type="expense"
                month={month}
                year={YEAR}
                transactions={expenseTransactions}
              />
            </>
          )}
        </div>

        <div
          className={`grid grid-cols-1 gap-4 w-full md:grid-cols-2 ${FADE}`}
          key={isLoading ? 'category-skeleton' : 'category-cards'}
        >
          {isLoading ? (
            <>
              <CategoryBalanceSkeleton />
              <CategoryBalanceSkeleton />
            </>
          ) : (
            <>
              <CategoryBalance type="income" byCategory={summary.income_by_category} />
              <CategoryBalance type="expense" byCategory={summary.expenses_by_category} />
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="ano" className="min-h-0" />
    </Tabs>
  )
}
