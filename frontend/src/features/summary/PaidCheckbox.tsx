import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PaidCheckboxState = 'checked' | 'unchecked' | 'indeterminate'

interface PaidCheckboxOwnProps {
  state: PaidCheckboxState
  label?: ReactNode
  pending?: boolean
}

export const PaidCheckbox = forwardRef<
  HTMLButtonElement,
  PaidCheckboxOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>
>(function PaidCheckbox({ state, label, pending, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex items-center gap-1.5 text-sm cursor-pointer',
        state === 'unchecked' ? 'text-zinc-400 hover:text-zinc-200' : 'text-emerald-400',
        pending && 'pointer-events-none opacity-50',
        className,
      )}
      {...props}
    >
      {state === 'checked' && (
        <Check strokeWidth={3} className="w-4 h-4 rounded-xs bg-emerald-500 p-px text-zinc-950" />
      )}
      {state === 'indeterminate' && (
        <Minus
          strokeWidth={3}
          className="w-4 h-4 rounded-xs bg-emerald-500/60 p-px text-zinc-950"
        />
      )}
      {state === 'unchecked' && <div className="w-4 h-4 rounded-xs border-2 border-zinc-500" />}
      {label}
    </button>
  )
})
