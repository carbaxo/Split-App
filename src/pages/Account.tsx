import { useEffect, useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import { updateUserProfile } from '../data/firestore'
import { auth } from '../lib/firebase'
import { AVATAR_EMOJIS } from '../lib/emojis'
import { Avatar } from '../components/Avatar'

export default function Account() {
  const { user, signOut } = useAuth()
  const uid = user!.uid
  const { get, refresh } = useUsers()
  useEnsureUsers([uid])

  const profile = get(uid)
  const [name, setName] = useState(user?.displayName ?? '')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Carga el emoji guardado cuando llega el perfil.
  useEffect(() => {
    if (profile?.emoji !== undefined) setEmoji(profile.emoji ?? null)
  }, [profile?.emoji])

  async function chooseEmoji(e: string) {
    const next = emoji === e ? null : e
    setEmoji(next)
    await updateUserProfile(uid, { emoji: next })
    await refresh(uid)
  }

  async function saveName() {
    if (!user || !name.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile(auth.currentUser!, { displayName: name.trim() })
      await updateUserProfile(uid, { name: name.trim() })
      await refresh(uid)
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
          <Avatar emoji={emoji} name={user?.displayName ?? user?.email} className="h-16 w-16 text-3xl bg-white/20 text-white" />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{user?.displayName ?? 'Tu cuenta'}</p>
            <p className="truncate text-sm opacity-80">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-8">
        {/* Emoji de perfil */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">Tu emoji</label>
          <p className="mb-3 text-xs text-gray-400">
            Elige tu careto oficial. Así te verán tus víctimas… digo, tus amigos.
          </p>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => chooseEmoji(e)}
                className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition ${
                  emoji === e ? 'bg-brand-500 ring-2 ring-brand-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          {emoji && (
            <button
              onClick={() => chooseEmoji(emoji)}
              className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600"
            >
              Quitar emoji (volver a la inicial aburrida)
            </button>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Tu nombre</label>
          <p className="mb-2 text-xs text-gray-400">
            Así te verán tus amigos. Ponte algo reconocible, no “asdf”.
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
          Cerrar sesión (huir de las deudas)
        </button>

        <p className="text-center text-xs text-gray-300">Split App · cuentas claras y amistades… regular</p>
      </div>
    </div>
  )
}
