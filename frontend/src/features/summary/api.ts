import { api } from '@/shared/lib/axios'
import type { Expense, ExpenseCreate, Income, IncomeCreate } from '@/shared/types/transaction'

export interface Summary {
  total_expenses: number
  total_income: number
  net_savings: number
}

export async function listExpenses() {
  const { data } = await api.get<Expense[]>('/expenses/')
  return data
}

export async function listIncome() {
  const { data } = await api.get<Income[]>('/income/')
  return data
}

export async function getSummary(month: number, year: number) {
  const { data } = await api.get<Summary>(`/summary/${month}/${year}`)
  return data
}

export async function createExpense(expense: ExpenseCreate) {
  const { data } = await api.post<Expense>('/expenses/', expense)
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

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`)
}

export async function deleteIncome(id: string) {
  await api.delete(`/income/${id}`)
}
