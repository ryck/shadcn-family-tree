import { describe, expect, it } from "vitest"
import { buildGraph } from "../graph"
import { DEFAULT_LAYOUT_OPTIONS, layoutTree } from "../layout"
import { family } from "./fixtures"

const graph = buildGraph(family)
const layout = layoutTree(graph)
const opts = DEFAULT_LAYOUT_OPTIONS

describe("layout", () => {
  it("emits exactly one node per person", () => {
    expect(layout.nodes).toHaveLength(family.length)
    expect(new Set(layout.nodes.map((n) => n.personId)).size).toBe(
      family.length
    )
  })

  it("starts at the origin", () => {
    expect(Math.min(...layout.nodes.map((n) => n.x))).toBe(0)
    expect(Math.min(...layout.nodes.map((n) => n.y))).toBe(0)
  })

  it("never overlaps two cards in the same generation", () => {
    for (const row of layout.generations) {
      const nodes = row.personIds.map((id) => layout.nodeById.get(id)!)
      for (let i = 1; i < nodes.length; i++) {
        const left = nodes[i - 1]
        const right = nodes[i]
        expect(right.x).toBeGreaterThanOrEqual(left.x + left.width - 0.001)
      }
    }
  })

  it("places every generation strictly below the one above", () => {
    const ys = layout.generations.map((row) => row.y)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1])
    }
  })

  it("gives every node in a row the same y", () => {
    for (const row of layout.generations) {
      for (const id of row.personIds) {
        expect(layout.nodeById.get(id)!.y).toBe(row.y)
      }
    }
  })

  it("seats partners side by side at one card plus a gap", () => {
    const liam = layout.nodeById.get("liam")!
    const mira = layout.nodeById.get("mira")!
    expect(Math.abs(mira.x - liam.x)).toBeCloseTo(
      opts.cardWidth + opts.partnerGap,
      5
    )
    expect(liam.y).toBe(mira.y)
  })

  it("centres each couple over the children hanging below them", () => {
    for (const anchor of layout.unions) {
      if (anchor.childPoints.length === 0) continue
      const min = Math.min(...anchor.childPoints.map((p) => p.x))
      const max = Math.max(...anchor.childPoints.map((p) => p.x))
      const union = graph.unionById.get(anchor.unionId)!
      const remarried = union.partnerIds.some(
        (id) => (graph.unionsByPartner.get(id) ?? []).length > 1
      )

      if (remarried) {
        // Someone with two unions cannot sit over both sets of children at
        // once, so the layout splits the difference between them.
        expect(Math.abs(anchor.x - (min + max) / 2)).toBeLessThanOrEqual(
          opts.partnerGap
        )
      } else {
        // Everyone else sits exactly on their children's midpoint.
        expect(anchor.x).toBeCloseTo((min + max) / 2, 5)
      }
    }
  })

  it("drops descent connectors from below the parents' row", () => {
    for (const anchor of layout.unions) {
      for (const child of anchor.childPoints) {
        expect(child.y).toBeGreaterThan(anchor.y)
      }
    }
  })

  it("produces bounds that contain every node", () => {
    for (const node of layout.nodes) {
      expect(node.x + node.width).toBeLessThanOrEqual(
        layout.bounds.width + 0.001
      )
      expect(node.y + node.height).toBeLessThanOrEqual(
        layout.bounds.height + 0.001
      )
    }
  })

  it("lays disconnected families out side by side rather than on top", () => {
    const separate = buildGraph([
      { id: "a1", name: "A One", sex: "male" },
      { id: "a2", name: "A Two", sex: "female", parentIds: ["a1"] },
      { id: "b1", name: "B One", sex: "female" },
      { id: "b2", name: "B Two", sex: "male", parentIds: ["b1"] },
    ])
    const result = layoutTree(separate)
    const a1 = result.nodeById.get("a1")!
    const b1 = result.nodeById.get("b1")!
    expect(Math.abs(a1.x - b1.x)).toBeGreaterThanOrEqual(opts.cardWidth)
  })
})
