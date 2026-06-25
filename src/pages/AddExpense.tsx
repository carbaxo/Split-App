import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import { useGroup, useExpenses, addExpense, updateExpense, deleteExpense } from '../data/firestore'
import { splitEqually } from '../lib/balances'
import { formatMoney, round2 } from '../lib/format'
import { CATEGORIES } from '../lib/categories'
import { allMemberIds, buildLocalNames } from '../lib/members'
import type { SplitMode } from '../lib/types'
import { SubHeader } from './CreateGroup'
import { TrashIcon } from '../components/Icons'

function parseAmount(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export default function AddExpense() {
  const { id, eid } = useParams()
  const { user } = useAuth()
  const uid = user!.uid
  const navigate = useNavigate()
  const group = useGroup(id)
  const expenses = useExpenses(id)
  const { name } = useUsers()
  useEnsureUsers(group?.memberIds ?? [])

  const editing = expenses?.find((e) => e.id === eid)
  const members = group ? allMemberIds(group) : []
  const localNames = group ? buildLocalNames([group]) : {}
  const displayName = (id: string) => (id === uid ? 'Tú' : localNames[id] ?? name(id))

  // Estado del formulario (se inicializa una vez que hay datos).
  const [ready, setReady] = useState(false)
  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState('general')
  const [paidBy, setPaidBy] = useState(uid)
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [participants, setParticipants] = useState<string[]>([])
  const [mode, setMode] = useState<SplitMode>('equal')
  const [exact, setExact] = useState<Record<string, string>>({})
  const [percent, setPercent] = useState<Record<string, string>>({})
  const [shares, setShares] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Inicialización (al cargar grupo / gasto a editar).
  if (group && !ready) {
    if (editing) {
      setDescription(editing.description)
      setAmountStr(String(editing.amount))
      setCategory(editing.category)
      setPaidBy(editing.paidBy)
      setDateStr((editing.date?.toDate() ?? new Date()).toISOString().slice(0, 10))
      setParticipants(Object.keys(editing.splits))
      setExact(Object.fromEntries(Object.entries(editing.splits).map(([k, v]) => [k, String(v)])))
      setMode('exact')
    } else {
      setParticipants(members)
    }
    setReady(true)
  }

  const amount = parseAmount(amountStr)

  // Cálculo de los splits según el modo elegido.
  const splits = useMemo<Record<string, number>>(() => {
    if (participants.length === 0 || amount <= 0) return {}
    if (mode === 'equal') return splitEqually(amount, participants)
    if (mode === 'exact') {
      const r: Record<string, number> = {}
      for (const p of participants) r[p] = round2(parseAmount(exact[p] ?? '0'))
      return r
    }
    if (mode === 'percent') {
      const r: Record<string, number> = {}
      for (const p of participants) r[p] = round2((amount * parseAmount(percent[p] ?? '0')) / 100)
      return r
    }
    // shares
    const totalShares = participants.reduce((s, p) => s + parseAmount(shares[p] ?? '0'), 0)
    const r: Record<string, number> = {}
    if (totalShares > 0)
      for (const p of participants) r[p] = round2((amount * parseAmount(shares[p] ?? '0')) / totalShares)
    return r
  }, [participants, amount, mode, exact, percent, shares])

  const splitsTotal = round2(Object.values(splits).reduce((s, v) => s + v, 0))
  const remaining = round2(amount - splitsTotal)

  if (group === undefined) return <div className="p-8 text-gray-400">Cargando…</div>
  if (!group) return <div className="p-8 text-gray-500">Grupo no encontrado.</div>

  function toggleParticipant(m: string) {
    setParticipants((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  async function save() {
    setError(null)
    if (!description.trim()) return setError('Pon una descripción.')
    if (amount <= 0) return setError('El importe debe ser mayor que 0.')
    if (participants.length === 0) return setError('Elige entre quién se reparte.')
    if (Math.abs(remaining) > 0.01)
      return setError(
        remaining > 0
          ? `Faltan ${formatMoney(remaining, group!.currency)} por repartir.`
          : `Te has pasado ${formatMoney(-remaining, group!.currency)}.`,
      )

    setSaving(true)
    const payload = {
      description: description.trim(),
      amount: round2(amount),
      currency: group!.currency,
      category,
      paidBy,
      splits,
      kind: 'expense' as const,
      date: new Date(dateStr),
    }
    try {
      if (editing) await updateExpense(group!.id, editing.id, payload)
      else await addExpense(group!.id, { ...payload, createdBy: uid })
      navigate(`/group/${group!.id}`, { replace: true })
    } catch {
      setSaving(false)
      setError('No se pudo guardar.')
    }
  }

  async function remove() {
    if (editing && window.confirm('¿Borrar este gasto?')) {
      await deleteExpense(group!.id, editing.id)
      navigate(`/group/${group!.id}`, { replace: true })
    }
  }

  const inputCls =
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none ring-brand-400 focus:ring-2'

  return (
    <div>
      <SubHeader
        title={editing ? 'Editar gasto' : 'Nuevo gasto'}
        onBack={() => navigate(-1)}
        action={
          editing ? (
            <button onClick={remove} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
              <TrashIcon className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="space-y-5 px-4 py-5 pb-28 sm:px-8">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿En qué fue el gasto?"
          autoFocus
          className={inputCls}
        />

        <div className="flex gap-3">
          <input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className={`${inputCls} text-lg font-semibold`}
          />
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className={`${inputCls} max-w-[10rem]`}
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  category === c.key
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pagado por */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Pagado por</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={inputCls}>
            {members.map((m) => (
              <option key={m} value={m}>
                {displayName(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Reparto */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Cómo se reparte</label>
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {(
              [
                ['equal', 'Igual'],
                ['exact', 'Exacto'],
                ['percent', '%'],
                ['shares', 'Partes'],
              ] as [SplitMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  mode === m ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="space-y-1.5">
            {members.map((m) => {
              const checked = participants.includes(m)
              return (
                <li
                  key={m}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                    checked ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipant(m)}
                    className="h-5 w-5 accent-brand-500"
                  />
                  <span className="flex-1 truncate text-gray-700">{displayName(m)}</span>

                  {checked && mode === 'equal' && (
                    <span className="text-sm font-medium text-gray-500">
                      {formatMoney(splits[m] ?? 0, group.currency)}
                    </span>
                  )}
                  {checked && mode === 'exact' && (
                    <input
                      value={exact[m] ?? ''}
                      onChange={(e) => setExact({ ...exact, [m]: e.target.value })}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  )}
                  {checked && mode === 'percent' && (
                    <div className="flex items-center gap-1">
                      <input
                        value={percent[m] ?? ''}
                        onChange={(e) => setPercent({ ...percent, [m]: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-brand-400"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  )}
                  {checked && mode === 'shares' && (
                    <input
                      value={shares[m] ?? ''}
                      onChange={(e) => setShares({ ...shares, [m]: e.target.value })}
                      inputMode="numeric"
                      placeholder="1"
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  )}
                </li>
              )
            })}
          </ul>

          {amount > 0 && participants.length > 0 && (
            <p className={`mt-2 text-sm ${Math.abs(remaining) < 0.01 ? 'text-gray-400' : 'text-amber-600'}`}>
              Repartido {formatMoney(splitsTotal, group.currency)} de {formatMoney(amount, group.currency)}
              {Math.abs(remaining) >= 0.01 && ` · faltan ${formatMoney(remaining, group.currency)}`}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir gasto'}
        </button>
      </div>
    </div>
  )
}
