import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EXPENSE_CATEGORIES, getCategoryLabel, INCOME_CATEGORIES } from '@/shared/config/categories'
import type {
  Expense,
  ExpenseCategory,
  Income,
  IncomeCategory,
  Transaction,
} from '@/shared/types/transaction'
import { formatCurrency } from '@/shared/utils/format'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { deleteExpense, deleteIncome, updateExpense, updateIncome } from './api'
import { expenseKeys, incomeKeys } from './keys'
import { EditableCell } from './EditableCell'
import { PaidCheckbox } from './PaidCheckbox'
import { Copy, Trash } from 'lucide-react'

interface TransactionPatch {
  description?: string
  category?: string
  amount?: number
  paid?: boolean
}

export function TransactionRow({
  transaction,
  month,
  year,
}: {
  transaction: Transaction
  month: string
  year: number
}) {
  const queryClient = useQueryClient()

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    queryClient.invalidateQueries({ queryKey: incomeKeys.all })
    queryClient.invalidateQueries({ queryKey: ['summary'] })
  }

  const listKey =
    transaction.type === 'income' ? incomeKeys.list(month, year) : expenseKeys.list(month, year)

  const updateTransaction = useMutation<
    Expense | Income,
    Error,
    TransactionPatch,
    { previous?: (Expense | Income)[] }
  >({
    mutationFn: (patch) => {
      if (transaction.type === 'income') {
        const { id, ...rest } = transaction
        return updateIncome(id, {
          ...rest,
          ...patch,
          category: (patch.category as IncomeCategory) ?? rest.category,
        })
      }
      const { id, ...rest } = transaction
      return updateExpense(id, {
        ...rest,
        ...patch,
        category: (patch.category as ExpenseCategory) ?? rest.category,
      })
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<(Expense | Income)[]>(listKey)
      queryClient.setQueryData<(Expense | Income)[]>(listKey, (old) =>
        old?.map((item) =>
          item.id === transaction.id ? ({ ...item, ...patch } as Expense | Income) : item,
        ),
      )
      return { previous }
    },
    onSuccess: () => {
      toast.add({ title: 'Transação atualizada', type: 'success', timeout: 2000 })
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      toast.add({ title: 'Não deu pra atualizar a transação', type: 'error', timeout: 2500 })
    },
    onSettled: () => {
      invalidateAll()
    },
  })

  const deleteTransaction = useMutation<void, Error, void>({
    mutationFn: () => {
      return transaction.type === 'income'
        ? deleteIncome(transaction.id)
        : deleteExpense(transaction.id)
    },
    onSuccess: () => {
      invalidateAll()
      toast.add({ title: 'Transação excluída', type: 'success', timeout: 2000 })
    },
    onError: () => {
      toast.add({ title: 'Não deu pra excluir a transação', type: 'error', timeout: 2500 })
    },
  })

  function confirmDelete() {
    toast.add({
      title: 'Excluir transação?',
      description: transaction.description,
      type: 'warning',
      timeout: 6000,
      actionProps: {
        children: 'Excluir',
        onClick: () => deleteTransaction.mutate(),
      },
    })
  }

  function saveDescription(value: string) {
    const description = value.trim()
    if (!description) return
    updateTransaction.mutate({ description })
  }

  function saveAmount(value: string) {
    const amount = Number(value.replace(',', '.'))
    if (!Number.isFinite(amount)) return
    updateTransaction.mutate({ amount })
  }

  function togglePaid() {
    if (transaction.type !== 'expense') return
    updateTransaction.mutate({ paid: !transaction.paid })
  }

  function copyAmount() {
    navigator.clipboard.writeText(transaction.amount.toString())
    toast.add({ title: 'Valor copiado', type: 'success', timeout: 2000 })
  }

  const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const isThirdParty = transaction.type === 'expense' && transaction.third_party

  const descriptionCell = (
    <EditableCell
      value={transaction.description}
      displayValue={
        <span className="flex items-center gap-2">
          {transaction.description}
          {isThirdParty && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-400">terceiro</span>
          )}
        </span>
      }
      onSave={saveDescription}
      disabled={updateTransaction.isPending}
    />
  )

  const categoryCell = (
    <Select
      value={transaction.category}
      onValueChange={(value) => updateTransaction.mutate({ category: value as string })}
    >
      <SelectTrigger className="border-none bg-transparent px-2 text-xs text-zinc-300 uppercase hover:text-zinc-200">
        <SelectValue>{(value: string) => getCategoryLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {getCategoryLabel(category)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const amountCell = (
    <div className="text-zinc-300 text-base">
      <EditableCell
        value={String(transaction.amount)}
        displayValue={formatCurrency(transaction.amount)}
        onSave={saveAmount}
        disabled={updateTransaction.isPending}
        inputMode="decimal"
      />
    </div>
  )

  const actionsCell = (
    <div className="flex justify-end gap-3 items-center">
      {transaction.type === 'expense' && (
        <Tooltip>
          <TooltipTrigger
            render={
              <PaidCheckbox
                state={transaction.paid ? 'checked' : 'unchecked'}
                pending={updateTransaction.isPending}
                onClick={togglePaid}
                label={
                  <span className="w-16 whitespace-nowrap text-left">
                    {transaction.paid ? 'Pago' : 'Pendente'}
                  </span>
                }
              />
            }
          />
          <TooltipContent>
            {transaction.paid ? 'Marcar como pendente' : 'Marcar como pago'}
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger render={<Copy onClick={copyAmount} className="w-4 h-4 cursor-pointer" />} />
        <TooltipContent>Copiar valor</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Trash
              onClick={confirmDelete}
              className={cn(
                'w-4 h-4 cursor-pointer hover:text-red-600',
                deleteTransaction.isPending && 'pointer-events-none opacity-50 animate-pulse',
              )}
            />
          }
        />
        <TooltipContent>Excluir transação</TooltipContent>
      </Tooltip>
    </div>
  )

  const isPaidExpense = transaction.type === 'expense' && transaction.paid

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-1 border-b border-zinc-800 px-4 py-3 text-base hover:bg-zinc-800 transition-colors md:hidden',
          isPaidExpense && 'bg-emerald-950',
          isPaidExpense && 'hover:bg-emerald-950',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {descriptionCell}
          {amountCell}
        </div>
        <div className="flex items-center justify-between gap-2">
          {categoryCell}
          {actionsCell}
        </div>
      </div>

      <div
        className={cn(
          'hidden py-2 text-base hover:bg-zinc-800 transition-colors px-4 md:grid md:grid-cols-4 md:items-center border-b border-zinc-600',
          isPaidExpense && 'bg-emerald-950',
          isPaidExpense && 'hover:bg-emerald-950',
        )}
      >
        {descriptionCell}
        {categoryCell}
        {amountCell}
        {actionsCell}
      </div>
    </>
  )
}
