import MockAdapter from 'axios-mock-adapter'
import { api } from './axios'
import type {
  Expense,
  ExpenseCategory,
  Income,
  IncomeCategory,
  RecurringRule,
} from '@/shared/types/transaction'

const cheapExpenseTemplates: Array<{
  description: string
  category: ExpenseCategory
  amount: number
  day: string
}> = [
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
  category: IncomeCategory
  amount: number
  day: string
}> = [
  { description: 'Cashback cartão', category: 'venda', amount: 8.4, day: '02' },
  { description: 'Reembolso Uber', category: 'pagamento', amount: 22.9, day: '03' },
  { description: 'Venda roupa usada', category: 'venda', amount: 45, day: '05' },
  { description: 'Freela design', category: 'pagamento', amount: 180, day: '06' },
  { description: 'Cashback compras', category: 'venda', amount: 12.3, day: '08' },
  { description: 'Reembolso farmácia', category: 'pagamento', amount: 18.9, day: '10' },
  { description: 'Venda livro', category: 'venda', amount: 25, day: '12' },
  { description: 'Freela texto', category: 'pagamento', amount: 90, day: '14' },
  { description: 'Cashback app', category: 'venda', amount: 6.7, day: '16' },
  { description: 'Reembolso viagem', category: 'pagamento', amount: 60, day: '18' },
]

type ExpenseSeed = Partial<Expense> &
  Pick<Expense, 'id' | 'description' | 'category' | 'amount' | 'date'>

function makeExpense(seed: ExpenseSeed): Expense {
  return {
    paid: false,
    third_party: false,
    series_id: null,
    series_index: null,
    series_total: null,
    detached: false,
    ...seed,
  }
}

type IncomeSeed = Partial<Income> &
  Pick<Income, 'id' | 'description' | 'category' | 'amount' | 'date'>

function makeIncome(seed: IncomeSeed): Income {
  return {
    series_id: null,
    series_index: null,
    series_total: null,
    detached: false,
    ...seed,
  }
}

const mockRules: RecurringRule[] = []

const mockExpenses: Expense[] = [
  makeExpense({
    id: '1',
    description: 'Aluguel',
    category: 'contas',
    amount: 1500,
    date: '2026-08-05',
    paid: true,
  }),
  makeExpense({
    id: '2',
    description: 'Fatura do cartão',
    category: 'cartao',
    amount: 3090.5,
    date: '2026-08-10',
  }),
  makeExpense({
    id: '3',
    description: 'Combustível',
    category: 'carro',
    amount: 320,
    date: '2026-08-15',
    paid: true,
  }),
  makeExpense({
    id: '4',
    description: 'Compras da irmã',
    category: 'cartao',
    amount: 280,
    date: '2026-08-16',
    third_party: true,
  }),
  makeExpense({
    id: '5',
    description: 'Supermercado',
    category: 'contas',
    amount: 640,
    date: '2026-07-20',
    paid: true,
  }),
  makeExpense({
    id: '6',
    description: 'Conserto do carro',
    category: 'carro',
    amount: 4200,
    date: '2026-06-08',
  }),
  makeExpense({
    id: '7',
    description: 'Aluguel',
    category: 'contas',
    amount: 1500,
    date: '2026-06-05',
    paid: true,
  }),
  ...cheapExpenseTemplates.map((item, index) =>
    makeExpense({
      id: `cheap-expense-${index + 1}`,
      description: item.description,
      category: item.category,
      amount: item.amount,
      date: `2026-08-${item.day}`,
      paid: index % 3 !== 0,
    }),
  ),
]

const mockIncome: Income[] = [
  makeIncome({ id: '1', description: 'Salário', category: 'salario', amount: 6500, date: '2026-08-05' }),
  makeIncome({ id: '2', description: 'Freelance', category: 'pagamento', amount: 1200, date: '2026-08-18' }),
  makeIncome({ id: '3', description: 'Salário', category: 'salario', amount: 3200, date: '2026-06-05' }),
  makeIncome({ id: '4', description: 'Salário', category: 'salario', amount: 950, date: '2026-07-05' }),
  ...cheapIncomeTemplates.map((item, index) =>
    makeIncome({
      id: `cheap-income-${index + 1}`,
      description: item.description,
      category: item.category,
      amount: item.amount,
      date: `2026-08-${item.day}`,
    }),
  ),
]

