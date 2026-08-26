import { useState } from 'react'
import { cn } from '@/lib/utils'

export function EditableCell({
  value,
  displayValue,
  onSave,
  disabled,
  inputMode = 'text',
  align = 'left',
}: {
  value: string
  displayValue: React.ReactNode
  onSave: (value: string) => void
  disabled?: boolean
  inputMode?: 'text' | 'decimal'
  align?: 'left' | 'right'
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEditing() {
    setDraft(value)
    setIsEditing(true)
  }

  function commit() {
    setIsEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode={inputMode}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setIsEditing(false)
        }}
        className={cn(
          'w-full rounded bg-zinc-900 px-1 text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500',
          align === 'right' && 'text-right',
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={disabled}
      className={cn(
        'w-full cursor-text hover:text-zinc-200',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {displayValue}
    </button>
  )
}
