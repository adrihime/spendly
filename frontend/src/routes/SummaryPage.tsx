import { BudgetCard } from '../features/summary/BudgetCard'
import type { Transaction } from '@/shared/types/transaction'

const incomeTransactions: Transaction[] = [
  {
    type: 'income',
    id: '1',
    description: 'Salário',
    account: 'Nubank',
    category: 'salario',
    amount: 2000,
    date: new Date().toISOString(),
  },
]

const expenseTransactions: Transaction[] = [
  {
    type: 'expense',
    id: '2',
    description: 'Cartão',
    category: 'cartao',
    amount: 1500,
    date: new Date().toISOString(),
  },
]

export function SummaryPage() {
  return (
    <div className="flex">
      <div className="grid grid-cols-2 gap-4 w-full">
        <BudgetCard type="income" transaction={incomeTransactions} />
        <BudgetCard type="expense" transaction={expenseTransactions} />
      </div>
    </div>
  )
}
