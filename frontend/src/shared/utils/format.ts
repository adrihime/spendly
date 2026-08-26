import { APP_CURRENCY, APP_LOCALE } from '../config/locale'

export function formatCurrency(
  amount: number,
  locale: string = APP_LOCALE,
  currency: string = APP_CURRENCY,
  options?: Intl.NumberFormatOptions,
) {
  return amount.toLocaleString(locale, { style: 'currency', currency, ...options })
}

export function formatMoney(amount: number) {
  return formatCurrency(amount, undefined, undefined, { maximumFractionDigits: 0 })
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(date: Date) {
  return date.toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
  })
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(APP_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
