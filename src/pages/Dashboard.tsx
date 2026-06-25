import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

// Documento de la colección de ejemplo `items` en Firestore.
// Sirve como prueba de que el guardado de datos por usuario funciona.
// Cuando definamos qué hace la app lo sustituimos por el modelo real.
interface Item {
  id: string
  title: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadItems() {
    if (!user) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'items'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, title: d.data().title as string })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function addItem(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !user) return
    setError(null)
    try {
      await addDoc(collection(db, 'items'), {
        title: title.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      loadItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  async function removeItem(id: string) {
    setError(null)
    try {
      await deleteDoc(doc(db, 'items', id))
      loadItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Inicio</h1>
      <p className="mt-1 text-slate-400">
        Prueba de guardado en Firestore. Lo que crees aquí se asocia a tu cuenta.
      </p>

      <form onSubmit={addItem} className="mt-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Escribe algo y guárdalo…"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none ring-indigo-500 placeholder:text-slate-500 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400"
        >
          Guardar
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-slate-400">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-500">
            Todavía no has guardado nada.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <span>{item.title}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-sm text-slate-500 hover:text-rose-400"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
