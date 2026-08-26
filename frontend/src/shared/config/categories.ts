import type { ExpenseCategory, IncomeCategory } from '@/shared/types/transaction'

const CATEGORY_LABELS: Record<string, string> = {
  carro: 'Carro',
  contas: 'Contas',
  cartao: 'Cartão',
  pagamento: 'Pagamento',
  salario: 'Salário',
  venda: 'Venda',
}

export function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['carro', 'contas', 'cartao']
export const INCOME_CATEGORIES: IncomeCategory[] = ['pagamento', 'salario', 'venda']
