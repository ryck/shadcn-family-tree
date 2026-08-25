import type {
  FamilyGraph,
  Person,
  Relationship,
  RelationshipType,
  Sex,
} from "./types"

/* -------------------------------------------------------------------------- */
/*                                   Wording                                  */
/* -------------------------------------------------------------------------- */

type Gendered = { male: string; female: string; neutral: string }

const TERMS: Record<string, Gendered> = {
  parent: { male: "father", female: "mother", neutral: "parent" },
  child: { male: "son", female: "daughter", neutral: "child" },
  sibling: { male: "brother", female: "sister", neutral: "sibling" },
  partner: { male: "husband", female: "wife", neutral: "partner" },
  pibling: { male: "uncle", female: "aunt", neutral: "aunt or uncle" },
  nibling: { male: "nephew", female: "niece", neutral: "nibling" },
  grandparent: {
    male: "grandfather",
    female: "grandmother",
    neutral: "grandparent",
  },
  grandchild: {
    male: "grandson",
    female: "granddaughter",
    neutral: "grandchild",
  },
}

function term(key: keyof typeof TERMS, sex: Sex): string {
  const entry = TERMS[key]
  return sex === "male"
    ? entry.male
    : sex === "female"
      ? entry.female
      : entry.neutral
}

const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
]

