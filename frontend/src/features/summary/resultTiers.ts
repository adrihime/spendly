type ResultMood = 'positive' | 'neutral' | 'negative'

interface ResultTierDefinition {
  min: number
  mood: ResultMood
  accent: string
  badge: string
}

const RESULT_TIERS: ResultTierDefinition[] = [
  { min: 20, mood: 'positive', accent: 'text-emerald-300', badge: 'bg-emerald-200 text-zinc-900' },
  { min: 0.01, mood: 'positive', accent: 'text-green-300', badge: 'bg-green-200 text-zinc-900' },
  { min: -0.01, mood: 'neutral', accent: 'text-red-300', badge: 'bg-red-200 text-zinc-900' },
  { min: -20, mood: 'negative', accent: 'text-rose-300', badge: 'bg-rose-200 text-zinc-900' },
  { min: -Infinity, mood: 'negative', accent: 'text-red-300', badge: 'bg-red-200 text-zinc-900' },
]

const MOOD_GRADIENT: Record<ResultMood, string> = {
  positive: 'from-zinc-950 via-green-950 to-emerald-700',
  neutral: 'from-zinc-950 via-zinc-900 to-zinc-700',
  negative: 'from-zinc-950 via-red-950 to-red-800',
}

export function getResultTier(percentOfIncome: number) {
  const tier =
    RESULT_TIERS.find((t) => percentOfIncome >= t.min) ?? RESULT_TIERS[RESULT_TIERS.length - 1]
  return { ...tier, gradient: MOOD_GRADIENT[tier.mood] }
}