function isInMonth(date: string, month: number, year: number) {
  const d = new Date(date)
  return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year
}

function groupByCategory(items: { category: string; amount: number }[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})
}

function sumBefore(items: { amount: number; date: string }[], start: Date) {
  return items
    .filter((item) => new Date(item.date) < start)
    .reduce((sum, item) => sum + item.amount, 0)
}

function filterByPeriod<T extends { date: string }>(items: T[], params: unknown): T[] {
  const { month, year } = (params ?? {}) as { month?: number; year?: number }
  if (!month || !year) return items
  return items.filter((item) => isInMonth(item.date, Number(month), Number(year)))
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDate()
  d.setUTCMonth(d.getUTCMonth() + n)
  if (d.getUTCDate() < day) d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}

const MOCK_HORIZON = 18

function buildSeries<T extends { date: string }>(
  fields: Record<string, unknown>,
  repeat: number | null,
  make: (seed: Record<string, unknown>) => T,
): { rows: T[]; seriesId: string; total: number | null } {
  const seriesId = `series-${Date.now()}`
  const indefinite = repeat === null
  const count = indefinite ? MOCK_HORIZON : (repeat as number)
  const rows = Array.from({ length: count }, (_, i) =>
    make({
      ...fields,
      id: `${seriesId}-${i + 1}`,
      date: addMonths(fields.date as string, i),
      paid: false,
      series_id: seriesId,
      series_index: i + 1,
      series_total: indefinite ? null : count,
    }),
  )
  return { rows, seriesId, total: indefinite ? null : count }
}

