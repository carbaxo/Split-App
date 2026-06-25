import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Tipo de la tabla de ejemplo `items` (ver supabase/schema.sql).
// Sirve como prueba de que el guardado de datos por usuario funciona.
// Cuando definamos qué hace la app lo sustituimos por el modelo real.
interface Item {
  id: string
  title: string
  created_at: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function addItem(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !user) return
    setError(null)
    const { error } = await supabase
      .from('items')
      .insert({ title: title.trim(), user_id: user.id })
    if (error) setError(error.message)
    else {
      setTitle('')
      loadItems()
    }
  }

  async function removeItem(id: string) {
    setError(null)
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) setError(error.message)
    else loadItems()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Inicio</h1>
      <p className="mt-1 text-slate-400">
        Prueba de guardado en Supabase. Lo que crees aquí se asocia a tu cuenta.
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
