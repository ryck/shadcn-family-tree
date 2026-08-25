import { describe, expect, it } from "vitest"
import { buildGraph } from "../graph"
import { assignGenerations } from "../generations"
import { createKinshipContext, relationshipTo } from "../kinship"
import { family } from "./fixtures"

const graph = buildGraph(family)
const label = (from: string, to: string) =>
  relationshipTo(graph, from, to, createKinshipContext()).label

describe("graph derivation", () => {
  it("reports no diagnostics for well-formed input", () => {
    expect(graph.diagnostics).toEqual([])
  })

  it("derives a union per distinct parent pair", () => {
    // Felix has two unions: with Edith (Jonah) and with Nadia (Kira).
    expect(graph.unionsByPartner.get("felix")).toHaveLength(2)
  })

  it("orders a person's unions by start date", () => {
    const [first, second] = graph.unionsByPartner.get("felix")!
    expect(first.partnerIds).toContain("edith")
    expect(second.partnerIds).toContain("nadia")
  })

  it("keeps half-siblings in separate unions", () => {
    expect(graph.unionByChild.get("jonah")!.id).not.toBe(
      graph.unionByChild.get("kira")!.id
    )
  })

  it("carries partnership status onto the union", () => {
    const union = graph.unionByChild.get("jonah")!
    expect(union.status).toBe("divorced")
  })

  it("repairs one-sided partner declarations", () => {
    // Only Beatrice declares arthur; the link must be symmetric.
    expect(graph.partnersOf.get("arthur")).toContain("beatrice")
  })

  it("sorts children by birth date", () => {
    const union = graph.unions.find(
      (u) =>
        u.partnerIds.includes("arthur") && u.partnerIds.includes("beatrice")
    )!
    expect(union.childIds).toEqual(["edith", "oscar"])
  })
})

describe("generations", () => {
  const gen = assignGenerations(graph)

  it("starts at zero", () => {
    expect(Math.min(...gen.values())).toBe(0)
  })

  it("puts the oldest couples on the top row", () => {
    expect(gen.get("arthur")).toBe(0)
    expect(gen.get("cedric")).toBe(0)
  })

  it("places siblings on the same row", () => {
    expect(gen.get("edith")).toBe(gen.get("oscar"))
  })

  it("pulls partners who married in onto their spouse's row", () => {
    expect(gen.get("hugo")).toBe(gen.get("gwen"))
    expect(gen.get("nadia")).toBe(gen.get("felix"))
  })

  it("places half-siblings on the same row", () => {
    expect(gen.get("jonah")).toBe(gen.get("kira"))
  })

  it("puts each child strictly below its lowest parent", () => {
    for (const person of graph.people) {
      for (const parentId of graph.parentsOf.get(person.id) ?? []) {
        expect(gen.get(person.id)!).toBeGreaterThan(gen.get(parentId)!)
      }
    }
  })
})

describe("direct line", () => {
  it("names parents by sex", () => {
    expect(label("edith", "arthur")).toBe("father")
    expect(label("edith", "beatrice")).toBe("mother")
  })

  it("names children by sex", () => {
    expect(label("arthur", "edith")).toBe("daughter")
    expect(label("arthur", "oscar")).toBe("son")
  })

  it("names grandparents and grandchildren", () => {
    expect(label("jonah", "arthur")).toBe("grandfather")
    expect(label("arthur", "jonah")).toBe("grandson")
  })

  it("adds a great for each further step", () => {
    expect(label("rosa", "arthur")).toBe("great-grandfather")
    expect(label("arthur", "rosa")).toBe("great-granddaughter")
  })
})

describe("collateral line", () => {
  it("distinguishes full from half siblings", () => {
    expect(label("edith", "oscar")).toBe("brother")
    expect(label("jonah", "kira")).toBe("half-sister")
  })

  it("names aunts and uncles", () => {
    expect(label("jonah", "oscar")).toBe("uncle")
  })

  it("names nieces and nephews", () => {
    expect(label("oscar", "jonah")).toBe("nephew")
  })

  it("names great-aunts", () => {
    // Rosa's grandmother Edith has a brother Oscar -> Rosa's great-uncle.
    expect(label("rosa", "oscar")).toBe("great-uncle")
  })

  it("names first cousins", () => {
    expect(label("jonah", "priya")).toBe("first cousin")
  })

  it("names cousins once removed", () => {
    expect(label("rosa", "priya")).toBe("first cousin once removed")
  })
})

describe("partners", () => {
  it("names a current spouse by sex", () => {
    expect(label("liam", "mira")).toBe("wife")
    expect(label("mira", "liam")).toBe("husband")
  })

  it("marks a dissolved partnership", () => {
    expect(label("edith", "felix")).toBe("ex-husband")
  })

  it("marks a surviving partner's spouse as late", () => {
    // Dorothy outlived Cedric, so the union reads as widowed.
    expect(label("dorothy", "cedric")).toBe("late husband")
  })

  it("leaves a long-dead couple as a plain marriage", () => {
    // Both Arthur and Beatrice are gone; "late husband" would be noise here.
    expect(label("beatrice", "arthur")).toBe("husband")
  })
})

describe("step and in-law", () => {
  it("names a step-parent", () => {
    // Nadia married Jonah's father Felix after the divorce.
    expect(label("jonah", "nadia")).toBe("step-mother")
  })

  it("names an in-law through a partner", () => {
    // Mira's husband Liam has mother Gwen.
    expect(label("mira", "gwen")).toBe("mother-in-law")
  })

  it("re-genders an in-law reached through a blood relative", () => {
    // Liam's wife Mira -> from Gwen's view Mira is a daughter-in-law.
    expect(label("gwen", "mira")).toBe("daughter-in-law")
  })

  it("returns self for the same person", () => {
    expect(label("liam", "liam")).toBe("you")
  })

  it("returns an empty label for unrelated people", () => {
    expect(label("arthur", "cedric")).toBe("")
  })
})
