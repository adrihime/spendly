import MockAdapter from 'axios-mock-adapter'
import { api } from './axios'
import type { Expense, ExpenseCategory, Income, IncomeCategory } from '@/shared/types/transaction'

const cheapExpenseTemplates: Array<{ description: string; category: ExpenseCategory; amount: number; day: string }> = [
  { description: 'Café', category: 'cartao', amount: 12.5, day: '01' },
  { description: 'Uber', category: 'carro', amount: 18.9, day: '02' },
  { description: 'iFood', category: 'cartao', amount: 34.9, day: '02' },
  { description: 'Estacionamento', category: 'carro', amount: 15, day: '03' },
  { description: 'Netflix', category: 'contas', amount: 39.9, day: '03' },
  { description: 'Spotify', category: 'contas', amount: 21.9, day: '04' },
  { description: 'Padaria', category: 'contas', amount: 9.8, day: '04' },
  { description: 'Farmácia', category: 'contas', amount: 27.4, day: '05' },
  { description: 'Uber', category: 'carro', amount: 22.3, day: '06' },
  { description: 'Café', category: 'cartao', amount: 11, day: '07' },
  { description: 'Lavagem do carro', category: 'carro', amount: 45, day: '08' },
  { description: 'iFood', category: 'cartao', amount: 29.9, day: '09' },
  { description: 'Academia', category: 'contas', amount: 89.9, day: '10' },
  { description: 'Estacionamento', category: 'carro', amount: 12, day: '11' },
  { description: 'Padaria', category: 'contas', amount: 14.5, day: '12' },
  { description: 'Café', category: 'cartao', amount: 13.2, day: '13' },
  { description: 'Uber', category: 'carro', amount: 27.6, day: '14' },
  { description: 'Farmácia', category: 'contas', amount: 18.9, day: '15' },
  { description: 'iFood', category: 'cartao', amount: 41.2, day: '16' },
  { description: 'Cinema', category: 'cartao', amount: 32, day: '17' },
]

const cheapIncomeTemplates: Array<{
  description: string
  account: string
  category: IncomeCategory
  amount: number
  day: string
}> = [
  { description: 'Cashback cartão', account: 'Nubank', category: 'venda', amount: 8.4, day: '02' },
  { description: 'Reembolso Uber', account: 'Inter', category: 'pagamento', amount: 22.9, day: '03' },
  { description: 'Venda roupa usada', account: 'Nubank', category: 'venda', amount: 45, day: '05' },
  { description: 'Freela design', account: 'Inter', category: 'pagamento', amount: 180, day: '06' },
  { description: 'Cashback compras', account: 'Nubank', category: 'venda', amount: 12.3, day: '08' },
  { description: 'Reembolso farmácia', account: 'Inter', category: 'pagamento', amount: 18.9, day: '10' },
  { description: 'Venda livro', account: 'Nubank', category: 'venda', amount: 25, day: '12' },
  { description: 'Freela texto', account: 'Inter', category: 'pagamento', amount: 90, day: '14' },
  { description: 'Cashback app', account: 'Nubank', category: 'venda', amount: 6.7, day: '16' },
  { description: 'Reembolso viagem', account: 'Inter', category: 'pagamento', amount: 60, day: '18' },
]

const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Aluguel',
    category: 'contas',
    amount: 1500,
    date: '2026-08-05',
    paid: true,
  },
  {
    id: '2',
    description: 'Fatura do cartão',
    category: 'cartao',
    amount: 3090.5,
    date: '2026-08-10',
    paid: false,
  },
  {
    id: '3',
    description: 'Combustível',
    category: 'carro',
    amount: 320,
    date: '2026-08-15',
    paid: true,
  },
  {
    id: '4',
    description: 'Supermercado',
    category: 'contas',
    amount: 640,
    date: '2026-07-20',
    paid: true,
  },
  {
    id: '5',
    description: 'Manutenção do carro',
    category: 'carro',
    amount: 450,
    date: '2026-07-12',
    paid: true,
  },
  {
    id: '6',
    description: 'Conserto do carro',
    category: 'carro',
    amount: 4200,
    date: '2026-06-08',
    paid: false,
  },
  {
    id: '7',
    description: 'Aluguel',
    category: 'contas',
    amount: 1500,
    date: '2026-06-05',
    paid: true,
  },
  ...cheapExpenseTemplates.map((item, index) => ({
    id: `cheap-expense-${index + 1}`,
    description: item.description,
    category: item.category,
    amount: item.amount,
    date: `2026-08-${item.day}`,
    paid: index % 3 !== 0,
  })),
]

