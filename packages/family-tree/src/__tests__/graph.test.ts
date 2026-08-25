import { describe, expect, it } from "vitest"
import { buildGraph } from "../graph"
import type { Person } from "../types"

/**
 * Malformed input handling.
 *
 * `datasets.test.ts` leans on these diagnostics to prove nobody is missing, so
 * the detector needs its own guard: if duplicate reporting ever regressed to
 * silently overwriting, a dropped person would sail past the dataset tests
 * with every assertion still green.
 */
const person = (
  id: string,
  name: string,
  rest: Partial<Person> = {}
): Person => ({
  id,
  name,
  sex: "female",
  ...rest,
})

describe("buildGraph on malformed input", () => {
  it("reports a duplicate id, keeps the first entry and drops the later one", () => {
    const graph = buildGraph([
      person("ana", "Ana Primera"),
      person("beto", "Beto"),
      person("ana", "Ana Segunda"),
    ])

    expect(graph.people).toHaveLength(2)
    expect(graph.personById.get("ana")!.name).toBe("Ana Primera")
    expect(graph.diagnostics.map((d) => d.code)).toEqual(["duplicate-id"])
    expect(graph.diagnostics[0].personId).toBe("ana")
  })

  it("reports a parent id that matches no one", () => {
    const graph = buildGraph([person("kid", "Kid", { parentIds: ["ghost"] })])

    expect(graph.diagnostics.map((d) => d.code)).toEqual(["unknown-parent"])
    expect(graph.parentsOf.get("kid")).toEqual([])
  })

  it("reports a partner id that matches no one", () => {
    const graph = buildGraph([
      person("solo", "Solo", { partnerIds: ["ghost"] }),
    ])

    expect(graph.diagnostics.map((d) => d.code)).toEqual(["unknown-partner"])
    expect(graph.partnersOf.get("solo")).toEqual([])
  })

  it("reports a person listed as their own parent", () => {
    const graph = buildGraph([person("loop", "Loop", { parentIds: ["loop"] })])

    expect(graph.diagnostics.map((d) => d.code)).toEqual(["self-reference"])
    expect(graph.parentsOf.get("loop")).toEqual([])
  })

  it("truncates a person with more than two parents", () => {
    const graph = buildGraph([
      person("a", "A"),
      person("b", "B"),
      person("c", "C"),
      person("kid", "Kid", { parentIds: ["a", "b", "c"] }),
    ])

    expect(graph.diagnostics.map((d) => d.code)).toEqual(["too-many-parents"])
    expect(graph.parentsOf.get("kid")).toEqual(["a", "b"])
    // Truncated, not dropped — everyone still renders.
    expect(graph.people).toHaveLength(4)
  })
})
