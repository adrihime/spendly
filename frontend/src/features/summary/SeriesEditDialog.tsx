import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { RuleScope, Transaction } from '@/shared/types/transaction'
import { updateRule } from './api'
import { expenseKeys, incomeKeys } from './keys'

export function SeriesEditDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [category, setCategory] = useState<string>(transaction.category)

  const save = useMutation<unknown, Error, RuleScope>({
    mutationFn: (scope) =>
      updateRule(
        transaction.series_id!,
        {
          description: description.trim(),
          amount: Number(amount.replace(',', '.')),
          category,
        },
        scope,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      toast.add({ title: 'Recorrência atualizada', type: 'success', timeout: 2000 })
      onClose()
    },
    onError: () => {
      toast.add({ title: 'Não deu pra atualizar a recorrência', type: 'error', timeout: 2500 })
    },
  })

  const parsedAmount = Number(amount.replace(',', '.'))
  const isValid = description.trim().length > 0 && Number.isFinite(parsedAmount)

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar recorrência</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="series-description">Descrição</Label>
            <Input
              id="series-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="series-amount">Valor</Label>
              <Input
                id="series-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
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

          <p className="text-sm text-zinc-400">
            Lançamentos que você já editou à mão não são afetados.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            className="w-full"
            disabled={!isValid || save.isPending}
            onClick={() => save.mutate('future')}
          >
            Deste mês em diante
          </Button>
          <Button
            className="w-full"
            disabled={!isValid || save.isPending}
            onClick={() => save.mutate('all')}
          >
            A série toda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
