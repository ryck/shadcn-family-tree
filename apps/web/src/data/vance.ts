import type { Person } from "@workspace/family-tree"

/**
 * A small, tidy family — three generations, no remarriages. Useful for seeing
 * the layout's centring behaviour without any of the awkward cases.
 */
export const vance: Person[] = [
  {
    id: "arthur",
    name: "Arthur Vance",
    sex: "male",
    birth: { date: "1944" },
    death: { date: "2019" },
  },
  {
    id: "nora",
    name: "Nora Vance",
    sex: "female",
    birth: { date: "1947" },
    partnerIds: ["arthur"],
  },

  {
    id: "peter",
    name: "Peter Vance",
    sex: "male",
    birth: { date: "1970" },
    parentIds: ["arthur", "nora"],
  },
  {
    id: "claire",
    name: "Claire Vance",
    sex: "female",
    birth: { date: "1972" },
    partnerIds: ["peter"],
  },
  {
    id: "julia",
    name: "Julia Vance",
    sex: "female",
    birth: { date: "1974" },
    parentIds: ["arthur", "nora"],
  },

  {
    id: "theo",
    name: "Theo Vance",
    sex: "male",
    birth: { date: "1999" },
    parentIds: ["peter", "claire"],
  },
  {
    id: "maya",
    name: "Maya Vance",
    sex: "female",
    birth: { date: "2002" },
    parentIds: ["peter", "claire"],
  },
  {
    id: "sam",
    name: "Sam Vance",
    sex: "other",
    birth: { date: "2005" },
    parentIds: ["julia"],
  },
]
