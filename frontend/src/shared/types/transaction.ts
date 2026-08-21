export type ExpenseCategory = "carro" | "contas" | "cartao"
export type IncomeCategory = "pagamento" | "salario" | "venda"

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
}

export type ExpenseCreate = Omit<Expense, "id">

export interface Income {
  id: string
  description: string
  account: string
  category: IncomeCategory
  amount: number
  date: string
}

export type IncomeCreate = Omit<Income, "id">

export type Transaction =
  | ({ type: "expense" } & Expense)
  | ({ type: "income" } & Income)
