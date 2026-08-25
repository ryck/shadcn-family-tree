import { assignGenerations, findComponents } from "./generations"
import type {
  FamilyGraph,
  GenerationRow,
  LayoutNode,
  LayoutOptions,
  TreeLayout,
  Union,
  UnionAnchor,
} from "./types"

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  cardWidth: 200,
  cardHeight: 78,
  partnerGap: 28,
  siblingGap: 32,
  componentGap: 96,
  rowGap: 72,
}

/**
 * A person plus the partners who sit beside them — the unit the tidy pass moves
 * around. Rendering one person once, with successive spouses flanking them,
 * is what keeps remarriages readable.
 */
interface Cluster {
  /** The person this cluster is anchored on (the one with descent into it). */
  anchorId: string
  /** Anchor plus partners, left to right. */
  memberIds: string[]
  generation: number
  /** Unions whose children hang below this cluster, in placement order. */
  unions: Union[]
  width: number
  /** Left edge, filled in by the tidy pass. */
  x: number
}

export function layoutTree(
  graph: FamilyGraph,
  options: Partial<LayoutOptions> = {}
): TreeLayout {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options }
  const generation = assignGenerations(graph)

  const { clusters, clusterOf } = buildClusters(graph, generation, opts)

  /* ------------------------- tidy pass, per component ------------------------ */

  let cursor = 0

  for (const component of findComponents(graph)) {
    const memberSet = new Set(component)
    const roots = componentRoots(graph, clusters, memberSet)
    const placed = new Set<string>()

    let componentLeft = cursor
    for (const root of roots) {
      const width = placeSubtree(root, componentLeft, {
        graph,
        clusterOf,
        placed,
        opts,
      })
      componentLeft += width + opts.siblingGap
    }

    // Anything the walk missed (a spouse whose own ancestry sits elsewhere)
    // gets parked to the right rather than stacking at zero.
    for (const cluster of clusters) {
      if (!memberSet.has(cluster.anchorId) || placed.has(cluster.anchorId))
        continue
      cluster.x = componentLeft
      placed.add(cluster.anchorId)
      componentLeft += cluster.width + opts.siblingGap
    }

    cursor = componentLeft + opts.componentGap
  }

  /* ---------------------------- resolve overlaps ---------------------------- */

  // `placeSubtree` already centres every couple over their children, so the
  // only job left is to pull apart clusters that the walk placed independently.
  // Separation shifts whole subtrees rigidly, which keeps that centring intact
  // instead of undoing it — the alternative, alternating separate/re-centre
  // passes, leaves parents visibly off-centre wherever the two disagree.
  settle(clusters, clusterOf, opts)

  /* ------------------------------ emit nodes ------------------------------- */

  return emit(graph, clusters, generation, opts)
}

/* -------------------------------------------------------------------------- */
/*                              Cluster building                              */
/* -------------------------------------------------------------------------- */

function buildClusters(
  graph: FamilyGraph,
  generation: Map<string, number>,
  opts: LayoutOptions
) {
  const clusters: Cluster[] = []
  const clusterOf = new Map<string, Cluster>()
  const claimed = new Set<string>()

  // Anchor on people who descend from somewhere in the tree, oldest first, so
  // that a person who married in attaches to their spouse rather than the
  // other way round.
  const ordered = [...graph.people].sort(
    (a, b) => (generation.get(a.id) ?? 0) - (generation.get(b.id) ?? 0)
  )

  const descends = (id: string) => (graph.parentsOf.get(id) ?? []).length > 0

  for (const person of ordered) {
    if (claimed.has(person.id)) continue

    // Walk the chain of partners rightward: the anchor, their spouse, that
    // spouse's next spouse, and so on. A remarriage reads as one run of cards
    // (Edith | Felix | Nadia), which is the only arrangement where both of
    // Felix's unions can drop their connectors from between the right pair.
    const memberIds: string[] = [person.id]
    claimed.add(person.id)

    // Index-based on purpose: the loop appends to `memberIds` as it discovers
    // further spouses, and must visit those too.
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < memberIds.length; i++) {
      const currentId = memberIds[i]
      for (const union of graph.unionsByPartner.get(currentId) ?? []) {
        for (const partnerId of union.partnerIds) {
          if (partnerId === currentId || claimed.has(partnerId)) continue
          // Anyone with their own ancestry needs their own cluster so their
          // parents can sit above them. Only people who married in join.
          if (descends(partnerId)) continue
          memberIds.push(partnerId)
          claimed.add(partnerId)
        }
      }
    }

    // Every union any member belongs to hangs off this cluster.
    const unions = [
      ...new Set(
        memberIds.flatMap((id) => graph.unionsByPartner.get(id) ?? [])
      ),
    ]

    const cluster: Cluster = {
      anchorId: person.id,
      memberIds,
      generation: generation.get(person.id) ?? 0,
      unions,
      width:
        memberIds.length * opts.cardWidth +
        (memberIds.length - 1) * opts.partnerGap,
      x: 0,
    }

    clusters.push(cluster)
    for (const id of memberIds) clusterOf.set(id, cluster)
  }

  return { clusters, clusterOf }
}

