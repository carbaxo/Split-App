import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createGroup } from '../data/firestore'
import { GROUP_TYPES } from '../lib/categories'
import { CURRENCIES } from '../lib/format'
import type { GroupType } from '../lib/types'
import { BackIcon } from '../components/Icons'

export default function CreateGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('trip')
  const [currency, setCurrency] = useState('EUR')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !user) return
    setSaving(true)
    try {
      const id = await createGroup({ name: name.trim(), type, currency, uid: user.uid })
      navigate(`/group/${id}`, { replace: true })
    } catch {
      setSaving(false)
    }
  }

  return (
    <div>
      <SubHeader title="Crear grupo" onBack={() => navigate(-1)} />
      <div className="space-y-5 px-4 py-5 sm:px-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Nombre del grupo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Viaje a Italia, Piso, Cena…"
            autoFocus
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none ring-brand-400 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Tipo</label>
          <div className="grid grid-cols-2 gap-2.5">
            {GROUP_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition ${
                  type === t.key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="font-medium text-gray-700">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none ring-brand-400 focus:ring-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Creando…' : 'Crear grupo'}
        </button>
      </div>
    </div>
  )
}

export function SubHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-3 sm:px-4">
      <button onClick={onBack} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100">
        <BackIcon className="h-6 w-6" />
      </button>
      <h1 className="flex-1 truncate text-lg font-semibold text-gray-800">{title}</h1>
      {action}
    </header>
  )
}
