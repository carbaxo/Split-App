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
  completeSignInFromLink: (href: string) => Promise<{ error: string | null }>
  isEmailLink: (href: string) => boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Escucha login / logout / refresco de token.
    const unsubscribe = onAuthStateChanged(auth, (newUser) => {
      setUser(newUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithEmail(email: string) {
    try {
      await sendSignInLinkToEmail(auth, email, {
        // A dónde vuelve el usuario tras hacer clic en el enlace del correo.
        url: `${window.location.origin}/auth/callback`,
        handleCodeInApp: true,
      })
      // Guardamos el correo para completar el login al volver (sin re-pedirlo).
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo enviar el enlace.' }
    }
  }

  function isEmailLink(href: string) {
    return isSignInWithEmailLink(auth, href)
  }

  async function completeSignInFromLink(href: string) {
    try {
      let email = window.localStorage.getItem(EMAIL_STORAGE_KEY)
      // Si abre el enlace en otro dispositivo/navegador, pedimos el correo.
      if (!email) {
        email = window.prompt('Confirma tu correo electrónico para entrar:') ?? ''
      }
      if (!email) return { error: 'Se necesita el correo para completar el acceso.' }
      await signInWithEmailLink(auth, email, href)
      window.localStorage.removeItem(EMAIL_STORAGE_KEY)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'El enlace no es válido o ha caducado.' }
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithEmail,
      completeSignInFromLink,
      isEmailLink,
      signOut,
    }),
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
