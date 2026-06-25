import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Página a la que vuelve el usuario tras hacer clic en el enlace del correo.
// Supabase (detectSessionInUrl) procesa el token automáticamente; aquí solo
// esperamos a que la sesión esté lista y redirigimos a la app.
export default function AuthCallback() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      navigate(session ? '/' : '/login', { replace: true })
    }
  }, [session, loading, navigate])

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-950 text-slate-300">
      <p>Iniciando sesión…</p>
    </div>
  )
}
