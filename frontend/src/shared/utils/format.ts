import { APP_CURRENCY, APP_LOCALE } from '../config/locale'

export function formatCurrency(
  amount: number,
  locale: string = APP_LOCALE,
  currency: string = APP_CURRENCY,
) {
  return amount.toLocaleString(locale, { style: 'currency', currency })
}
