import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Group, Expense, GroupType, ExpenseKind, UserProfile } from '../lib/types'

// ---------------------------------------------------------------------------
// Perfiles de usuario
// ---------------------------------------------------------------------------

export async function upsertUserProfile(p: {
  uid: string
  name: string
  email: string
  photoURL?: string | null
}) {
  await setDoc(
    doc(db, 'users', p.uid),
    {
      name: p.name,
      email: p.email,
      emailLower: p.email.toLowerCase(),
      photoURL: p.photoURL ?? null,
    },
    { merge: true },
  )
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) }
}

// ---------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------

export function useMyGroups(uid: string | undefined): Group[] | null {
  const [groups, setGroups] = useState<Group[] | null>(null)
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid))
    return onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Group, 'id'>) })))
    })
  }, [uid])
  return groups
}

export function useGroup(groupId: string | undefined): Group | null | undefined {
  // undefined = cargando, null = no existe / sin acceso
  const [group, setGroup] = useState<Group | null | undefined>(undefined)
  useEffect(() => {
    if (!groupId) return
    return onSnapshot(
      doc(db, 'groups', groupId),
      (snap) => setGroup(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Group, 'id'>) } : null),
      () => setGroup(null),
    )
  }, [groupId])
  return group
}

export async function createGroup(input: {
  name: string
  type: GroupType
  currency: string
  uid: string
}): Promise<string> {
  const ref = await addDoc(collection(db, 'groups'), {
    name: input.name,
    type: input.type,
    currency: input.currency,
    memberIds: [input.uid],
    createdBy: input.uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function renameGroup(groupId: string, name: string) {
  await updateDoc(doc(db, 'groups', groupId), { name })
}

export async function joinGroup(groupId: string, uid: string) {
  await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(uid) })
}

export async function leaveGroup(groupId: string, uid: string) {
  await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayRemove(uid) })
}

export async function removeMember(groupId: string, uid: string) {
  await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayRemove(uid) })
}

export async function deleteGroup(groupId: string) {
  await deleteDoc(doc(db, 'groups', groupId))
}

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

export function useExpenses(groupId: string | undefined): Expense[] | null {
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  useEffect(() => {
    if (!groupId) return
    const q = query(collection(db, 'groups', groupId, 'expenses'), orderBy('date', 'desc'))
    return onSnapshot(
      q,
      (snap) =>
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }))),
      () => setExpenses([]),
    )
  }, [groupId])
  return expenses
}

/** Gastos de varios grupos a la vez: devuelve un mapa groupId -> gastos. */
export function useGroupsExpenses(groups: Group[] | null): Record<string, Expense[]> {
  const [map, setMap] = useState<Record<string, Expense[]>>({})
  const ids = (groups ?? []).map((g) => g.id).sort().join(',')
  useEffect(() => {
    if (!groups || groups.length === 0) {
      setMap({})
      return
    }
    const unsubs = groups.map((g) =>
      onSnapshot(
        query(collection(db, 'groups', g.id, 'expenses'), orderBy('date', 'desc')),
        (snap) =>
          setMap((prev) => ({
            ...prev,
            [g.id]: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) })),
          })),
      ),
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])
  return map
}

export interface ExpenseInput {
  description: string
  amount: number
  currency: string
  category: string
  paidBy: string
  splits: Record<string, number>
  kind: ExpenseKind
  date: Date
  createdBy: string
}

export async function addExpense(groupId: string, input: ExpenseInput) {
  await addDoc(collection(db, 'groups', groupId, 'expenses'), {
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    paidBy: input.paidBy,
    splits: input.splits,
    kind: input.kind,
    date: Timestamp.fromDate(input.date),
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  })
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  input: Omit<ExpenseInput, 'createdBy'>,
) {
  await updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), {
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    paidBy: input.paidBy,
    splits: input.splits,
    kind: input.kind,
    date: Timestamp.fromDate(input.date),
  })
}

export async function deleteExpense(groupId: string, expenseId: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId))
}
