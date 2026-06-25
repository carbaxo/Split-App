export function formatMoney(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** Redondea a 2 decimales evitando errores de coma flotante. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(d)
}

export function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** "hace 3 h", "ayer", etc. de forma sencilla. */
export function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return formatDate(d)
}

export const CURRENCIES = [
  { code: 'EUR', label: '€ Euro' },
  { code: 'USD', label: '$ Dólar' },
  { code: 'GBP', label: '£ Libra' },
  { code: 'MXN', label: '$ Peso mexicano' },
  { code: 'ARS', label: '$ Peso argentino' },
  { code: 'COP', label: '$ Peso colombiano' },
  { code: 'CHF', label: 'Fr. Franco suizo' },
]
