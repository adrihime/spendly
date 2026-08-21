import type { Transaction } from '@/shared/types/transaction'
import { formatCurrency } from '@/shared/utils/format'

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      <span className="name">{transaction.description}</span>
      <span className="name">{transaction.category}</span>
      <span className="name">{formatCurrency(transaction.amount)}</span>
    </div>
  )
}
