import { api } from '@/shared/lib/axios'
import type {
  Expense,
  ExpenseCreate,
  ExpenseNew,
  Income,
  IncomeCreate,
  SeriesScope,
} from '@/shared/types/transaction'

export interface Summary {
  total_expenses: number
  third_party_expenses: number
  total_income: number
  net_savings: number
  expenses_by_category: Record<string, number>
  income_by_category: Record<string, number>
  opening_balance: number
  accumulated_balance: number
}

export async function listExpenses(month: string, year: number) {
  const { data } = await api.get<Expense[]>('/expenses/', {
    params: { month: Number(month), year },
  })
  return data
}

export async function listIncome(month: string, year: number) {
  const { data } = await api.get<Income[]>('/income/', {
    params: { month: Number(month), year },
  })
  return data
}

export async function getSummary(month: number, year: number) {
  const { data } = await api.get<Summary>(`/summary/${month}/${year}`)
  return data
}

export async function createExpense(expense: ExpenseNew) {
  const { data } = await api.post<Expense[]>('/expenses/', expense)
  return data
}

export async function createIncome(income: IncomeCreate) {
  const { data } = await api.post<Income>('/income/', income)
  return data
}

export async function updateExpense(id: string, expense: ExpenseCreate) {
  const { data } = await api.put<Expense>(`/expenses/${id}`, expense)
  return data
}

export async function updateIncome(id: string, income: IncomeCreate) {
  const { data } = await api.put<Income>(`/income/${id}`, income)
  return data
}

export async function deleteExpense(id: string, scope: SeriesScope = 'this') {
  await api.delete(`/expenses/${id}`, { params: { scope } })
}

export async function deleteIncome(id: string) {
  await api.delete(`/income/${id}`)
}