/** Clusters in this component with no parent inside it — the tops of the walk. */
function componentRoots(
  graph: FamilyGraph,
  clusters: Cluster[],
  memberSet: Set<string>
): Cluster[] {
  const roots = clusters.filter((cluster) => {
    if (!memberSet.has(cluster.anchorId)) return false
    return cluster.memberIds.every(
      (id) => (graph.parentsOf.get(id) ?? []).length === 0
    )
  })

  if (roots.length > 0) return roots

  // Every cluster has a parent — a fully connected cycle would have been cut in
  // `buildGraph`, so this only happens for odd inputs. Fall back to the topmost.
  const candidates = clusters
    .filter((c) => memberSet.has(c.anchorId))
    .sort((a, b) => a.generation - b.generation)
  return candidates.slice(0, 1)
}

/* -------------------------------------------------------------------------- */
/*                                 Tidy pass                                  */
/* -------------------------------------------------------------------------- */

interface WalkContext {
  graph: FamilyGraph
  clusterOf: Map<string, Cluster>
  placed: Set<string>
  opts: LayoutOptions
}

/**
 * Classic post-order tidy: lay the children out left to right, then centre the
 * parent over the span they occupy. Returns the width consumed.
 */
function placeSubtree(
  cluster: Cluster,
  left: number,
  ctx: WalkContext
): number {
  if (ctx.placed.has(cluster.anchorId)) return 0
  ctx.placed.add(cluster.anchorId)

  const childClusters: Cluster[] = []
  for (const union of cluster.unions) {
    for (const childId of union.childIds) {
      const child = ctx.clusterOf.get(childId)
      if (!child || ctx.placed.has(child.anchorId)) continue
      childClusters.push(child)
    }
  }

  if (childClusters.length === 0) {
    cluster.x = left
    return cluster.width
  }

  let childLeft = left
  for (const child of childClusters) {
    const consumed = placeSubtree(child, childLeft, ctx)
    childLeft += consumed + ctx.opts.siblingGap
  }

  const childrenWidth = childLeft - ctx.opts.siblingGap - left

  // Line the connectors up with the middle of the children's *cards*, not with
  // the middle of their subtrees — a child whose own spouse widens their
  // cluster would otherwise drag the parent sideways.
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const union of cluster.unions) {
    for (const childId of union.childIds) {
      const centre = cardCentre(childId, ctx.clusterOf, ctx.opts)
      if (centre === null) continue
      min = Math.min(min, centre)
      max = Math.max(max, centre)
    }
  }

  if (Number.isFinite(min)) {
    // Averaged across the cluster's unions: someone with two marriages cannot
    // sit over both sets of children, so the layout splits the difference.
    cluster.x = (min + max) / 2 - anchorOffset(cluster, ctx.opts)
  }

  if (cluster.x < left) {
    // The couple is wider than its children; shift the children right rather
    // than let the parent hang off the left edge of its own subtree.
    const delta = left - cluster.x
    cluster.x = left
    for (const child of childClusters) shiftSubtree(child, delta, ctx.clusterOf)
    return Math.max(childrenWidth + delta, cluster.width)
  }

  return Math.max(childrenWidth, cluster.width)
}

/** Centre of a person's card at the cluster's current position. */
function cardCentre(
  personId: string,
  clusterOf: Map<string, Cluster>,
  opts: LayoutOptions
): number | null {
  const cluster = clusterOf.get(personId)
  if (!cluster) return null
  const index = cluster.memberIds.indexOf(personId)
  if (index < 0) return null
  return (
    cluster.x + index * (opts.cardWidth + opts.partnerGap) + opts.cardWidth / 2
  )
}

/**
 * Distance from a cluster's left edge to the point its descent connectors drop
 * from, averaged over every union in the cluster. For a plain couple that is
 * the midpoint between the two cards; for a remarriage chain it is the mean of
 * the two union midpoints, so the cluster straddles both sets of children.
 */
function anchorOffset(cluster: Cluster, opts: LayoutOptions): number {
  const step = opts.cardWidth + opts.partnerGap
  const localCentre = (personId: string) => {
    const index = cluster.memberIds.indexOf(personId)
    return index < 0 ? null : index * step + opts.cardWidth / 2
  }

  const offsets: number[] = []
  for (const union of cluster.unions) {
    if (union.childIds.length === 0) continue
    const centres = union.partnerIds
      .map(localCentre)
      .filter((x): x is number => x !== null)
    if (centres.length === 0) continue
    offsets.push(centres.reduce((sum, x) => sum + x, 0) / centres.length)
  }

  if (offsets.length === 0) {
    // No children to line up with; fall back to the middle of the cluster.
    return (cluster.memberIds.length - 1) * step * 0.5 + opts.cardWidth / 2
  }

  return offsets.reduce((sum, x) => sum + x, 0) / offsets.length
}

