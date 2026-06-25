import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { updateUserProfile } from '../data/firestore'
import { auth } from '../lib/firebase'

export default function Account() {
  const { user, signOut } = useAuth()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveName() {
    if (!user || !name.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile(auth.currentUser!, { displayName: name.trim() })
      await updateUserProfile(user.uid, { name: name.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <header className="bg-brand-600 px-4 py-6 text-white sm:rounded-b-3xl sm:px-8">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
            {(user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{user?.displayName ?? 'Tu cuenta'}</p>
            <p className="truncate text-sm opacity-80">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Tu nombre</label>
          <p className="mb-2 text-xs text-gray-400">
            Así te verán tus amigos en los grupos. Ponte un nombre reconocible.
          </p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none ring-brand-400 focus:ring-2"
            />
            <button
              onClick={saveName}
              disabled={saving || !name.trim()}
              className="rounded-xl bg-brand-500 px-5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {saved ? '✓' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Correo</p>
          <p className="mt-1 text-gray-800">{user?.email}</p>
        </div>

        <button
          onClick={signOut}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cerrar sesión
        </button>

        <p className="text-center text-xs text-gray-300">Split App · clon de Splitwise</p>
      </div>
    </div>
  )
}
