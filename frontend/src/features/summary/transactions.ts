import type { Expense, Income, Transaction, TransactionType } from '@/shared/types/transaction'

function isInMonth(date: string, month: string, year: number) {
  const d = new Date(date)
  return d.getUTCMonth() + 1 === Number(month) && d.getUTCFullYear() === year
}

export function toMonthlyTransactions(
  items: (Expense | Income)[],
  type: TransactionType,
  month: string,
  year: number,
): Transaction[] {
  return items
    .filter((item) => isInMonth(item.date, month, year))
    .map((item) => ({ type, ...item })) as Transaction[]
}

export function sumAmount(transactions: { amount: number }[]) {
  return transactions.reduce((sum, item) => sum + item.amount, 0)
}

export function groupByCategory(transactions: { category: string; amount: number }[]) {
  const totals = transactions.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})

  return Object.entries(totals).sort(([, a], [, b]) => b - a)
}
