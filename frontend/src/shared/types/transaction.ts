export type TransactionType = 'income' | 'expense'

export type ExpenseCategory = 'carro' | 'contas' | 'cartao'
export type IncomeCategory = 'pagamento' | 'salario' | 'venda'

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  paid: boolean
  third_party: boolean
  series_id: string | null
  series_index: number | null
  series_total: number | null
}

export interface ExpenseCreate {
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  paid: boolean
  third_party: boolean
}

export type ExpenseNew = ExpenseCreate & { repeat_months?: number | null }

export type SeriesScope = 'this' | 'future' | 'all'

export interface Income {
  id: string
  description: string
  category: IncomeCategory
  amount: number
  date: string
}

export type IncomeCreate = Omit<Income, 'id'>

export type Transaction = ({ type: 'expense' } & Expense) | ({ type: 'income' } & Income)
