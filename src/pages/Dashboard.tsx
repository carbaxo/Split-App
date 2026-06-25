import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMyGroups, useGroupsExpenses } from '../data/firestore'
import { computeNetBalances } from '../lib/balances'
import { formatMoney } from '../lib/format'
import { getGroupType } from '../lib/categories'
import { PlusIcon } from '../components/Icons'

export default function Dashboard() {
  const { user } = useAuth()
  const uid = user?.uid
  const groups = useMyGroups(uid)
  const expensesByGroup = useGroupsExpenses(groups)
  const navigate = useNavigate()

  const sorted = useMemo(
    () => (groups ? [...groups].sort((a, b) => a.name.localeCompare(b.name)) : null),
    [groups],
  )

  // Saldo total del usuario (suma de su neto en cada grupo, por moneda).
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    if (!groups || !uid) return totals
    for (const g of groups) {
      const exps = expensesByGroup[g.id]
      if (!exps) continue
      const net = computeNetBalances(exps)[uid] ?? 0
      totals[g.currency] = (totals[g.currency] ?? 0) + net
    }
    return totals
  }, [groups, expensesByGroup, uid])

  const primary = Object.entries(totalsByCurrency)[0]

  return (
    <div>
      {/* Cabecera con resumen */}
      <header className="bg-brand-600 px-4 pb-6 pt-6 text-white sm:rounded-b-3xl sm:px-8">
        <h1 className="text-lg font-semibold opacity-90">Hola, {firstName(user?.displayName, user?.email)}</h1>
        <div className="mt-3">
          {!primary || Math.abs(primary[1]) < 0.01 ? (
            <p className="text-2xl font-bold">Estás en paz 🎉</p>
          ) : primary[1] > 0 ? (
            <p className="text-2xl font-bold">
              En total te deben{' '}
              <span className="text-brand-100">{formatMoney(primary[1], primary[0])}</span>
            </p>
          ) : (
            <p className="text-2xl font-bold">
              En total debes{' '}
              <span className="text-amber-200">{formatMoney(-primary[1], primary[0])}</span>
            </p>
          )}
          {Object.entries(totalsByCurrency).length > 1 && (
            <p className="mt-1 text-sm opacity-80">(tienes saldos en varias monedas)</p>
          )}
        </div>
      </header>

      <div className="px-4 py-5 sm:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">Tus grupos</h2>
          <button
            onClick={() => navigate('/join')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Unirme con código
          </button>
        </div>

        {sorted === null ? (
          <p className="text-gray-400">Cargando…</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500">Aún no tienes grupos.</p>
            <Link
              to="/new-group"
              className="mt-3 inline-block rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600"
            >
              Crear mi primer grupo
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {sorted.map((g) => {
              const exps = expensesByGroup[g.id]
              const net = exps && uid ? computeNetBalances(exps)[uid] ?? 0 : 0
              const type = getGroupType(g.type)
              return (
                <li key={g.id}>
                  <Link
                    to={`/group/${g.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                      {type.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-800">{g.name}</p>
                      <p className="text-sm text-gray-400">
                        {g.memberIds.length} {g.memberIds.length === 1 ? 'miembro' : 'miembros'}
                      </p>
                    </div>
                    <div className="text-right">
                      {!exps ? (
                        <span className="text-sm text-gray-300">…</span>
                      ) : Math.abs(net) < 0.01 ? (
                        <span className="text-sm text-gray-400">en paz</span>
                      ) : (
                        <>
                          <span className="block text-xs text-gray-400">
                            {net > 0 ? 'te deben' : 'debes'}
                          </span>
                          <span
                            className={`text-sm font-bold ${net > 0 ? 'text-brand-600' : 'text-rose-500'}`}
                          >
                            {formatMoney(Math.abs(net), g.currency)}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Botón flotante crear grupo */}
      <Link
        to="/new-group"
        className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-600 sm:bottom-8 sm:right-8"
      >
        <PlusIcon className="h-5 w-5" />
        Crear grupo
      </Link>
    </div>
  )
}

function firstName(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ')[0]
  if (email) return email.split('@')[0]
  return 'crack'
}