/** Moves a cluster and everything descending from it by the same amount. */
function shiftSubtree(
  cluster: Cluster,
  delta: number,
  clusterOf: Map<string, Cluster>,
  seen: Set<Cluster> = new Set()
) {
  if (delta === 0 || seen.has(cluster)) return
  seen.add(cluster)
  cluster.x += delta

  for (const union of cluster.unions) {
    for (const childId of union.childIds) {
      const child = clusterOf.get(childId)
      if (child && child !== cluster)
        shiftSubtree(child, delta, clusterOf, seen)
    }
  }
}

function groupByGeneration(clusters: Cluster[]): Map<number, Cluster[]> {
  const byGeneration = new Map<number, Cluster[]>()
  for (const cluster of clusters) {
    const list = byGeneration.get(cluster.generation)
    if (list) list.push(cluster)
    else byGeneration.set(cluster.generation, [cluster])
  }
  return byGeneration
}

/**
 * Pulls apart clusters that overlap within a generation, top-down, repeating
 * until nothing moves. A cluster that has to move takes its whole subtree with
 * it, so the couple-over-children alignment established during the walk
 * survives; only the gaps between independent subtrees grow.
 */
function settle(
  clusters: Cluster[],
  clusterOf: Map<string, Cluster>,
  opts: LayoutOptions
) {
  const byGeneration = groupByGeneration(clusters)
  const generations = [...byGeneration.keys()].sort((a, b) => a - b)

  for (let pass = 0; pass < 8; pass++) {
    let moved = false

    for (const gen of generations) {
      const row = byGeneration.get(gen)!
      row.sort((a, b) => a.x - b.x)

      let edge = -Infinity
      for (const cluster of row) {
        if (cluster.x < edge) {
          shiftSubtree(cluster, edge - cluster.x, clusterOf)
          moved = true
        }
        edge = cluster.x + cluster.width + opts.siblingGap
      }
    }

    if (!moved) return
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Emit                                     */
/* -------------------------------------------------------------------------- */

function emit(
  graph: FamilyGraph,
  clusters: Cluster[],
  generation: Map<string, number>,
  opts: LayoutOptions
): TreeLayout {
  const nodes: LayoutNode[] = []
  const nodeById = new Map<string, LayoutNode>()
  const rowHeight = opts.cardHeight + opts.rowGap

  for (const cluster of clusters) {
    cluster.memberIds.forEach((personId, index) => {
      const node: LayoutNode = {
        personId,
        generation: cluster.generation,
        x: cluster.x + index * (opts.cardWidth + opts.partnerGap),
        y: cluster.generation * rowHeight,
        width: opts.cardWidth,
        height: opts.cardHeight,
      }
      nodes.push(node)
      nodeById.set(personId, node)
    })
  }

  // Shift everything so the tree starts at the origin.
  const minX = Math.min(...nodes.map((n) => n.x), 0)
  if (minX !== 0) {
    for (const node of nodes) node.x -= minX
    for (const cluster of clusters) cluster.x -= minX
  }

  /* ------------------------------ union anchors ----------------------------- */

  const unions: UnionAnchor[] = []

  for (const union of graph.unions) {
    const partnerPoints = union.partnerIds
      .map((personId) => nodeById.get(personId))
      .filter((node): node is LayoutNode => Boolean(node))
      .map((node) => ({
        personId: node.personId,
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      }))

    if (partnerPoints.length === 0) continue

    const childPoints = union.childIds
      .map((personId) => nodeById.get(personId))
      .filter((node): node is LayoutNode => Boolean(node))
      .map((node) => ({
        personId: node.personId,
        x: node.x + node.width / 2,
        y: node.y,
      }))

    const partnerGeneration = generation.get(union.partnerIds[0]) ?? 0
    const anchorX =
      partnerPoints.reduce((sum, p) => sum + p.x, 0) / partnerPoints.length
    // Drop from the bottom edge of the partners' row, not their mid-height.
    const anchorY = partnerGeneration * rowHeight + opts.cardHeight

    unions.push({
      unionId: union.id,
      generation: partnerGeneration,
      x: anchorX,
      y: anchorY,
      partnerPoints,
      childPoints,
    })
  }

  /* ------------------------------- generations ------------------------------ */

  const rowMap = new Map<number, string[]>()
  for (const node of nodes) {
    const list = rowMap.get(node.generation)
    if (list) list.push(node.personId)
    else rowMap.set(node.generation, [node.personId])
  }

  const generations: GenerationRow[] = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gen, personIds]) => ({
      generation: gen,
      y: gen * rowHeight,
      height: opts.cardHeight,
      personIds: personIds.sort(
        (a, b) => (nodeById.get(a)?.x ?? 0) - (nodeById.get(b)?.x ?? 0)
      ),
    }))

  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 0)
  const maxY = Math.max(...nodes.map((n) => n.y + n.height), 0)

  return {
    nodes,
    nodeById,
    unions,
    generations,
    bounds: { x: 0, y: 0, width: maxX, height: maxY },
  }
}
