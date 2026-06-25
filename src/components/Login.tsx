import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    const { error } = await signInWithEmail(email.trim())
    if (error) {
      setError(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold">
            S
          </div>
          <h1 className="text-2xl font-bold">Split App</h1>
          <p className="mt-1 text-sm text-slate-400">
            Entra con tu correo. Te enviaremos un enlace mágico.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-xl border border-emerald-700 bg-emerald-950/50 p-4 text-center text-sm">
            <p className="font-medium text-emerald-300">¡Revisa tu correo!</p>
            <p className="mt-1 text-slate-300">
              Hemos enviado un enlace de acceso a <strong>{email}</strong>. Haz clic en él
              para entrar en tu cuenta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base outline-none ring-indigo-500 placeholder:text-slate-500 focus:ring-2"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
