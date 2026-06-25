import type { Group } from './types'

export const LOCAL_PREFIX = 'local_'

export function isLocal(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX)
}

export function newLocalId(): string {
  return LOCAL_PREFIX + Math.random().toString(36).slice(2, 10)
}

/** Todos los ids del grupo: usuarios reales + personas sin cuenta. */
export function allMemberIds(group: Group): string[] {
  return [...group.memberIds, ...(group.localMembers ?? []).map((l) => l.id)]
}

/** Mapa id -> nombre de las personas sin cuenta de varios grupos. */
export function buildLocalNames(groups: Group[] | null): Record<string, string> {
  const map: Record<string, string> = {}
  for (const g of groups ?? []) {
    for (const l of g.localMembers ?? []) map[l.id] = l.name
  }
  return map
}
