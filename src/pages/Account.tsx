import { useAuth } from '../contexts/AuthContext'

export default function Account() {
  const { user, signOut } = useAuth()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Cuenta</h1>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Correo</p>
          <p className="mt-1 text-slate-100">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ID de usuario</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-400">{user?.id}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