function registerRule(
  seriesId: string,
  kind: 'expense' | 'income',
  fields: Record<string, unknown>,
  total: number | null,
) {
  mockRules.push({
    id: seriesId,
    kind,
    description: fields.description as string,
    amount: fields.amount as number,
    category: fields.category as string,
    third_party: Boolean(fields.third_party),
    day_of_month: Number((fields.date as string).slice(8, 10)),
    start_month: (fields.date as string).slice(0, 7) + '-01',
    first_index: 1,
    total_occurrences: total,
    end_month: null,
  })
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

  mock.onGet('/expenses/').reply((config) => [200, filterByPeriod(mockExpenses, config.params)])
  mock.onGet('/income/').reply((config) => [200, filterByPeriod(mockIncome, config.params)])

  mock.onPost('/expenses/').reply((config) => {
    const { repeat_months: repeat, ...fields } = JSON.parse(config.data)

    if (!repeat || repeat === 1) {
      const expense = makeExpense({ ...fields, id: `expense-${Date.now()}` })
      mockExpenses.push(expense)
      return [200, [expense]]
    }

    const { rows, seriesId, total } = buildSeries(fields, repeat, (seed) =>
      makeExpense(seed as ExpenseSeed),
    )
    mockExpenses.push(...rows)
    registerRule(seriesId, 'expense', fields, total)
    return [200, rows]
  })

  mock.onPost('/income/').reply((config) => {
    const { repeat_months: repeat, ...fields } = JSON.parse(config.data)

    if (!repeat || repeat === 1) {
      const income = makeIncome({ ...fields, id: `income-${Date.now()}` })
      mockIncome.push(income)
      return [200, [income]]
    }

    const { rows, seriesId, total } = buildSeries(fields, repeat, (seed) =>
      makeIncome(seed as IncomeSeed),
    )
    mockIncome.push(...rows)
    registerRule(seriesId, 'income', fields, total)
    return [200, rows]
  })

  mock.onGet('/rules/').reply(() => [200, mockRules])

  mock.onPatch(/\/rules\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const scope = (config.params?.scope as string) ?? 'future'
    const rule = mockRules.find((r) => r.id === id)
    if (!rule) return [404]

    const patch = JSON.parse(config.data) as Partial<RecurringRule>
    Object.assign(rule, patch)

    const rows = rule.kind === 'income' ? mockIncome : mockExpenses
    const nowMonth = new Date().toISOString().slice(0, 7)
    for (const row of rows) {
      if (row.series_id !== id || row.detached) continue
      if (scope === 'future' && row.date.slice(0, 7) < nowMonth) continue
      if (scope === 'future' && 'paid' in row && row.paid) continue
      if (patch.description !== undefined) row.description = patch.description
      if (patch.amount !== undefined) row.amount = patch.amount
      if (patch.category !== undefined) row.category = patch.category as never
    }
    return [200, rule]
  })

  mock.onPut(/\/expenses\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockExpenses.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    const current = mockExpenses[index]
    mockExpenses[index] = {
      ...current,
      ...JSON.parse(config.data),
      id,
      detached: current.series_id ? true : current.detached,
    }
    return [200, mockExpenses[index]]
  })

  mock.onPut(/\/income\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const index = mockIncome.findIndex((item) => item.id === id)
    if (index === -1) return [404]

    const current = mockIncome[index]
    mockIncome[index] = {
      ...current,
      ...JSON.parse(config.data),
      id,
      detached: current.series_id ? true : current.detached,
    }
    return [200, mockIncome[index]]
  })

  mock.onDelete(/\/expenses\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const scope = (config.params?.scope as string) ?? 'this'
    const target = mockExpenses.find((item) => item.id === id)
    if (!target) return [404]

    let remove: Set<string>
    if (scope === 'this' || !target.series_id) {
      remove = new Set([target.id])
    } else {
      const inSeries = mockExpenses.filter((item) => item.series_id === target.series_id)
      const picked =
        scope === 'future'
          ? inSeries.filter((item) => (item.series_index ?? 0) >= (target.series_index ?? 0))
          : inSeries
      remove = new Set(picked.map((item) => item.id))
    }

    for (let i = mockExpenses.length - 1; i >= 0; i--) {
      if (remove.has(mockExpenses[i].id)) mockExpenses.splice(i, 1)
    }
    return [204]
  })

  mock.onDelete(/\/income\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').filter(Boolean).pop()
    const scope = (config.params?.scope as string) ?? 'this'
    const target = mockIncome.find((item) => item.id === id)
    if (!target) return [404]

    let remove: Set<string>
    if (scope === 'this' || !target.series_id) {
      remove = new Set([target.id])
    } else {
      const inSeries = mockIncome.filter((item) => item.series_id === target.series_id)
      const picked =
        scope === 'future'
          ? inSeries.filter((item) => (item.series_index ?? 0) >= (target.series_index ?? 0))
          : inSeries
      remove = new Set(picked.map((item) => item.id))
    }

    for (let i = mockIncome.length - 1; i >= 0; i--) {
      if (remove.has(mockIncome[i].id)) mockIncome.splice(i, 1)
    }
    return [204]
  })

  mock.onGet(/\/summary\/\d+\/\d+/).reply((config) => {
    const [, month, year] = config.url!.match(/\/summary\/(\d+)\/(\d+)/)!
    const monthExpenses = filterByPeriod(mockExpenses, { month: Number(month), year: Number(year) })
    const monthIncome = filterByPeriod(mockIncome, { month: Number(month), year: Number(year) })
    const totalExpenses = monthExpenses.reduce((sum, item) => sum + item.amount, 0)
    const thirdPartyExpenses = monthExpenses
      .filter((item) => item.third_party)
      .reduce((sum, item) => sum + item.amount, 0)
    const totalIncome = monthIncome.reduce((sum, item) => sum + item.amount, 0)
    const netSavings = totalIncome - (totalExpenses - thirdPartyExpenses)

    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    const ownExpensesBefore = mockExpenses.filter((item) => !item.third_party)
    const openingBalance = sumBefore(mockIncome, start) - sumBefore(ownExpensesBefore, start)

    return [
      200,
      {
        total_expenses: totalExpenses,
        third_party_expenses: thirdPartyExpenses,
        total_income: totalIncome,
        net_savings: netSavings,
        expenses_by_category: groupByCategory(monthExpenses),
        income_by_category: groupByCategory(monthIncome),
        opening_balance: openingBalance,
        accumulated_balance: openingBalance + netSavings,
      },
    ]
  })
}
