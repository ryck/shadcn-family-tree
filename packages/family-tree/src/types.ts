/**
 * Public data model.
 *
 * Only `id`, `name` and `sex` are required. Relationships are expressed flatly —
 * a person points at their parents and their partners — and the internal graph
 * derives "unions" (couples) from that. See `graph.ts` for the derivation.
 */

export type Sex = "male" | "female" | "other" | "unknown"

export type PartnershipStatus =
  | "married"
  | "partnership"
  | "engaged"
  | "divorced"
  | "separated"
  | "widowed"

export interface LifeEvent {
  /** Any string. ISO dates sort correctly; "1952" and "c. 1880" render as-is. */
  date?: string
  place?: string
}

export interface Partnership {
  partnerId: string
  status?: PartnershipStatus
  since?: string
  until?: string
}

export interface Person {
  id: string
  name: string
  sex: Sex

  /** Zero, one or two parents. More than two is reported as a diagnostic and truncated. */
  parentIds?: string[]
  /** Symmetric; a one-sided declaration is repaired during normalisation. */
  partnerIds?: string[]
  /** Richer form of `partnerIds`. Takes precedence for any pair it covers. */
  partnerships?: Partnership[]

  nickname?: string
  birth?: LifeEvent
  death?: LifeEvent
  location?: string
  /** Overrides the computed branch colour. */
  branchId?: string
  /** Anything else you want to reach in `renderCard`. */
  meta?: Record<string, unknown>
}

/**
 * A couple, derived rather than authored. Every descent connector hangs off one,
 * and distinct unions are what separate half-siblings from full siblings.
 */
export interface Union {
  id: string
  /** One partner (single parent) or two. Ordered for stable left-to-right placement. */
  partnerIds: string[]
  childIds: string[]
  status?: PartnershipStatus
  since?: string
  until?: string
}

export type DiagnosticCode =
  | "unknown-parent"
  | "unknown-partner"
  | "too-many-parents"
  | "self-reference"
  | "duplicate-id"
  | "parent-cycle"

export interface Diagnostic {
  code: DiagnosticCode
  personId: string
  message: string
}

export interface FamilyGraph {
  people: Person[]
  personById: Map<string, Person>
  unions: Union[]
  unionById: Map<string, Union>
  /** Unions a person is a partner in, in placement order. */
  unionsByPartner: Map<string, Union[]>
  /** The union a person is a child of, if any. */
  unionByChild: Map<string, Union>
  parentsOf: Map<string, string[]>
  childrenOf: Map<string, string[]>
  partnersOf: Map<string, string[]>
  diagnostics: Diagnostic[]
}

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutNode {
  personId: string
  generation: number
  /** Left edge, in abstract layout units. */
  x: number
  /** Top edge, in abstract layout units. */
  y: number
  width: number
  height: number
}

/** The point a union's descent connector drops from. */
export interface UnionAnchor {
  unionId: string
  generation: number
  x: number
  y: number
  /** Partner card mid-heights, for drawing the horizontal couple link. */
  partnerPoints: Array<{ personId: string; x: number; y: number }>
  childPoints: Array<{ personId: string; x: number; y: number }>
}

export interface GenerationRow {
  generation: number
  y: number
  height: number
  personIds: string[]
}

export interface TreeLayout {
  nodes: LayoutNode[]
  nodeById: Map<string, LayoutNode>
  unions: UnionAnchor[]
  generations: GenerationRow[]
  bounds: Rect
}

export interface LayoutOptions {
  cardWidth: number
  cardHeight: number
  /** Horizontal gap between two partners in the same union. */
  partnerGap: number
  /** Horizontal gap between adjacent sibling subtrees. */
  siblingGap: number
  /** Horizontal gap between disconnected components. */
  componentGap: number
  /** Vertical gap between generation rows. */
  rowGap: number
}

/* -------------------------------------------------------------------------- */
/*                                  Kinship                                   */
/* -------------------------------------------------------------------------- */

export type RelationshipKind = "self" | "blood" | "affinal" | "step" | "none"

export type RelationshipType =
  | "self"
  | "partner"
  | "ex-partner"
  | "parent"
  | "child"
  | "sibling"
  | "half-sibling"
  | "grandparent"
  | "grandchild"
  | "pibling" // aunt / uncle
  | "nibling" // niece / nephew
  | "cousin"
  | "unrelated"

export interface Relationship {
  type: RelationshipType
  kind: RelationshipKind
  /** Cousin degree: 1 = first cousin. Undefined for non-cousins. */
  degree?: number
  /** Generations removed, for cousins and niblings/piblings. */
  removed?: number
  /** Generations up or down the direct line: 1 = parent/child, 2 = grandparent. */
  steps?: number
  /** True when the link runs through a partner rather than by blood. */
  inLaw?: boolean
  /** The rendered term, e.g. "second cousin once removed". */
  label: string
}

/* -------------------------------------------------------------------------- */
/*                                  Branches                                  */
/* -------------------------------------------------------------------------- */

export interface BranchAssignment {
  /** personId -> palette slot (0-based), or undefined for the neutral branch. */
  branchOf: Map<string, number>
  /** Palette slot -> the ancestor line that seeded it. */
  seeds: Array<{ slot: number; personId: string; label: string }>
}

export interface Lineage {
  focusId: string
  ancestors: Set<string>
  descendants: Set<string>
  partners: Set<string>
  siblings: Set<string>
  /** Union of all of the above plus the focus person. */
  all: Set<string>
}
