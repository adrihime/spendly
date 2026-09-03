export const expenseKeys = {
  all: ['expenses'] as const,
  list: (month: string, year: number) => ['expenses', month, year] as const,
}

export const incomeKeys = {
  all: ['income'] as const,
  list: (month: string, year: number) => ['income', month, year] as const,
}
