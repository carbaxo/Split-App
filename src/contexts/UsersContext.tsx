import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchUserProfile } from '../data/firestore'
import type { UserProfile } from '../lib/types'

interface UsersContextValue {
  /** Devuelve el perfil cacheado (o undefined si aún no se ha cargado). */
  get: (uid: string) => UserProfile | undefined
  /** Nombre legible para mostrar (cae a "alguien" si no hay datos). */
  name: (uid: string) => string
  /** Asegura que los uids indicados se carguen en caché. */
  ensure: (uids: string[]) => void
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const requested = useRef<Set<string>>(new Set())

  const ensure = useCallback((uids: string[]) => {
    const missing = uids.filter((u) => u && !requested.current.has(u))
    if (missing.length === 0) return
    missing.forEach((u) => requested.current.add(u))
    missing.forEach(async (uid) => {
      const p = await fetchUserProfile(uid)
      if (p) setProfiles((prev) => ({ ...prev, [uid]: p }))
    })
  }, [])

  const get = useCallback((uid: string) => profiles[uid], [profiles])

  const name = useCallback(
    (uid: string) => {
      const p = profiles[uid]
      if (!p) return 'alguien'
      return p.name || p.email || 'alguien'
    },
    [profiles],
  )

  return (
    <UsersContext.Provider value={{ get, name, ensure }}>{children}</UsersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers debe usarse dentro de <UsersProvider>')
  return ctx
}

/** Hook cómodo: asegura unos uids y re-renderiza cuando llegan. */
// eslint-disable-next-line react-refresh/only-export-components
export function useEnsureUsers(uids: string[]) {
  const { ensure } = useUsers()
  useEffect(() => {
    ensure(uids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uids.join(',')])
}
