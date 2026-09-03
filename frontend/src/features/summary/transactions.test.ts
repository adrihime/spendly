import { describe, expect, it } from 'vitest'
import { sumAmount, withType } from './transactions'
import type { Expense, Income } from '@/shared/types/transaction'

const expense = (over: Partial<Expense> = {}): Expense => ({
  id: '1',
  description: 'Aluguel',
  category: 'contas',
  amount: 1500,
  date: '2026-08-05',
  paid: true,
  ...over,
})

const income = (over: Partial<Income> = {}): Income => ({
  id: '1',
  description: 'Salário',
  account: 'Nubank',
  category: 'salario',
  amount: 6500,
  date: '2026-08-05',
  ...over,
})

describe('withType', () => {
  it('tags each item with the given type and keeps the fields', () => {
    const [row] = withType([expense({ id: '9', amount: 42 })], 'expense')
    expect(row).toMatchObject({ type: 'expense', id: '9', amount: 42, category: 'contas' })
  })

  it('works for income too', () => {
    const [row] = withType([income()], 'income')
    expect(row.type).toBe('income')
  })

  it('returns an empty array for no items', () => {
    expect(withType([], 'expense')).toEqual([])
  })
})

describe('sumAmount', () => {
  it('adds up the amounts', () => {
    expect(sumAmount([{ amount: 10 }, { amount: 2.5 }, { amount: 0 }])).toBe(12.5)
  })

  it('is 0 for an empty list', () => {
    expect(sumAmount([])).toBe(0)
  })
})
