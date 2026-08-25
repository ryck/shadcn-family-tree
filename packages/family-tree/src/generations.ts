import type { FamilyGraph } from "./types"

const MAX_PASSES = 64

/**
 * Assigns every person a generation index, where 0 is the oldest generation
 * present and larger numbers are further down.
 *
 * A single BFS is not enough: cousin marriages and uncle/niece unions give the
 * same person two different depths depending on the path taken. Instead we
 * relax to a fixpoint over two rules, which always converges upward and so
 * terminates once the parent graph is acyclic (`buildGraph` guarantees that):
 *
 *   1. a child sits strictly below its lowest parent
 *   2. partners share a generation, taking the lower of the two
 */
export function assignGenerations(graph: FamilyGraph): Map<string, number> {
  const generation = new Map<string, number>(
    graph.people.map((person) => [person.id, 0])
  )

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false

    for (const person of graph.people) {
      const parents = graph.parentsOf.get(person.id) ?? []
      if (parents.length === 0) continue

      let lowestParent = -Infinity
      for (const parentId of parents) {
        lowestParent = Math.max(lowestParent, generation.get(parentId) ?? 0)
      }

      const target = lowestParent + 1
      if (target > (generation.get(person.id) ?? 0)) {
        generation.set(person.id, target)
        changed = true
      }
    }

    for (const union of graph.unions) {
      let lowest = -Infinity
      for (const partnerId of union.partnerIds) {
        lowest = Math.max(lowest, generation.get(partnerId) ?? 0)
      }
      for (const partnerId of union.partnerIds) {
        if ((generation.get(partnerId) ?? 0) < lowest) {
          generation.set(partnerId, lowest)
          changed = true
        }
      }
    }

    if (!changed) break
  }

  normaliseToZero(generation)
  return generation
}

/**
 * Shifts each connected component so the whole tree starts at generation 0.
 * Components are normalised independently — two unrelated families should both
 * begin at the top rather than one floating below the other.
 */
function normaliseToZero(generation: Map<string, number>) {
  let min = Number.POSITIVE_INFINITY
  for (const value of generation.values()) min = Math.min(min, value)
  if (min === 0 || !Number.isFinite(min)) return
  for (const [id, value] of generation) generation.set(id, value - min)
}

/**
 * Splits the graph into connected components (following parent, child and
 * partner links alike), in input order. Layout places these side by side.
 */
export function findComponents(graph: FamilyGraph): string[][] {
  const seen = new Set<string>()
  const components: string[][] = []

  for (const person of graph.people) {
    if (seen.has(person.id)) continue

    const component: string[] = []
    const queue = [person.id]
    seen.add(person.id)

    while (queue.length > 0) {
      const id = queue.shift()!
      component.push(id)

      const neighbours = [
        ...(graph.parentsOf.get(id) ?? []),
        ...(graph.childrenOf.get(id) ?? []),
        ...(graph.partnersOf.get(id) ?? []),
      ]

      for (const neighbour of neighbours) {
        if (seen.has(neighbour)) continue
        seen.add(neighbour)
        queue.push(neighbour)
      }
    }

    components.push(component)
  }

  return components
}
