import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const EMAIL_STORAGE_KEY = 'split-app:emailForSignIn'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    // Al cargar la app, comprueba si venimos del enlace del correo.
    // Firebase añade sus parámetros a la URL; aquí completamos el login.
    async function completeLinkSignInIfPresent() {
      if (!isSignInWithEmailLink(auth, window.location.href)) return
      let email = window.localStorage.getItem(EMAIL_STORAGE_KEY)
      // Si abre el enlace en otro dispositivo/navegador, pedimos el correo.
      if (!email) {
        email = window.prompt('Confirma tu correo electrónico para entrar:') ?? ''
      }
      if (!email) return
      try {
        await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem(EMAIL_STORAGE_KEY)
      } catch {
        // Enlace caducado o inválido: se ignora y el usuario verá el login.
      } finally {
        // Limpia los parámetros de la URL para no reintentar al recargar.
        window.history.replaceState({}, '', `${import.meta.env.BASE_URL}`)
      }
    }

    completeLinkSignInIfPresent().finally(() => {
      // Escucha login / logout / refresco de token.
      const unsubscribe = onAuthStateChanged(auth, (newUser) => {
        setUser(newUser)
        setLoading(false)
      })
      cleanup = unsubscribe
    })

    return () => cleanup?.()
  }, [])

  async function signInWithEmail(email: string) {
    try {
      await sendSignInLinkToEmail(auth, email, {
        // A dónde vuelve el usuario tras hacer clic en el enlace del correo.
        url: `${window.location.origin}${import.meta.env.BASE_URL}`,
        handleCodeInApp: true,
      })
      // Guardamos el correo para completar el login al volver (sin re-pedirlo).
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo enviar el enlace.' }
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signInWithEmail, signOut }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
