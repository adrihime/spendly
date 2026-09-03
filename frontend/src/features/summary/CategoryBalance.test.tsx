import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryBalance } from './CategoryBalance'

describe('CategoryBalance', () => {
  it('lists categories from highest total to lowest', () => {
    render(
      <CategoryBalance type="expense" byCategory={{ carro: 300, cartao: 900, contas: 100 }} />,
    )

    const labels = screen.getAllByText(/^(Carro|Cartão|Contas)$/).map((el) => el.textContent)
    expect(labels).toEqual(['Cartão', 'Carro', 'Contas'])
  })

  it('shows the empty state when there is nothing in the period', () => {
    render(<CategoryBalance type="income" byCategory={{}} />)

    expect(screen.getByText('Nenhum lançamento no período.')).toBeInTheDocument()
    expect(screen.queryByText(/^(Carro|Cartão|Contas)$/)).not.toBeInTheDocument()
  })
})
