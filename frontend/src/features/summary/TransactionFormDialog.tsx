import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PaidCheckbox } from './PaidCheckbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { EXPENSE_CATEGORIES, getCategoryLabel, INCOME_CATEGORIES } from '@/shared/config/categories'
import type {
  Expense,
  ExpenseCategory,
  Income,
  IncomeCategory,
  TransactionType,
} from '@/shared/types/transaction'
import { createExpense, createIncome } from './api'
import { expenseKeys, incomeKeys } from './keys'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionFormDialog({ type }: { type: TransactionType }) {
  const queryClient = useQueryClient()
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [category, setCategory] = useState<string>(categories[0])
  const [amount, setAmount] = useState('')
  const [paid, setPaid] = useState(false)
  const [thirdParty, setThirdParty] = useState(false)
  const [repeatMonths, setRepeatMonths] = useState('1')
  const [indefinite, setIndefinite] = useState(false)

  function resetForm() {
    setDescription('')
    setDate(todayISO())
    setCategory(categories[0])
    setAmount('')
    setPaid(false)
    setThirdParty(false)
    setRepeatMonths('1')
    setIndefinite(false)
  }

  const createTransaction = useMutation<Expense[] | Income, Error, void>({
    mutationFn: () => {
      const parsedAmount = Number(amount.replace(',', '.'))
      if (type === 'income') {
        return createIncome({
          description,
          date,
          category: category as IncomeCategory,
          amount: parsedAmount,
        })
      }
      return createExpense({
        description,
        date,
        category: category as ExpenseCategory,
        amount: parsedAmount,
        paid,
        third_party: thirdParty,
        repeat_months: indefinite ? null : Math.max(1, Number(repeatMonths) || 1),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      toast.add({
        title: type === 'income' ? 'Receita adicionada' : 'Despesa adicionada',
        type: 'success',
        timeout: 2000,
      })
      resetForm()
      setOpen(false)
    },
    onError: () => {
      toast.add({ title: 'Não deu pra adicionar', type: 'error', timeout: 2500 })
    },
  })

  const parsedAmount = Number(amount.replace(',', '.'))
  const isValid = description.trim().length > 0 && Number.isFinite(parsedAmount)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return
    createTransaction.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-200"
            aria-label={type === 'income' ? 'Adicionar receita' : 'Adicionar despesa'}
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === 'income' ? 'Nova receita' : 'Nova despesa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              autoFocus
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => getCategoryLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getCategoryLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={type === 'expense' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-1'}>
            <div className="flex flex-col gap-1">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            {type === 'expense' && (
              <div className="flex flex-col gap-1">
                <Label>Status</Label>
                <PaidCheckbox
                  state={paid ? 'checked' : 'unchecked'}
                  onClick={() => setPaid((prev) => !prev)}
                  label={paid ? 'Pago' : 'Pendente'}
                  className="h-8"
                />
              </div>
            )}
          </div>

          {type === 'expense' && (
            <>
              <PaidCheckbox
                state={thirdParty ? 'checked' : 'unchecked'}
                onClick={() => setThirdParty((prev) => !prev)}
                label="Compra de terceiro"
              />
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="repeat">Repetir por</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="repeat"
                      inputMode="numeric"
                      className="w-20"
                      value={indefinite ? '' : repeatMonths}
                      disabled={indefinite}
                      onChange={(event) => setRepeatMonths(event.target.value)}
                    />
                    <span className="text-sm text-zinc-400">meses</span>
                  </div>
                </div>
                <PaidCheckbox
                  state={indefinite ? 'checked' : 'unchecked'}
                  onClick={() => setIndefinite((prev) => !prev)}
                  label="Indefinido"
                  className="h-8"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={!isValid || createTransaction.isPending}>
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
