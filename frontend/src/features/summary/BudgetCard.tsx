import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getCategoryLabel } from '@/shared/config/categories'
import type { Expense, Transaction, TransactionType } from '@/shared/types/transaction'
import { TransactionRow } from './TransactionRow'
import { TransactionFormDialog } from './TransactionFormDialog'
import { PaidCheckbox, type PaidCheckboxState } from './PaidCheckbox'
import { formatCurrency, formatMoney } from '@/shared/utils/format'
import { updateExpense } from './api'
import { sumAmount } from './transactions'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type SortField = 'description' | 'category' | 'amount' | 'paid'
type SortDir = 'asc' | 'desc'

export function BudgetCardSkeleton() {
  return (
    <Card className="flex flex-col md:h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col min-h-0 gap-3 p-0 px-4 pb-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="grid grid-cols-4 items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10 justify-self-end" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function isPaid(item: Transaction) {
  return item.type === 'expense' && item.paid
}

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string
  field: SortField
  sortField: SortField | null
  sortDir: SortDir
  onSort: (field: SortField) => void
  align?: 'left' | 'right'
}) {
  const isActive = sortField === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 hover:text-zinc-200',
        align === 'right' ? 'justify-end' : 'text-left',
        isActive && 'text-zinc-200',
      )}
    >
      {label}
      {isActive &&
        (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  )
}

export function BudgetCard({
  transactions,
  type,
}: {
  transactions: Transaction[]
  type: TransactionType
}) {
  const queryClient = useQueryClient()
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedTransactions = useMemo(() => {
    if (!sortField) return transactions

    const sorted = [...transactions].sort((a, b) => {
      if (sortField === 'amount') return a.amount - b.amount
      if (sortField === 'paid') return Number(isPaid(a)) - Number(isPaid(b))
      const aValue = sortField === 'category' ? getCategoryLabel(a.category) : a.description
      const bValue = sortField === 'category' ? getCategoryLabel(b.category) : b.description
      return aValue.localeCompare(bValue, 'pt-BR')
    })

    return sortDir === 'asc' ? sorted : sorted.reverse()
  }, [transactions, sortField, sortDir])

  const total = sumAmount(transactions)
  const paidTotal =
    type === 'expense'
      ? sumAmount(transactions.filter((item) => item.type === 'expense' && item.paid))
      : 0
  const unpaidTotal = total - paidTotal

  const bulkPaidState: PaidCheckboxState =
    paidTotal > 0 && unpaidTotal === 0
      ? 'checked'
      : paidTotal === 0
        ? 'unchecked'
        : 'indeterminate'

  const setAllPaid = useMutation<void, Error, boolean, { previous?: Expense[] }>({
    mutationFn: async (paid: boolean) => {
      const targets = transactions.filter((item) => item.type === 'expense' && item.paid !== paid)
      await Promise.all(
        targets.map((item) => {
          if (item.type !== 'expense') return Promise.resolve()
          const { id, ...rest } = item
          return updateExpense(id, { ...rest, paid })
        }),
      )
    },
    onMutate: async (paid) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] })
      const previous = queryClient.getQueryData<Expense[]>(['expenses'])
      const targetIds = new Set(
        transactions.filter((item) => item.type === 'expense').map((item) => item.id),
      )
      queryClient.setQueryData<Expense[]>(['expenses'], (old) =>
        old?.map((item) => (targetIds.has(item.id) ? { ...item, paid } : item)),
      )
      return { previous }
    },
    onSuccess: (_result, paid) => {
      toast.add({
        title: paid ? 'Todas marcadas como pagas' : 'Todas marcadas como pendentes',
        type: 'success',
        timeout: 2000,
      })
    },
    onError: (_error, _paid, context) => {
      if (context?.previous) queryClient.setQueryData(['expenses'], context.previous)
      toast.add({ title: 'Não deu pra atualizar as despesas', type: 'error', timeout: 2500 })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    },
  })

  return (
    <Card className="flex flex-col md:h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between uppercase">
          <span
            className={cn(
              'flex items-center gap-2',
              type === 'income' ? 'text-base text-emerald-400' : 'text-base text-red-400',
            )}
          >
            {type === 'income' ? 'Receitas' : 'Despesas'}
            <TransactionFormDialog type={type} />
          </span>

          <div className="flex items-center gap-3">
            {type === 'expense' && (unpaidTotal > 0 || paidTotal > 0) && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <PaidCheckbox
                      state={bulkPaidState}
                      pending={setAllPaid.isPending}
                      onClick={() => setAllPaid.mutate(bulkPaidState !== 'checked')}
                    />
                  }
                />
                <TooltipContent>
                  {bulkPaidState === 'checked'
                    ? 'Marcar tudo como pendente'
                    : 'Marcar tudo como pago'}
                </TooltipContent>
              </Tooltip>
            )}
            {type === 'expense' && (
              <span className="text-sm font-normal normal-case text-zinc-500">
                {formatMoney(paidTotal)} pagas · {formatMoney(unpaidTotal)} a pagar
              </span>
            )}
            <span className="text-base text-zinc-200">{formatCurrency(total)}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 p-0">
        <div className="hidden border-b border-zinc-700 pb-2 text-sm uppercase text-zinc-400 px-4 md:grid md:grid-cols-4">
          <SortableHeader
            label="Descrição"
            field="description"
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <SortableHeader
            label="Categoria"
            field="category"
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <SortableHeader
            label="Valor"
            field="amount"
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          {type === 'expense' ? (
            <SortableHeader
              label="Ações"
              field="paid"
              sortField={sortField}
              sortDir={sortDir}
              onSort={toggleSort}
              align="right"
            />
          ) : (
            <span className="text-right">Ações</span>
          )}
        </div>

        <div className="scrollbar-thin md:flex-1 md:min-h-0 md:overflow-y-auto">
          {sortedTransactions.map((item) => (
            <TransactionRow key={item.id} transaction={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
