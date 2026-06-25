import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import { useMyGroups, useGroupsExpenses } from '../data/firestore'
import { formatMoney, formatRelative } from '../lib/format'
import { getCategory } from '../lib/categories'
import { buildLocalNames, isLocal } from '../lib/members'
import { pick, EMPTY_ACTIVITY } from '../lib/funny'
import type { Expense } from '../lib/types'

interface Item extends Expense {
  groupId: string
  groupName: string
}

export default function Activity() {
  const { user } = useAuth()
  const uid = user!.uid
  const groups = useMyGroups(uid)
  const expensesByGroup = useGroupsExpenses(groups)

  const items = useMemo<Item[]>(() => {
    if (!groups) return []
    const all: Item[] = []
    for (const g of groups) {
      for (const e of expensesByGroup[g.id] ?? []) {
        all.push({ ...e, groupId: g.id, groupName: g.name })
      }
    }
    all.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    return all.slice(0, 50)
  }, [groups, expensesByGroup])

  const localNames = useMemo(() => buildLocalNames(groups), [groups])
  useEnsureUsers(useMemo(() => items.map((i) => i.paidBy).filter((p) => !isLocal(p)), [items]))
  const { name: userName } = useUsers()
  const name = (id: string) => localNames[id] ?? userName(id)

  return (
    <div>
      <header className="bg-brand-600 px-4 py-6 text-white sm:rounded-b-3xl sm:px-8">
        <h1 className="text-2xl font-bold">Actividad</h1>
        <p className="mt-1 text-sm opacity-80">Lo último que ha pasado en tus grupos.</p>
      </header>

      <div className="px-4 py-5 sm:px-8">
        {!groups ? (
          <p className="text-gray-400">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            {pick(EMPTY_ACTIVITY, uid)}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((e) => {
              const when = e.createdAt?.toDate() ?? e.date?.toDate() ?? new Date()
              const isSettle = e.kind === 'settlement'
              const cat = getCategory(e.category)
              const who = e.paidBy === uid ? 'Tú' : name(e.paidBy)
              return (
                <li key={`${e.groupId}-${e.id}`}>
                  <Link
                    to={`/group/${e.groupId}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                      {isSettle ? '💸' : cat.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">
                        <b>{who}</b> {isSettle ? 'registró un pago' : 'añadió'}{' '}
                        {!isSettle && <b>{e.description}</b>} en <b>{e.groupName}</b>
                      </p>
                      <p className="text-xs text-gray-400">{formatRelative(when)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {formatMoney(e.amount, e.currency)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
