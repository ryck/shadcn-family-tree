import type {
  Diagnostic,
  FamilyGraph,
  Partnership,
  PartnershipStatus,
  Person,
  Union,
} from "./types"

/** Stable key for a set of parents, order-independent. */
function unionKey(ids: string[]): string {
  return [...ids].sort().join("+")
}

function push<TKey, TValue>(
  map: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue
) {
  const existing = map.get(key)
  if (existing) existing.push(value)
  else map.set(key, [value])
}

/**
 * Comparable sort key for a free-form date string. Pulls out the first 4-digit
 * year so "1952-03-01", "1952" and "c. 1952" all sort together, and returns
 * Infinity for anything undated so it lands last.
 */
export function dateKey(value: string | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY
  const year = /\d{4}/.exec(value)
  if (!year) return Number.POSITIVE_INFINITY
  const month = /\d{4}-(\d{2})/.exec(value)
  const day = /\d{4}-\d{2}-(\d{2})/.exec(value)
  return (
    Number(year[0]) * 10000 +
    (month ? Number(month[1]) : 0) * 100 +
    (day ? Number(day[1]) : 0)
  )
}

/**
 * Builds the internal graph from the flat person list.
 *
 * Unions are derived in three passes:
 *   1. every distinct parent-set that has children becomes a union,
 *   2. every declared partnership without children becomes a childless union,
 *   3. each person's unions are ordered so successive partners lay out left to right.
 *
 * Bad input produces diagnostics rather than exceptions — a tree that renders
 * with a warning is more useful than one that throws.
 */
export function buildGraph(input: Person[]): FamilyGraph {
  const diagnostics: Diagnostic[] = []
  const personById = new Map<string, Person>()

  for (const person of input) {
    if (personById.has(person.id)) {
      diagnostics.push({
        code: "duplicate-id",
        personId: person.id,
        message: `Duplicate id "${person.id}"; the later entry was ignored.`,
      })
      continue
    }
    personById.set(person.id, person)
  }

  const people = [...personById.values()]

  /* ---------------------------- normalise parents --------------------------- */

  const parentsOf = new Map<string, string[]>()

  for (const person of people) {
    const raw = person.parentIds ?? []
    const parents: string[] = []

    for (const parentId of raw) {
      if (parentId === person.id) {
        diagnostics.push({
          code: "self-reference",
          personId: person.id,
          message: `"${person.name}" is listed as their own parent.`,
        })
        continue
      }
      if (!personById.has(parentId)) {
        diagnostics.push({
          code: "unknown-parent",
          personId: person.id,
          message: `"${person.name}" references unknown parent "${parentId}".`,
        })
        continue
      }
      if (!parents.includes(parentId)) parents.push(parentId)
    }

    if (parents.length > 2) {
      diagnostics.push({
        code: "too-many-parents",
        personId: person.id,
        message: `"${person.name}" has ${parents.length} parents; only the first two are laid out.`,
      })
      parents.length = 2
    }

    parentsOf.set(person.id, parents)
  }

  breakParentCycles(people, parentsOf, personById, diagnostics)

  /* --------------------------- normalise partners --------------------------- */

  // Symmetric partner set, plus the richest partnership record for each pair.
  const partnerSet = new Map<string, Set<string>>()
  const partnershipByPair = new Map<string, Partnership & { ownerId: string }>()

  const linkPartners = (a: string, b: string) => {
    if (!partnerSet.has(a)) partnerSet.set(a, new Set())
    if (!partnerSet.has(b)) partnerSet.set(b, new Set())
    partnerSet.get(a)!.add(b)
    partnerSet.get(b)!.add(a)
  }

  for (const person of people) {
    const declared: Array<{ partnerId: string; record?: Partnership }> = [
      ...(person.partnerIds ?? []).map((partnerId) => ({ partnerId })),
      ...(person.partnerships ?? []).map((record) => ({
        partnerId: record.partnerId,
        record,
      })),
    ]

    for (const { partnerId, record } of declared) {
      if (partnerId === person.id) {
        diagnostics.push({
          code: "self-reference",
          personId: person.id,
          message: `"${person.name}" is listed as their own partner.`,
        })
        continue
      }
      if (!personById.has(partnerId)) {
        diagnostics.push({
          code: "unknown-partner",
          personId: person.id,
          message: `"${person.name}" references unknown partner "${partnerId}".`,
        })
        continue
      }

      linkPartners(person.id, partnerId)

      // A `partnerships` record beats a bare `partnerIds` entry for the same pair.
      const key = unionKey([person.id, partnerId])
      if (record && !partnershipByPair.has(key)) {
        partnershipByPair.set(key, { ...record, ownerId: person.id })
      }
    }
  }

  /* ------------------------------ build unions ------------------------------ */

  const unionByKey = new Map<string, Union>()
  const orderedPeople = people // input order drives tie-breaks below

  const ensureUnion = (partnerIds: string[]): Union => {
    const key = unionKey(partnerIds)
    const existing = unionByKey.get(key)
    if (existing) return existing

    const record = partnershipByPair.get(key)
    const union: Union = {
      id: `u:${key}`,
      // Keep declaration order where we have it, so couples read consistently.
      partnerIds: orderPartners(partnerIds, orderedPeople),
      childIds: [],
      status: record?.status ?? inferStatus(partnerIds, personById),
      since: record?.since,
      until: record?.until,
    }
    unionByKey.set(key, union)
    return union
  }

  // Pass 1 — parent sets that have children.
  for (const person of orderedPeople) {
    const parents = parentsOf.get(person.id) ?? []
    if (parents.length === 0) continue
    ensureUnion(parents).childIds.push(person.id)
  }

  // Pass 2 — declared partnerships with no shared children.
  for (const [personId, partners] of partnerSet) {
    for (const partnerId of partners) {
      ensureUnion([personId, partnerId])
    }
  }

  /* ------------------------------- indexes -------------------------------- */

  const unions = [...unionByKey.values()]
  const unionById = new Map(unions.map((u) => [u.id, u]))
  const unionsByPartner = new Map<string, Union[]>()
  const unionByChild = new Map<string, Union>()
  const childrenOf = new Map<string, string[]>()
  const partnersOf = new Map<string, string[]>()

  for (const union of unions) {
    // Children read in birth order; undated children keep their input order.
    union.childIds.sort((a, b) => {
      const delta =
        dateKey(personById.get(a)?.birth?.date) -
        dateKey(personById.get(b)?.birth?.date)
      if (delta !== 0 && Number.isFinite(delta)) return delta
      return 0
    })

    for (const partnerId of union.partnerIds) {
      push(unionsByPartner, partnerId, union)
      for (const childId of union.childIds) push(childrenOf, partnerId, childId)
      for (const other of union.partnerIds) {
        if (other !== partnerId) push(partnersOf, partnerId, other)
      }
    }
    for (const childId of union.childIds) unionByChild.set(childId, union)
  }

  // Pass 3 — order each person's unions so successive partners lay out left to right.
  for (const [personId, list] of unionsByPartner) {
    list.sort((a, b) => unionOrder(a, personById) - unionOrder(b, personById))
    unionsByPartner.set(personId, list)
  }

  for (const person of people) {
    if (!parentsOf.has(person.id)) parentsOf.set(person.id, [])
    if (!childrenOf.has(person.id)) childrenOf.set(person.id, [])
    if (!partnersOf.has(person.id)) partnersOf.set(person.id, [])
  }

  return {
    people,
    personById,
    unions,
    unionById,
    unionsByPartner,
    unionByChild,
    parentsOf,
    childrenOf,
    partnersOf,
    diagnostics,
  }
}

