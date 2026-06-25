import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import { useGroup, useExpenses, addExpense } from '../data/firestore'
import { computeNetBalances, simplifyDebts } from '../lib/balances'
import { formatMoney, round2 } from '../lib/format'
import { SubHeader } from './CreateGroup'

function parseAmount(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export default function SettleUp() {
  const { id } = useParams()
  const { user } = useAuth()
  const uid = user!.uid
  const navigate = useNavigate()
  const group = useGroup(id)
  const expenses = useExpenses(id)
  const { name } = useUsers()
  useEnsureUsers(group?.memberIds ?? [])

  const debts = useMemo(
    () => (expenses ? simplifyDebts(computeNetBalances(expenses)) : []),
    [expenses],
  )

  const [from, setFrom] = useState(uid)
  const [to, setTo] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (group === undefined) return <div className="p-8 text-gray-400">Cargando…</div>
  if (!group) return <div className="p-8 text-gray-500">Grupo no encontrado.</div>

  const members = group.memberIds
  const amount = parseAmount(amountStr)

  function applySuggestion(d: { from: string; to: string; amount: number }) {
    setFrom(d.from)
    setTo(d.to)
    setAmountStr(String(d.amount))
  }

  async function save() {
    setError(null)
    if (!to || from === to) return setError('Elige quién paga y a quién.')
    if (amount <= 0) return setError('El importe debe ser mayor que 0.')
    setSaving(true)
    try {
      await addExpense(group!.id, {
        description: `Pago de ${name(from)} a ${name(to)}`,
        amount: round2(amount),
        currency: group!.currency,
        category: 'general',
        paidBy: from,
        splits: { [to]: round2(amount) },
        kind: 'settlement',
        date: new Date(dateStr),
        createdBy: uid,
      })
      navigate(`/group/${group!.id}`, { replace: true })
    } catch {
      setSaving(false)
      setError('No se pudo registrar el pago.')
    }
  }

  const inputCls =
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none ring-brand-400 focus:ring-2'

  return (
    <div>
      <SubHeader title="Saldar deudas" onBack={() => navigate(-1)} />
      <div className="space-y-5 px-4 py-5 sm:px-8">
        {debts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Sugerencias</p>
            <ul className="space-y-2">
              {debts.map((d, i) => (
                <li key={i}>
                  <button
                    onClick={() => applySuggestion(d)}
                    className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-left text-sm hover:border-brand-400"
                  >
                    <span className="flex-1 text-gray-700">
                      <b>{d.from === uid ? 'Tú' : name(d.from)}</b> → <b>{d.to === uid ? 'ti' : name(d.to)}</b>
                    </span>
                    <span className="font-semibold text-gray-800">{formatMoney(d.amount, group.currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="my-4 h-px bg-gray-200" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Quién paga</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
              {members.map((m) => (
                <option key={m} value={m}>
                  {m === uid ? 'Tú' : name(m)}
                </option>
              ))}
            </select>
          </div>
          <span className="mt-6 text-xl text-gray-400">→</span>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">A quién</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
              <option value="">Elegir…</option>
              {members
                .filter((m) => m !== from)
                .map((m) => (
                  <option key={m} value={m}>
                    {m === uid ? 'Tú' : name(m)}
                  </option>
                ))}
            </select>
          </div>
        </div>

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

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Registrar pago'}
        </button>
      </div>
    </div>
  )
}