const mockIncome: Income[] = [
  {
    id: '1',
    description: 'Salário',
    account: 'Nubank',
    category: 'salario',
    amount: 6500,
    date: '2026-08-05',
  },
  {
    id: '2',
    description: 'Freelance',
    account: 'Inter',
    category: 'pagamento',
    amount: 1200,
    date: '2026-08-18',
  },
  {
    id: '3',
    description: 'Salário',
    account: 'Nubank',
    category: 'salario',
    amount: 3200,
    date: '2026-06-05',
  },
  {
    id: '4',
    description: 'Salário',
    account: 'Nubank',
    category: 'salario',
    amount: 950,
    date: '2026-07-05',
  },
  ...cheapIncomeTemplates.map((item, index) => ({
    id: `cheap-income-${index + 1}`,
    description: item.description,
    account: item.account,
    category: item.category,
    amount: item.amount,
    date: `2026-08-${item.day}`,
  })),
]

function sumForMonth(items: { amount: number; date: string }[], month: number, year: number) {
  return items
    .filter((item) => {
      const d = new Date(item.date)
      return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year
    })
    .reduce((sum, item) => sum + item.amount, 0)
}

const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL ?? 'gsadriel@gmail.com'
const MOCK_SESSION_KEY = 'spendly-mock-session'

type MockUser = { email: string; name: string | null; picture: string | null }

function loadMockUser(): MockUser | null {
  const raw = localStorage.getItem(MOCK_SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

let mockUser = loadMockUser()

function decodeGoogleCredential(credential: string) {
  const payload = credential.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export function enableApiMock() {
  const mock = new MockAdapter(api, { delayResponse: 300 })

  mock.onPost('/auth/google').reply((config) => {
    const { credential } = JSON.parse(config.data)
    const claims = decodeGoogleCredential(credential)
    if (claims.email !== OWNER_EMAIL || !claims.email_verified) {
      return [403, { detail: 'Account not allowed' }]
    }
    mockUser = { email: claims.email, name: claims.name, picture: claims.picture }
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser))
    return [200, mockUser]
  })

  mock.onPost('/auth/logout').reply(() => {
    mockUser = null
    localStorage.removeItem(MOCK_SESSION_KEY)
    return [200, { ok: true }]
  })

  mock.onGet('/auth/me').reply(() => (mockUser ? [200, mockUser] : [401]))

  mock.onGet('/expenses/').reply(() => [200, mockExpenses])
  mock.onGet('/income/').reply(() => [200, mockIncome])

  mock.onPost('/expenses/').reply((config) => {
    const expense = { id: `expense-${Date.now()}`, ...JSON.parse(config.data) }
    mockExpenses.push(expense)
    return [200, expense]
  })

  mock.onPost('/income/').reply((config) => {
    const income = { id: `income-${Date.now()}`, ...JSON.parse(config.data) }
    mockIncome.push(income)
    return [200, income]
  })

  mock.onPut(/\/expenses\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockExpenses.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    mockExpenses[index] = { ...mockExpenses[index], ...JSON.parse(config.data), id }
    return [200, mockExpenses[index]]
  })

  mock.onPut(/\/income\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockIncome.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    mockIncome[index] = { ...mockIncome[index], ...JSON.parse(config.data), id }
    return [200, mockIncome[index]]
  })

  mock.onDelete(/\/expenses\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockExpenses.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    mockExpenses.splice(index, 1)
    return [204]
  })

  mock.onDelete(/\/income\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockIncome.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    mockIncome.splice(index, 1)
    return [204]
  })

  mock.onGet(/\/summary\/\d+\/\d+/).reply((config) => {
    const [, month, year] = config.url!.match(/\/summary\/(\d+)\/(\d+)/)!
    const totalExpenses = sumForMonth(mockExpenses, Number(month), Number(year))
    const totalIncome = sumForMonth(mockIncome, Number(month), Number(year))

    return [
      200,
      {
        total_expenses: totalExpenses,
        total_income: totalIncome,
        net_savings: totalIncome - totalExpenses,
      },
    ]
  })
}
