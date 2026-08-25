import { ancestorsOf, descendantsOf } from "./kinship"
import type { BranchAssignment, FamilyGraph } from "./types"

/** How many distinct branch hues the palette provides. */
export const BRANCH_SLOTS = 8

/** Slots 0-3 are the four grandparent lines; 4 is the focus person's own line. */
const OWN_LINE_SLOT = 4

/**
 * Assigns a colour slot to each person, relative to the person in focus.
 *
 * The four grandparent lines seed slots 0-3, in the order paternal-paternal,
 * paternal-maternal, maternal-paternal, maternal-maternal — the quadrants of a
 * pedigree chart. Colour is decided by the *path* taken from the focus person
 * upwards, so a great-grandparent five steps up still carries the hue of the
 * quadrant you reach them through.
 *
 * Everyone who is not a direct ancestor takes the hue of the line they share
 * with the focus person: an aunt through the paternal grandparents reads as
 * paternal, a cousin through the maternal ones as maternal. The focus person
 * and their descendants get a line of their own, because they descend from all
 * four quadrants and picking one would be arbitrary.
 *
 * The net effect is that the palette always answers the same question — which
 * side of *your* family is this? — from wherever you are standing.
 */
export function assignBranches(
  graph: FamilyGraph,
  focusId: string | null
): BranchAssignment {
  const branchOf = new Map<string, number>()
  const seeds: BranchAssignment["seeds"] = []

  if (!focusId || !graph.personById.has(focusId)) {
    return applyOverrides(graph, branchOf, seeds)
  }

  /* --------------------- 1. the focus person's own line --------------------- */

  branchOf.set(focusId, OWN_LINE_SLOT)
  for (const descendantId of descendantsOf(graph, focusId).keys()) {
    branchOf.set(descendantId, OWN_LINE_SLOT)
  }
  seeds.push({
    slot: OWN_LINE_SLOT,
    personId: focusId,
    label: graph.personById.get(focusId)?.name ?? focusId,
  })

  /* ------------------------ 2. the ancestral quadrants ---------------------- */

  // Breadth-first up the pedigree, carrying the path taken to get there. The
  // first two steps of that path are what pick the quadrant.
  const quadrantOf = new Map<string, number>()
  let frontier: Array<{ id: string; path: number[] }> = [
    { id: focusId, path: [] },
  ]

  while (frontier.length > 0) {
    const next: Array<{ id: string; path: number[] }> = []

    for (const { id, path } of frontier) {
      const parents = graph.parentsOf.get(id) ?? []

      parents.forEach((parentId, index) => {
        if (quadrantOf.has(parentId)) return

        const nextPath = [...path, index]
        // A parent shares the hue of their own first parent's quadrant; from
        // the grandparents up, the first two steps name the quadrant outright.
        const slot =
          nextPath.length === 1
            ? nextPath[0] * 2
            : nextPath[0] * 2 + nextPath[1]

        quadrantOf.set(parentId, Math.min(slot, 3))
        next.push({ id: parentId, path: nextPath })
      })
    }

    frontier = next
  }

  for (const [personId, slot] of quadrantOf) {
    if (!branchOf.has(personId)) branchOf.set(personId, slot)
  }

  // Name each quadrant after the oldest person heading it, for a legend.
  for (const slot of [0, 1, 2, 3]) {
    const head = [...quadrantOf.entries()].find(([, value]) => value === slot)
    if (!head) continue
    seeds.push({
      slot,
      personId: head[0],
      label: graph.personById.get(head[0])?.name ?? head[0],
    })
  }

  /* ------------------- 3. everyone else, by shared ancestry ------------------ */

  for (const person of graph.people) {
    if (branchOf.has(person.id)) continue

    // The closest ancestor this person shares with one of the focus person's
    // lines decides their colour — that is the branch they hang off.
    let best: { depth: number; slot: number } | null = null
    for (const [ancestorId, depth] of ancestorsOf(graph, person.id)) {
      const slot = quadrantOf.get(ancestorId)
      if (slot === undefined) continue
      if (
        !best ||
        depth < best.depth ||
        (depth === best.depth && slot < best.slot)
      ) {
        best = { depth, slot }
      }
    }

    if (best) branchOf.set(person.id, best.slot)
  }

  /* ------------------------- 4. partners join in ---------------------------- */

  // Someone who married in has no line of their own; taking their spouse's
  // keeps a couple reading as one unit rather than two unrelated cards.
  for (const union of graph.unions) {
    const slots = union.partnerIds
      .map((id) => branchOf.get(id))
      .filter((slot): slot is number => slot !== undefined)
    if (slots.length === 0) continue
    for (const partnerId of union.partnerIds) {
      if (!branchOf.has(partnerId)) branchOf.set(partnerId, Math.min(...slots))
    }
  }

  return applyOverrides(graph, branchOf, seeds)
}

/** An explicit `branchId` always wins over the computed assignment. */
function applyOverrides(
  graph: FamilyGraph,
  branchOf: Map<string, number>,
  seeds: BranchAssignment["seeds"]
): BranchAssignment {
  const manual = new Map<string, number>()

  for (const person of graph.people) {
    if (!person.branchId) continue
    if (!manual.has(person.branchId)) manual.set(person.branchId, manual.size)
    branchOf.set(person.id, manual.get(person.branchId)! % BRANCH_SLOTS)
  }

  return { branchOf, seeds }
}
