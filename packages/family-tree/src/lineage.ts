import { ancestorsOf, descendantsOf } from "./kinship"
import type { FamilyGraph, Lineage } from "./types"

/**
 * The set of people considered "on the focus person's line": everyone above
 * them, everyone below them, their partners and their siblings.
 *
 * Drives both the dimming in `highlight` mode and the filter in `isolate` mode.
 */
export function lineageOf(graph: FamilyGraph, focusId: string): Lineage {
  const ancestors = new Set(ancestorsOf(graph, focusId).keys())
  const descendants = new Set(descendantsOf(graph, focusId).keys())
  const partners = new Set(graph.partnersOf.get(focusId) ?? [])

  const siblings = new Set<string>()
  for (const parentId of graph.parentsOf.get(focusId) ?? []) {
    for (const childId of graph.childrenOf.get(parentId) ?? []) {
      if (childId !== focusId) siblings.add(childId)
    }
  }

  const all = new Set<string>([focusId])
  for (const set of [ancestors, descendants, partners, siblings]) {
    for (const id of set) all.add(id)
  }

  // Ancestors' and descendants' partners come along too — a grandmother
  // without her husband beside her reads as an error rather than a filter.
  for (const id of [...ancestors, ...descendants]) {
    for (const partnerId of graph.partnersOf.get(id) ?? []) all.add(partnerId)
  }

  return { focusId, ancestors, descendants, partners, siblings, all }
}
