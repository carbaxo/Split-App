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
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const googleProvider = new GoogleAuthProvider()

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si volvemos de un login por redirección (móvil), recoge el resultado.
    getRedirectResult(auth).catch(() => {
      // Sin redirección pendiente: no pasa nada.
    })

    // Escucha login / logout / refresco de token.
    const unsubscribe = onAuthStateChanged(auth, (newUser) => {
      setUser(newUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    try {
      // En la mayoría de navegadores el popup funciona y es más fluido.
      await signInWithPopup(auth, googleProvider)
      return { error: null }
    } catch (e) {
      // En algunos móviles / PWA instalada el popup se bloquea: usamos
      // redirección como plan B.
      const code = (e as { code?: string })?.code ?? ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return { error: null }
        } catch (e2) {
          return {
            error: e2 instanceof Error ? e2.message : 'No se pudo iniciar sesión.',
          }
        }
      }
      if (code === 'auth/popup-closed-by-user') {
        return { error: null } // El usuario cerró el popup: sin error.
      }
      return { error: e instanceof Error ? e.message : 'No se pudo iniciar sesión.' }
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signInWithGoogle, signOut }),
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
