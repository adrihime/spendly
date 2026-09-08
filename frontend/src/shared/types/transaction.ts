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
  detached: boolean
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
export type RuleScope = 'future' | 'all'

export interface Income {
  id: string
  description: string
  category: IncomeCategory
  amount: number
  date: string
  series_id: string | null
  series_index: number | null
  series_total: number | null
  detached: boolean
}

export interface IncomeCreate {
  description: string
  category: IncomeCategory
  amount: number
  date: string
}

export type IncomeNew = IncomeCreate & { repeat_months?: number | null }

export interface RecurringRule {
  id: string
  kind: TransactionType
  description: string
  amount: number
  category: string
  third_party: boolean
  day_of_month: number
  start_month: string
  first_index: number
  total_occurrences: number | null
  end_month: string | null
}

export interface RuleUpdate {
  description?: string
  amount?: number
  category?: string
  third_party?: boolean
}

export type Transaction = ({ type: 'expense' } & Expense) | ({ type: 'income' } & Income)
