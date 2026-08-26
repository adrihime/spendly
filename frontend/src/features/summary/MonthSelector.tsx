import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMonthLabel, MONTHS } from '@/shared/config/months'

export function MonthSelector({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  const index = MONTHS.findIndex((m) => m.value === month)

  function goToOffset(offset: number) {
    const nextIndex = (index + offset + MONTHS.length) % MONTHS.length
    onChange(MONTHS[nextIndex].value)
  }

  return (
    <div className="flex items-center gap-1 px-2">
      <button
        type="button"
        onClick={() => goToOffset(-1)}
        aria-label="Mês anterior"
        className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <Select value={month} onValueChange={(value) => onChange(value as string)}>
        <SelectTrigger className="border-none bg-transparent px-1 text-lg font-semibold text-blue-300 uppercase hover:text-blue-200">
          <SelectValue>{(value: string) => getMonthLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => goToOffset(1)}
        aria-label="Próximo mês"
        className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
