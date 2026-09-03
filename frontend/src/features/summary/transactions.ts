import type { Expense, Income, Transaction, TransactionType } from '@/shared/types/transaction'

export function withType(items: (Expense | Income)[], type: TransactionType): Transaction[] {
  return items.map((item) => ({ type, ...item })) as Transaction[]
}

export function sumAmount(transactions: { amount: number }[]) {
  return transactions.reduce((sum, item) => sum + item.amount, 0)
}
