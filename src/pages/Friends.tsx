import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import { useMyGroups, useGroupsExpenses } from '../data/firestore'
import { computePairwiseBalances } from '../lib/balances'
import { formatMoney } from '../lib/format'

export default function Friends() {
  const { user } = useAuth()
  const uid = user!.uid
  const groups = useMyGroups(uid)
  const expensesByGroup = useGroupsExpenses(groups)

  // Saldo por amigo y moneda, sumando todos los grupos compartidos.
  const friends = useMemo(() => {
    const acc: Record<string, Record<string, number>> = {} // other -> currency -> net
    if (!groups) return acc
    for (const g of groups) {
      const exps = expensesByGroup[g.id]
      if (!exps) continue
      const pair = computePairwiseBalances(exps, uid)
      for (const [other, net] of Object.entries(pair)) {
        acc[other] = acc[other] ?? {}
        acc[other][g.currency] = (acc[other][g.currency] ?? 0) + net
      }
    }
    return acc
  }, [groups, expensesByGroup, uid])

  const friendIds = Object.keys(friends)
  useEnsureUsers(friendIds)
  const { name, get } = useUsers()

  return (
    <div>
      <header className="bg-brand-600 px-4 py-6 text-white sm:rounded-b-3xl sm:px-8">
        <h1 className="text-2xl font-bold">Amigos</h1>
        <p className="mt-1 text-sm opacity-80">Tu saldo con cada persona, sumando todos los grupos.</p>
      </header>

      <div className="px-4 py-5 sm:px-8">
        {!groups ? (
          <p className="text-gray-400">Cargando…</p>
        ) : friendIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Aún no compartes gastos con nadie. Crea un grupo e invita a tus amigos.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {friendIds.map((fid) => {
              const balances = Object.entries(friends[fid]).filter(([, v]) => Math.abs(v) >= 0.01)
              const p = get(fid)
              return (
                <li
                  key={fid}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                    {(p?.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">{name(fid)}</p>
                    {balances.length === 0 && <p className="text-sm text-gray-400">en paz</p>}
                  </div>
                  <div className="text-right">
                    {balances.length === 0 ? (
                      <span className="text-sm text-gray-400">—</span>
                    ) : (
                      balances.map(([cur, net]) => (
                        <div key={cur}>
                          <span className="block text-[11px] text-gray-400">
                            {net > 0 ? 'te debe' : 'le debes'}
                          </span>
                          <span className={`text-sm font-bold ${net > 0 ? 'text-brand-600' : 'text-rose-500'}`}>
                            {formatMoney(Math.abs(net), cur)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
