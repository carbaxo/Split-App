import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Página a la que vuelve el usuario tras hacer clic en el enlace del correo.
// Completa el inicio de sesión con el enlace y redirige a la app.
export default function AuthCallback() {
  const { completeSignInFromLink, isEmailLink } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const href = window.location.href
    if (!isEmailLink(href)) {
      navigate('/login', { replace: true })
      return
    }

    completeSignInFromLink(href).then(({ error }) => {
      if (error) setError(error)
      else navigate('/', { replace: true })
    })
  }, [completeSignInFromLink, isEmailLink, navigate])

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-slate-950 px-4 text-center text-slate-300">
      {error ? (
        <>
          <p className="text-rose-400">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Volver a intentarlo
          </button>
        </>
      ) : (
        <p>Iniciando sesión…</p>
      )}
    </div>
  )
}
