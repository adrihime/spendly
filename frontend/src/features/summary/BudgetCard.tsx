import { Card } from '@/components/ui/card'
import type { Transaction } from '@/shared/types/transaction'
import { TransactionRow } from './TransactionRow'
import { formatCurrency } from '@/shared/utils/format'

export function BudgetCard({
  transaction,
  type,
}: {
  transaction: Transaction[]
  type: 'income' | 'expense'
}) {
  const total = transaction.reduce((sum, item) => sum + item.amount, 0)
  return (
    <Card className="p-4">
      <span className="uppercase text-base text-zinc-200 flex justify-between">
        <span className="text-xs text-blue-300">{type === 'income' ? 'Receitas' : 'Despesas'}</span>
        <span>{formatCurrency(total)}</span>
      </span>
      <div className="grid grid-cols-3 gap-5 text-xs uppercase text-zinc-400 border-b border-zinc-700 pb-2">
        <span>Descrição</span>
        <span>Categoria</span>
        <span>Valor</span>
      </div>
      {transaction.map((item) => (
        <TransactionRow key={item.id} transaction={item} />
      ))}
    </Card>
  )
}
