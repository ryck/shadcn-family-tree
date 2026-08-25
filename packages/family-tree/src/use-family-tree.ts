import * as React from "react"
import { assignBranches } from "./branches"
import { buildGraph } from "./graph"
import { createKinshipContext, relationshipTo } from "./kinship"
import { layoutTree } from "./layout"
import { lineageOf } from "./lineage"
import type {
  FamilyGraph,
  LayoutOptions,
  Lineage,
  Person,
  Relationship,
  TreeLayout,
} from "./types"

export type FocusMode = "highlight" | "isolate"

export interface UseFamilyTreeOptions {
  people: Person[]
  focusId: string | null
  focusMode?: FocusMode
  layout?: Partial<LayoutOptions>
}

export interface FamilyTreeModel {
  /** The full graph, before any focus filtering. */
  graph: FamilyGraph
  /** The graph actually rendered — filtered in `isolate` mode. */
  visibleGraph: FamilyGraph
  layout: TreeLayout
  lineage: Lineage | null
  branchOf: Map<string, number>
  relationshipOf: (personId: string) => Relationship | null
}

/**
 * Turns a flat person list plus a focus id into everything the renderer needs.
 *
 * Split into three memos on purpose: the graph only rebuilds when the data
 * changes, while focus changes recompute the cheap derived pieces. In
 * `isolate` mode focus also changes what is rendered, so the layout comes back
 * into the dependency chain.
 */
export function useFamilyTree({
  people,
  focusId,
  focusMode = "highlight",
  layout: layoutOptions,
}: UseFamilyTreeOptions): FamilyTreeModel {
  const graph = React.useMemo(() => buildGraph(people), [people])

  const lineage = React.useMemo(
    () =>
      focusId && graph.personById.has(focusId)
        ? lineageOf(graph, focusId)
        : null,
    [graph, focusId]
  )

  // Isolate mode re-runs the whole pipeline over the filtered people, so the
  // layout tightens up around the line instead of leaving holes where the
  // hidden cards used to be.
  const visibleGraph = React.useMemo(() => {
    if (focusMode !== "isolate" || !lineage) return graph

    const keep = lineage.all
    const filtered = graph.people
      .filter((person) => keep.has(person.id))
      // Spreading, not mutating: `people` belongs to the caller and has to come
      // back out of this component exactly as it went in.
      // oxlint-disable-next-line oxc/no-map-spread
      .map((person) => ({
        ...person,
        parentIds: person.parentIds?.filter((id) => keep.has(id)),
        partnerIds: person.partnerIds?.filter((id) => keep.has(id)),
        partnerships: person.partnerships?.filter((p) => keep.has(p.partnerId)),
      }))

    return buildGraph(filtered)
  }, [graph, lineage, focusMode])

  const layout = React.useMemo(
    () => layoutTree(visibleGraph, layoutOptions),
    [visibleGraph, layoutOptions]
  )

  const branchOf = React.useMemo(
    () => assignBranches(visibleGraph, focusId).branchOf,
    [visibleGraph, focusId]
  )

  // The returned closure owns a cache keyed to this focus person, which is the
  // whole point — the compiler cannot prove that, but discarding the memo would
  // rebuild every ancestor walk on each render.
  // oxlint-disable-next-line react/preserve-manual-memoization
  const relationshipOf = React.useMemo(() => {
    if (!focusId || !visibleGraph.personById.has(focusId)) return () => null

    // One context per focus person, so the ancestor walks are computed once and
    // reused across every card rather than per render.
    const ctx = createKinshipContext()
    const cache = new Map<string, Relationship>()

    return (personId: string) => {
      const hit = cache.get(personId)
      if (hit) return hit
      const value = relationshipTo(visibleGraph, focusId, personId, ctx)
      cache.set(personId, value)
      return value
    }
  }, [visibleGraph, focusId])

  return { graph, visibleGraph, layout, lineage, branchOf, relationshipOf }
}

/** Reports graph problems once per dataset, in development only. */
export function useGraphDiagnostics(graph: FamilyGraph) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (graph.diagnostics.length === 0) return

    console.groupCollapsed(
      `[family-tree] ${graph.diagnostics.length} data issue(s)`
    )
    for (const diagnostic of graph.diagnostics) {
      console.warn(`${diagnostic.code}: ${diagnostic.message}`)
    }
    console.groupEnd()
  }, [graph])
}