function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`
}

/** "once removed", "twice removed", "3× removed". */
function removedSuffix(removed: number): string {
  if (removed === 0) return ""
  if (removed === 1) return " once removed"
  if (removed === 2) return " twice removed"
  if (removed === 3) return " three times removed"
  return ` ${removed}× removed`
}

/** 1 → "", 2 → "grand", 3 → "great-grand", 4 → "great-great-grand". */
function grandPrefix(steps: number): string {
  if (steps <= 1) return ""
  if (steps === 2) return "grand"
  return `${"great-".repeat(steps - 2)}grand`
}

/* -------------------------------------------------------------------------- */
/*                                  Ancestry                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every ancestor of `id` mapped to its distance in generations. When a person
 * is reachable by more than one path (cousin marriage, pedigree collapse) the
 * shortest distance wins, which is the convention genealogists use.
 */
export function ancestorsOf(
  graph: FamilyGraph,
  id: string,
  cache?: Map<string, Map<string, number>>
): Map<string, number> {
  const cached = cache?.get(id)
  if (cached) return cached

  const distances = new Map<string, number>()
  let frontier = [id]
  let depth = 0

  while (frontier.length > 0 && depth < 64) {
    depth++
    const next: string[] = []

    for (const current of frontier) {
      for (const parentId of graph.parentsOf.get(current) ?? []) {
        if (distances.has(parentId)) continue
        distances.set(parentId, depth)
        next.push(parentId)
      }
    }

    frontier = next
  }

  cache?.set(id, distances)
  return distances
}

/** All descendants of `id` mapped to their distance in generations. */
export function descendantsOf(
  graph: FamilyGraph,
  id: string
): Map<string, number> {
  const distances = new Map<string, number>()
  let frontier = [id]
  let depth = 0

  while (frontier.length > 0 && depth < 64) {
    depth++
    const next: string[] = []

    for (const current of frontier) {
      for (const childId of graph.childrenOf.get(current) ?? []) {
        if (distances.has(childId)) continue
        distances.set(childId, depth)
        next.push(childId)
      }
    }

    frontier = next
  }

  return distances
}

/* -------------------------------------------------------------------------- */
/*                            Relationship calculus                           */
/* -------------------------------------------------------------------------- */

export interface KinshipContext {
  ancestorCache: Map<string, Map<string, number>>
}

export function createKinshipContext(): KinshipContext {
  return { ancestorCache: new Map() }
}

const UNRELATED: Relationship = {
  type: "unrelated",
  kind: "none",
  label: "",
}

/**
 * Names `to`'s relationship as seen from `from` — the label answers
 * "who is this person to me?", so `relationshipTo(graph, me, x).label === "father"`
 * means x is my father.
 *
 * Resolution order: self, partner, direct line, common ancestor, step, in-law.
 * In-law is tried last because a blood link, however distant, is the more
 * informative answer whenever both exist.
 */
export function relationshipTo(
  graph: FamilyGraph,
  fromId: string,
  toId: string,
  ctx: KinshipContext = createKinshipContext()
): Relationship {
  const from = graph.personById.get(fromId)
  const to = graph.personById.get(toId)
  if (!from || !to) return UNRELATED

  if (fromId === toId) {
    return { type: "self", kind: "self", label: "active" }
  }

  const direct = bloodRelationship(graph, fromId, toId, ctx)
  if (direct) return direct

  const partner = partnerRelationship(graph, fromId, toId)
  if (partner) return partner

  const step = stepRelationship(graph, fromId, toId)
  if (step) return step

  const inLaw = inLawRelationship(graph, fromId, toId, ctx)
  if (inLaw) return inLaw

  return UNRELATED
}

function partnerRelationship(
  graph: FamilyGraph,
  fromId: string,
  toId: string
): Relationship | null {
  const unions = graph.unionsByPartner.get(fromId) ?? []
  const shared = unions.find((union) => union.partnerIds.includes(toId))
  if (!shared) return null

  const to = graph.personById.get(toId)!
  const ended = shared.status === "divorced" || shared.status === "separated"
  const base = term("partner", to.sex)

  if (shared.status === "widowed") {
    return {
      type: "partner",
      kind: "affinal",
      label: to.death ? `late ${base}` : base,
    }
  }

  return {
    type: ended ? "ex-partner" : "partner",
    kind: "affinal",
    label: ended ? `ex-${base}` : base,
  }
}

function bloodRelationship(
  graph: FamilyGraph,
  fromId: string,
  toId: string,
  ctx: KinshipContext
): Relationship | null {
  const fromAncestors = ancestorsOf(graph, fromId, ctx.ancestorCache)
  const toAncestors = ancestorsOf(graph, toId, ctx.ancestorCache)
  const to = graph.personById.get(toId)!
  const from = graph.personById.get(fromId)!

  // `to` is my ancestor.
  const upSteps = fromAncestors.get(toId)
  if (upSteps !== undefined) {
    const key = upSteps === 1 ? "parent" : "grandparent"
    const label =
      upSteps === 1
        ? term("parent", to.sex)
        : grandPrefix(upSteps) + term("parent", to.sex)
    return {
      type: key === "parent" ? "parent" : "grandparent",
      kind: "blood",
      steps: upSteps,
      label,
    }
  }

  // `to` is my descendant.
  const downSteps = toAncestors.get(fromId)
  if (downSteps !== undefined) {
    const label =
      downSteps === 1
        ? term("child", to.sex)
        : grandPrefix(downSteps) + term("child", to.sex)
    return {
      type: downSteps === 1 ? "child" : "grandchild",
      kind: "blood",
      steps: downSteps,
      label,
    }
  }

  // Collateral: find the common ancestor minimising (myDepth, theirDepth).
  let best: { mine: number; theirs: number } | null = null
  for (const [ancestorId, mine] of fromAncestors) {
    const theirs = toAncestors.get(ancestorId)
    if (theirs === undefined) continue
    if (
      !best ||
      mine + theirs < best.mine + best.theirs ||
      (mine + theirs === best.mine + best.theirs &&
        Math.abs(mine - theirs) < Math.abs(best.mine - best.theirs))
    ) {
      best = { mine, theirs }
    }
  }

  if (!best) return null

  const { mine, theirs } = best

  // Siblings.
  if (mine === 1 && theirs === 1) {
    const myParents = new Set(graph.parentsOf.get(fromId) ?? [])
    const theirParents = graph.parentsOf.get(toId) ?? []
    const shared = theirParents.filter((id) => myParents.has(id)).length
    const full = shared >= 2
    return {
      type: full ? "sibling" : "half-sibling",
      kind: "blood",
      label: full ? term("sibling", to.sex) : `half-${term("sibling", to.sex)}`,
    }
  }

  // Aunt / uncle and their greats: they are one step below our common ancestor.
  if (theirs === 1) {
    const prefix = "great-".repeat(mine - 2)
    return {
      type: "pibling",
      kind: "blood",
      removed: mine - 2,
      label: prefix + term("pibling", to.sex),
    }
  }

  // Niece / nephew and their greats.
  if (mine === 1) {
    const prefix =
      theirs === 2
        ? ""
        : theirs === 3
          ? "grand-"
          : "great-".repeat(theirs - 3) + "grand-"
    return {
      type: "nibling",
      kind: "blood",
      removed: theirs - 2,
      label: prefix + term("nibling", to.sex),
    }
  }

  // Cousins.
  const degree = Math.min(mine, theirs) - 1
  const removed = Math.abs(mine - theirs)
  void from
  return {
    type: "cousin",
    kind: "blood",
    degree,
    removed,
    label: `${ordinal(degree)} cousin${removedSuffix(removed)}`,
  }
}

/**
 * A step relation runs through a parent's other partner: my parent's spouse who
 * is not my parent is my step-parent, and their children by another union are my
 * step-siblings.
 */
function stepRelationship(
  graph: FamilyGraph,
  fromId: string,
  toId: string
): Relationship | null {
  const myParents = graph.parentsOf.get(fromId) ?? []
  const to = graph.personById.get(toId)!

  const stepParents = new Set<string>()
  for (const parentId of myParents) {
    for (const union of graph.unionsByPartner.get(parentId) ?? []) {
      for (const partnerId of union.partnerIds) {
        if (partnerId !== parentId && !myParents.includes(partnerId)) {
          stepParents.add(partnerId)
        }
      }
    }
  }

  if (stepParents.has(toId)) {
    return {
      type: "parent",
      kind: "step",
      steps: 1,
      label: `step-${term("parent", to.sex)}`,
    }
  }

  // Children of a step-parent, by any union that isn't shared with my parent.
  for (const stepParentId of stepParents) {
    if ((graph.childrenOf.get(stepParentId) ?? []).includes(toId)) {
      return {
        type: "sibling",
        kind: "step",
        label: `step-${term("sibling", to.sex)}`,
      }
    }
  }

  // Mirror: my partner's child from another union is my step-child.
  for (const union of graph.unionsByPartner.get(fromId) ?? []) {
    for (const partnerId of union.partnerIds) {
      if (partnerId === fromId) continue
      const theirChildren = graph.childrenOf.get(partnerId) ?? []
      const mine = graph.childrenOf.get(fromId) ?? []
      if (theirChildren.includes(toId) && !mine.includes(toId)) {
        return {
          type: "child",
          kind: "step",
          steps: 1,
          label: `step-${term("child", to.sex)}`,
        }
      }
    }
  }

  return null
}

/**
 * Marriage-based links, tried only once blood and step have failed. Two routes:
 * the blood relative of my partner, or the partner of my blood relative.
 */
function inLawRelationship(
  graph: FamilyGraph,
  fromId: string,
  toId: string,
  ctx: KinshipContext
): Relationship | null {
  const to = graph.personById.get(toId)!

  // Route 1 — my partner's relative. "my wife's mother" -> mother-in-law.
  for (const partnerId of graph.partnersOf.get(fromId) ?? []) {
    const via = bloodRelationship(graph, partnerId, toId, ctx)
    if (via) return asInLaw(via)
  }

  // Route 2 — my relative's partner. "my sister's husband" -> brother-in-law.
  for (const theirPartnerId of graph.partnersOf.get(toId) ?? []) {
    const via = bloodRelationship(graph, fromId, theirPartnerId, ctx)
    if (via) return asInLaw(via, to.sex)
  }

  return null
}

/**
 * Converts a blood term to its in-law form. When `sex` is given the term is
 * re-gendered for the in-law themselves — my sister's husband is a
 * brother-in-law, not a sister-in-law.
 */
function asInLaw(relationship: Relationship, sex?: Sex): Relationship {
  const label = sex ? regender(relationship, sex) : relationship.label
  return {
    ...relationship,
    kind: "affinal",
    inLaw: true,
    label: `${label}-in-law`,
  }
}

function regender(relationship: Relationship, sex: Sex): string {
  const key: Record<RelationshipType, keyof typeof TERMS | null> = {
    self: null,
    partner: "partner",
    "ex-partner": "partner",
    parent: "parent",
    child: "child",
    sibling: "sibling",
    "half-sibling": "sibling",
    grandparent: "grandparent",
    grandchild: "grandchild",
    pibling: "pibling",
    nibling: "nibling",
    cousin: null,
    unrelated: null,
  }

  const termKey = key[relationship.type]
  if (!termKey) return relationship.label

  // Preserve any prefix ("great-", "grand") that the blood label carried.
  const base = term(termKey, sex)
  const match = /^((?:great-)*(?:grand-?)?)/.exec(relationship.label)
  return (match?.[1] ?? "") + base
}

/** Convenience wrapper used by the card renderer. */
export function relationshipLabel(
  graph: FamilyGraph,
  fromId: string,
  toId: string,
  ctx?: KinshipContext
): string {
  return relationshipTo(graph, fromId, toId, ctx).label
}

export type { Person }
