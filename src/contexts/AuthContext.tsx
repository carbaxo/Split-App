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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const googleProvider = new GoogleAuthProvider()

type Result = { error: string | null }

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<Result>
  signInWithPassword: (email: string, password: string) => Promise<Result>
  signUpWithPassword: (email: string, password: string) => Promise<Result>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Traduce los errores más habituales de Firebase a mensajes claros en español.
function describeAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.'
    case 'auth/missing-password':
      return 'Escribe una contraseña.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo. Inicia sesión.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Prueba de nuevo en un rato.'
    default:
      return e instanceof Error ? e.message : 'No se pudo completar la operación.'
  }
}

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
          return { error: describeAuthError(e2) }
        }
      }
      if (code === 'auth/popup-closed-by-user') {
        return { error: null } // El usuario cerró el popup: sin error.
      }
      return { error: describeAuthError(e) }
    }
  }

  async function signInWithPassword(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (e) {
      return { error: describeAuthError(e) }
    }
  }

  async function signUpWithPassword(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (e) {
      return { error: describeAuthError(e) }
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
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
