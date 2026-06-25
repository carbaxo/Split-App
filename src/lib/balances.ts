import type { Expense } from './types'
import { round2 } from './format'

export interface Debt {
  from: string // uid que debe
  to: string // uid que cobra
  amount: number
}

/**
 * Saldo neto por usuario dentro de un conjunto de gastos.
 * Positivo = le deben dinero. Negativo = debe dinero.
 */
export function computeNetBalances(expenses: Expense[]): Record<string, number> {
  const net: Record<string, number> = {}
  for (const e of expenses) {
    net[e.paidBy] = (net[e.paidBy] ?? 0) + e.amount
    for (const [uid, owed] of Object.entries(e.splits)) {
      net[uid] = (net[uid] ?? 0) - owed
    }
  }
  for (const uid of Object.keys(net)) net[uid] = round2(net[uid])
  return net
}

/**
 * Simplifica las deudas: a partir de los saldos netos calcula el mínimo de
 * transferencias para que todos queden a cero (algoritmo voraz).
 */
export function simplifyDebts(net: Record<string, number>): Debt[] {
  const debtors: { uid: string; amount: number }[] = []
  const creditors: { uid: string; amount: number }[] = []

  for (const [uid, balance] of Object.entries(net)) {
    const b = round2(balance)
    if (b < -0.005) debtors.push({ uid, amount: -b })
    else if (b > 0.005) creditors.push({ uid, amount: b })
  }

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const debts: Debt[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount)
    debts.push({ from: debtors[i].uid, to: creditors[j].uid, amount: round2(pay) })
    debtors[i].amount = round2(debtors[i].amount - pay)
    creditors[j].amount = round2(creditors[j].amount - pay)
    if (debtors[i].amount <= 0.005) i++
    if (creditors[j].amount <= 0.005) j++
  }
  return debts
}

/**
 * Saldo por pareja entre `me` y cada otro usuario (sumando todos los gastos).
 * Positivo = la otra persona me debe a mí. Negativo = yo le debo.
 */
export function computePairwiseBalances(
  expenses: Expense[],
  me: string,
): Record<string, number> {
  const pair: Record<string, number> = {}
  for (const e of expenses) {
    if (e.paidBy === me) {
      for (const [uid, owed] of Object.entries(e.splits)) {
        if (uid !== me) pair[uid] = (pair[uid] ?? 0) + owed
      }
    } else {
      const myShare = e.splits[me]
      if (myShare) pair[e.paidBy] = (pair[e.paidBy] ?? 0) - myShare
    }
  }
  for (const uid of Object.keys(pair)) pair[uid] = round2(pair[uid])
  return pair
}

/** Reparte una cantidad entre N personas a partes iguales con céntimos exactos. */
export function splitEqually(amount: number, uids: string[]): Record<string, number> {
  const n = uids.length
  const result: Record<string, number> = {}
  if (n === 0) return result
  const cents = Math.round(amount * 100)
  const base = Math.floor(cents / n)
  let remainder = cents - base * n
  for (const uid of uids) {
    let share = base
    if (remainder > 0) {
      share += 1
      remainder -= 1
    }
    result[uid] = share / 100
  }
  return result
}
