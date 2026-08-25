import { describe, expect, it } from "vitest"
import { buildGraph } from "../graph"
import { layoutTree } from "../layout"
import type { Person } from "../types"
import { gonzalezLago } from "../../../../apps/web/src/data/gonzalez"
import { hollis } from "../../../../apps/web/src/data/hollis"
import { vance } from "../../../../apps/web/src/data/vance"

/**
 * The shipped datasets, guarded against silent data loss.
 *
 * `buildGraph` is deliberately forgiving: a duplicate id drops the later entry
 * and files a diagnostic rather than throwing. That is the right call for a
 * component — a tree that renders with a warning beats one that crashes — but
 * it means a copy-pasted id quietly removes someone from the tree, and the
 * only trace is a console warning nobody reads. Fernando Iglesias del Pazo
 * shared an id with his father and disappeared from the González tree exactly
 * this way. These tests turn that whisper into a failing build.
 *
 * Add every new dataset here; the checks are generic.
 */
const datasets: Record<string, Person[]> = {
  hollis,
  vance,
  "gonzalez-lago": gonzalezLago,
}

describe.each(Object.entries(datasets))("%s dataset", (_name, people) => {
  const graph = buildGraph(people)

  it("declares no duplicate ids", () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const person of people) {
      if (seen.has(person.id)) duplicates.push(`${person.id} (${person.name})`)
      seen.add(person.id)
    }
    expect(duplicates).toEqual([])
  })

  it("keeps every person in the graph", () => {
    const kept = new Set(graph.people.map((person) => person.id))
    const dropped = people
      .filter((person) => !kept.has(person.id))
      .map((person) => `${person.id} (${person.name})`)

    expect(dropped).toEqual([])
    expect(graph.people).toHaveLength(people.length)
  })

  // Catches dangling parent/partner references, self-references, cycles and
  // over-parented people too — anything buildGraph knows how to complain about.
  it("builds without diagnostics", () => {
    expect(graph.diagnostics.map((d) => `${d.code}: ${d.message}`)).toEqual([])
  })

  it("lays out exactly one card per person", () => {
    const layout = layoutTree(graph)
    const placed = new Set(layout.nodes.map((node) => node.personId))
    const missing = people
      .filter((person) => !placed.has(person.id))
      .map((person) => `${person.id} (${person.name})`)

    expect(missing).toEqual([])
    expect(layout.nodes).toHaveLength(people.length)
  })
})
