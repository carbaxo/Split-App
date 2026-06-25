import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useEnsureUsers } from '../contexts/UsersContext'
import {
  useGroup,
  useExpenses,
  leaveGroup,
  renameGroup,
  removeMember,
  addLocalMember,
  removeLocalMember,
  addMemberByEmail,
} from '../data/firestore'
import { computeNetBalances, simplifyDebts } from '../lib/balances'
import { buildLocalNames } from '../lib/members'
import { formatMoney, formatDate } from '../lib/format'
import { getCategory, getGroupType } from '../lib/categories'
import type { Expense } from '../lib/types'
import { pick, EMPTY_EXPENSES, ALL_SETTLED_GROUP } from '../lib/funny'
import { Avatar } from '../components/Avatar'
import { SubHeader } from './CreateGroup'
import { PlusIcon, ShareIcon, CheckIcon, TrashIcon } from '../components/Icons'

type Tab = 'expenses' | 'balances' | 'members'

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const uid = user!.uid
  const navigate = useNavigate()
  const group = useGroup(id)
  const expenses = useExpenses(id)
  const [tab, setTab] = useState<Tab>('expenses')

  useEnsureUsers(group?.memberIds ?? [])

  if (group === undefined) return <div className="p-8 text-gray-400">Cargando…</div>
  if (group === null)
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No se encontró el grupo o no tienes acceso.</p>
        <Link to="/" className="mt-3 inline-block font-semibold text-brand-600">
          Volver
        </Link>
      </div>
    )

  const type = getGroupType(group.type)

  return (
    <div>
      <SubHeader title={group.name} onBack={() => navigate('/')} />

      <div className="flex items-center gap-3 bg-brand-600 px-4 py-4 text-white sm:px-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">
          {type.emoji}
        </span>
        <div>
          <p className="text-lg font-bold">{group.name}</p>
          <p className="text-sm opacity-80">{type.label}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 sm:px-6">
        {(
          [
            ['expenses', 'Gastos'],
            ['balances', 'Saldos'],
            ['members', 'Miembros'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold transition ${
              tab === key
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <ExpensesTab groupId={group.id} uid={uid} expenses={expenses} currency={group.currency} localNames={buildLocalNames([group])} />
      )}
      {tab === 'balances' && (
        <BalancesTab groupId={group.id} uid={uid} expenses={expenses} currency={group.currency} localNames={buildLocalNames([group])} />
      )}
      {tab === 'members' && <MembersTab group={group} uid={uid} />}

      {/* FAB añadir gasto */}
      <Link
        to={`/group/${group.id}/add`}
        className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-600 sm:bottom-8 sm:right-8"
      >
        <PlusIcon className="h-5 w-5" />
        Añadir gasto
      </Link>
    </div>
  )
}

// --------------------------------------------------------------------------

function ExpensesTab({
  groupId,
  uid,
  expenses,
  currency,
  localNames,
}: {
  groupId: string
  uid: string
  expenses: Expense[] | null
  currency: string
  localNames: Record<string, string>
}) {
  const { name: userName } = useUsers()
  const name = (id: string) => localNames[id] ?? userName(id)
  const navigate = useNavigate()

  if (!expenses) return <p className="p-6 text-gray-400">Cargando…</p>
  if (expenses.length === 0)
    return (
      <div className="p-8 text-center text-gray-500">
        <p>{pick(EMPTY_EXPENSES, groupId)}</p>
        <p className="mt-1 text-sm text-gray-400">Dale a “Añadir gasto” y que empiece el sablazo.</p>
      </div>
    )

  return (
    <ul className="divide-y divide-gray-100 px-4 pb-28 sm:px-8">
      {expenses.map((e) => {
        const date = e.date?.toDate() ?? new Date()
        if (e.kind === 'settlement') {
          const to = Object.keys(e.splits)[0]
          return (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">💸</span>
              <div className="min-w-0 flex-1">
                <p className="text-gray-800">
                  <span className="font-semibold">{name(e.paidBy)}</span> pagó a{' '}
                  <span className="font-semibold">{name(to)}</span>
                </p>
                <p className="text-xs text-gray-400">{formatDate(date)} · Pago</p>
              </div>
              <span className="font-semibold text-gray-600">{formatMoney(e.amount, e.currency)}</span>
            </li>
          )
        }
        const cat = getCategory(e.category)
        const mine = (e.paidBy === uid ? e.amount : 0) - (e.splits[uid] ?? 0)
        return (
          <li key={e.id}>
            <button
              onClick={() => navigate(`/group/${groupId}/expense/${e.id}`)}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
                {cat.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{e.description}</p>
                <p className="truncate text-xs text-gray-400">
                  {name(e.paidBy)} pagó {formatMoney(e.amount, e.currency)} · {formatDate(date)}
                </p>
              </div>
              {Math.abs(mine) >= 0.01 && (
                <div className="text-right">
                  <span className="block text-[11px] text-gray-400">
                    {mine > 0 ? 'prestaste' : 'debes'}
                  </span>
                  <span className={`text-sm font-bold ${mine > 0 ? 'text-brand-600' : 'text-rose-500'}`}>
                    {formatMoney(Math.abs(mine), e.currency)}
                  </span>
                </div>
              )}
            </button>
          </li>
        )
      })}
      <li className="pt-4 text-center text-xs text-gray-300">Toca un gasto para editarlo o borrarlo · {currency}</li>
    </ul>
  )
}

// --------------------------------------------------------------------------

function BalancesTab({
  groupId,
  uid,
  expenses,
  currency,
  localNames,
}: {
  groupId: string
  uid: string
  expenses: Expense[] | null
  currency: string
  localNames: Record<string, string>
}) {
  const { name: userName } = useUsers()
  const name = (id: string) => localNames[id] ?? userName(id)
  const debts = useMemo(() => (expenses ? simplifyDebts(computeNetBalances(expenses)) : []), [expenses])

  if (!expenses) return <p className="p-6 text-gray-400">Cargando…</p>

  return (
    <div className="px-4 py-4 pb-28 sm:px-8">
      {debts.length === 0 ? (
        <div className="rounded-2xl bg-brand-50 p-6 text-center text-brand-700">
          <p className="text-lg font-semibold">{pick(ALL_SETTLED_GROUP, groupId)}</p>
          <p className="mt-1 text-sm">Nadie debe nada. Por ahora.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {debts.map((d, i) => {
            const involvesMe = d.from === uid || d.to === uid
            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                  involvesMe ? 'border-brand-200 bg-white' : 'border-gray-100 bg-white'
                }`}
              >
                <span className="text-xl">➡️</span>
                <p className="flex-1 text-gray-700">
                  <span className="font-semibold">{d.from === uid ? 'Tú' : name(d.from)}</span>{' '}
                  {d.from === uid ? 'debes a' : 'debe a'}{' '}
                  <span className="font-semibold">{d.to === uid ? 'ti' : name(d.to)}</span>
                </p>
                <span className="font-bold text-gray-800">{formatMoney(d.amount, currency)}</span>
              </li>
            )
          })}
        </ul>
      )}

      <Link
        to={`/group/${groupId}/settle`}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-brand-500 px-4 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        <CheckIcon className="h-5 w-5" />
        Saldar deudas
      </Link>
    </div>
  )
}

// --------------------------------------------------------------------------

function MembersTab({ group, uid }: { group: import('../lib/types').Group; uid: string }) {
  const { name, get } = useUsers()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const isOwner = group.createdBy === uid
  const locals = group.localMembers ?? []

  const inviteLink = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${group.id}`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(group.id)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      /* nada */
    }
  }

  async function share() {
    const text = `Únete a mi grupo "${group.name}" en Split App: ${inviteLink}`
    try {
      if (navigator.share) await navigator.share({ title: 'Split App', text, url: inviteLink })
      else {
        await navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* cancelado */
    }
  }

  async function addPerson() {
    const personName = window.prompt('Nombre de la persona (sin cuenta):')
    if (personName && personName.trim()) {
      await addLocalMember(group.id, personName.trim())
    }
  }

  async function addByEmail() {
    const email = window.prompt('Correo de la persona (debe tener cuenta en Split App):')
    if (!email || !email.trim()) return
    const res = await addMemberByEmail(group.id, email, group.memberIds)
    setMsg(
      res === 'added'
        ? '¡Añadido! 🎉'
        : res === 'already'
          ? 'Esa persona ya está en el grupo.'
          : 'No hay ninguna cuenta con ese correo. Dile que entre una vez, o añádela como “persona sin cuenta”.',
    )
    setTimeout(() => setMsg(null), 4000)
  }

  async function rename() {
    const newName = window.prompt('Nuevo nombre del grupo:', group.name)
    if (newName && newName.trim()) await renameGroup(group.id, newName.trim())
  }

  async function leave() {
    if (window.confirm('¿Salir de este grupo?')) {
      await leaveGroup(group.id, uid)
      navigate('/')
    }
  }

  return (
    <div className="px-4 py-4 pb-28 sm:px-8">
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <ShareIcon className="h-5 w-5" />
          {copied ? '¡Copiado!' : 'Invitar por enlace'}
        </button>
        <button
          onClick={addPerson}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <PlusIcon className="h-5 w-5" />
          Añadir persona
        </button>
        <button
          onClick={addByEmail}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <PlusIcon className="h-5 w-5" />
          Añadir por correo
        </button>
      </div>
      {msg && <p className="mb-3 text-center text-sm text-gray-600">{msg}</p>}

      {/* Código y enlace del grupo, visibles para compartir */}
      <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-500">Código del grupo</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate rounded border border-gray-200 bg-white px-2 py-1.5 font-mono text-sm text-gray-700">
            {group.id}
          </code>
          <button
            onClick={copyCode}
            className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copiedCode ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Tu amigo puede pegar este código en <b>“Unirme con código”</b>, o abrir este enlace:
        </p>
        <p className="mt-1 break-all text-xs text-brand-700">{inviteLink}</p>
      </div>

      <p className="mb-4 text-center text-xs text-gray-400">
        “Persona” = alguien sin la app (lo gestionas tú). “Por correo/enlace” = cuenta real.
      </p>

      <ul className="space-y-2">
        {/* Usuarios reales */}
        {group.memberIds.map((m) => {
          const p = get(m)
          return (
            <li key={m} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <Avatar emoji={p?.emoji} name={p?.name} className="h-10 w-10 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">
                  {m === uid ? 'Tú' : name(m)}
                  {group.createdBy === m && <span className="ml-2 text-xs text-gray-400">· admin</span>}
                </p>
                {p?.email && <p className="truncate text-xs text-gray-400">{p.email}</p>}
              </div>
              {isOwner && m !== uid && (
                <button
                  onClick={() => removeMember(group.id, m)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                  title="Quitar del grupo"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </li>
          )
        })}
        {/* Personas sin cuenta */}
        {locals.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
            <Avatar name={l.name} className="h-10 w-10 text-lg bg-gray-200 text-gray-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-800">{l.name}</p>
              <p className="text-xs text-gray-400">sin cuenta</p>
            </div>
            <button
              onClick={() => removeLocalMember(group.id, locals, l.id)}
              className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
              title="Quitar del grupo"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2">
        {isOwner && (
          <button
            onClick={rename}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cambiar nombre del grupo
          </button>
        )}
        <button
          onClick={leave}
          className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Salir del grupo
        </button>
      </div>
    </div>
  )
}