/**
 * Sort key for one of a person's unions: the partnership start date if known,
 * else the earliest child's birth, else Infinity (undated unions trail).
 */
function unionOrder(union: Union, personById: Map<string, Person>): number {
  const since = dateKey(union.since)
  if (Number.isFinite(since)) return since

  let earliest = Number.POSITIVE_INFINITY
  for (const childId of union.childIds) {
    const born = dateKey(personById.get(childId)?.birth?.date)
    if (born < earliest) earliest = born
  }
  return earliest
}

/** Keeps partners in input order so a couple always renders the same way round. */
function orderPartners(ids: string[], people: Person[]): string[] {
  const index = new Map(people.map((p, i) => [p.id, i]))
  return [...ids].sort((a, b) => (index.get(a) ?? 0) - (index.get(b) ?? 0))
}

/**
 * With no explicit record, a couple where one partner has died reads as
 * "widowed" rather than "married". Everything else defaults to married.
 */
function inferStatus(
  partnerIds: string[],
  personById: Map<string, Person>
): PartnershipStatus {
  if (partnerIds.length < 2) return "partnership"
  const anyDeceased = partnerIds.some((id) => personById.get(id)?.death)
  const allDeceased = partnerIds.every((id) => personById.get(id)?.death)
  return anyDeceased && !allDeceased ? "widowed" : "married"
}

/**
 * Parent links must form a DAG or generation assignment never terminates.
 * Cuts the back-edge of any cycle and reports it.
 */
function breakParentCycles(
  people: Person[],
  parentsOf: Map<string, string[]>,
  personById: Map<string, Person>,
  diagnostics: Diagnostic[]
) {
  const WHITE = 0
  const GREY = 1
  const BLACK = 2
  const colour = new Map<string, number>(people.map((p) => [p.id, WHITE]))

  const visit = (id: string) => {
    colour.set(id, GREY)
    const parents = parentsOf.get(id) ?? []
    const kept: string[] = []

    for (const parentId of parents) {
      const state = colour.get(parentId) ?? WHITE
      if (state === GREY) {
        diagnostics.push({
          code: "parent-cycle",
          personId: id,
          message: `Ancestry cycle through "${
            personById.get(parentId)?.name ?? parentId
          }"; that parent link was dropped.`,
        })
        continue // drop the back-edge
      }
      if (state === WHITE) visit(parentId)
      kept.push(parentId)
    }

    parentsOf.set(id, kept)
    colour.set(id, BLACK)
  }

  for (const person of people) {
    if (colour.get(person.id) === WHITE) visit(person.id)
  }
}
