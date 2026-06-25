export interface Category {
  key: string
  label: string
  emoji: string
}

export const CATEGORIES: Category[] = [
  { key: 'general', label: 'General', emoji: '🧾' },
  { key: 'food', label: 'Comida y bebida', emoji: '🍽️' },
  { key: 'groceries', label: 'Compra', emoji: '🛒' },
  { key: 'home', label: 'Casa', emoji: '🏠' },
  { key: 'transport', label: 'Transporte', emoji: '🚗' },
  { key: 'travel', label: 'Viaje', emoji: '✈️' },
  { key: 'entertainment', label: 'Ocio', emoji: '🎉' },
  { key: 'utilities', label: 'Facturas', emoji: '💡' },
  { key: 'shopping', label: 'Compras', emoji: '🛍️' },
  { key: 'health', label: 'Salud', emoji: '💊' },
  { key: 'other', label: 'Otros', emoji: '📌' },
]

const byKey = new Map(CATEGORIES.map((c) => [c.key, c]))

export function getCategory(key: string): Category {
  return byKey.get(key) ?? CATEGORIES[0]
}

export const GROUP_TYPES: { key: import('./types').GroupType; label: string; emoji: string }[] = [
  { key: 'trip', label: 'Viaje', emoji: '✈️' },
  { key: 'home', label: 'Piso / Casa', emoji: '🏠' },
  { key: 'couple', label: 'Pareja', emoji: '❤️' },
  { key: 'other', label: 'Otro', emoji: '👥' },
]

export function getGroupType(key: string) {
  return GROUP_TYPES.find((g) => g.key === key) ?? GROUP_TYPES[3]
}
