import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { joinGroup } from '../data/firestore'
import { SubHeader } from './CreateGroup'

export default function JoinGroup() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [value, setValue] = useState(code ?? '')
  const [status, setStatus] = useState<'idle' | 'joining' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function join(groupId: string) {
    if (!groupId.trim() || !user) return
    setStatus('joining')
    setError(null)
    try {
      await joinGroup(groupId.trim(), user.uid)
      navigate(`/group/${groupId.trim()}`, { replace: true })
    } catch {
      setStatus('error')
      setError('No se pudo unir. Revisa el código del grupo.')
    }
  }

  // Si llega por enlace con código, intenta unirse automáticamente.
  useEffect(() => {
    if (code && user) join(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user])

  return (
    <div>
      <SubHeader title="Unirse a un grupo" onBack={() => navigate('/')} />
      <div className="space-y-4 px-4 py-6 sm:px-8">
        {status === 'joining' ? (
          <p className="text-gray-500">Uniéndote al grupo…</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Pega el código del grupo que te ha pasado tu amigo (o abre el enlace de invitación
              que te envió).
            </p>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Código del grupo"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none ring-brand-400 focus:ring-2"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              onClick={() => join(value)}
              disabled={!value.trim()}
              className="w-full rounded-xl bg-brand-500 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              Unirme
            </button>
          </>
        )}
      </div>
    </div>
  )
}
