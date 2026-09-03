import { describe, expect, it } from 'vitest'
import { expenseKeys, incomeKeys } from './keys'

describe('query key factories', () => {
  it('scopes the list key by month and year', () => {
    expect(expenseKeys.list('08', 2026)).toEqual(['expenses', '08', 2026])
    expect(incomeKeys.list('12', 2026)).toEqual(['income', '12', 2026])
  })

  it('keeps a bare prefix for invalidation', () => {
    expect(expenseKeys.all).toEqual(['expenses'])
    expect(incomeKeys.all).toEqual(['income'])
  })

  it('the list key starts with the prefix', () => {
    expect(expenseKeys.list('01', 2026).slice(0, 1)).toEqual([...expenseKeys.all])
  })
})
