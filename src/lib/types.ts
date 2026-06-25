import type { Timestamp } from 'firebase/firestore'

export type GroupType = 'trip' | 'home' | 'couple' | 'other'

export interface LocalMember {
  id: string
  name: string
}

export interface Group {
  id: string
  name: string
  type: GroupType
  memberIds: string[]
  /** Personas sin cuenta (añadidas solo con su nombre). */
  localMembers?: LocalMember[]
  createdBy: string
  currency: string
  createdAt: Timestamp | null
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  emailLower: string
  photoURL?: string | null
  emoji?: string | null
  currency?: string
}

export type SplitMode = 'equal' | 'exact' | 'percent' | 'shares'

export type ExpenseKind = 'expense' | 'settlement'

export interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  /** uid de quien pagó */
  paidBy: string
  /** uid -> cantidad que esa persona debe de este gasto (suma = amount) */
  splits: Record<string, number>
  kind: ExpenseKind
  date: Timestamp | null
  createdBy: string
  createdAt: Timestamp | null
}
