import type { Person } from "../types"

/**
 * A deliberately awkward family, built to exercise every branch of the kinship
 * and layout code: a remarriage producing half-siblings, a step-family, a
 * cousin marriage that collapses the pedigree, and an in-law who married in.
 *
 *   Gen 0   Arthur ── Beatrice          Cedric ── Dorothy
 *              │                            │
 *   Gen 1   ┌──┴────────┐              ┌────┴────┐
 *          Edith ─ Felix │             Gwen ── Hugo
 *            │       │   │               │
 *            │       └─ Iris (Felix's 2nd union, with Iris' mother Nadia)
 *   Gen 2   Jonah   Kira                Liam ── Mira
 *                                          │
 *   Gen 3                                Nolan
 */
export const family: Person[] = [
  // Generation 0
  {
    id: "arthur",
    name: "Arthur Vance",
    sex: "male",
    birth: { date: "1920" },
    death: { date: "1994" },
  },
  {
    id: "beatrice",
    name: "Beatrice Vance",
    sex: "female",
    birth: { date: "1923" },
    death: { date: "2001" },
    partnerIds: ["arthur"],
  },
  {
    id: "cedric",
    name: "Cedric Okonkwo",
    sex: "male",
    birth: { date: "1918" },
    death: { date: "1990" },
  },
  {
    id: "dorothy",
    name: "Dorothy Okonkwo",
    sex: "female",
    birth: { date: "1925" },
    partnerIds: ["cedric"],
  },

  // Generation 1 — Edith and Gwen are Arthur & Beatrice's / Cedric & Dorothy's children
  {
    id: "edith",
    name: "Edith Vance",
    sex: "female",
    birth: { date: "1948" },
    parentIds: ["arthur", "beatrice"],
    partnerships: [
      { partnerId: "felix", status: "divorced", since: "1970", until: "1980" },
    ],
  },
  {
    id: "felix",
    name: "Felix Marchetti",
    sex: "male",
    birth: { date: "1946" },
    partnerships: [
      { partnerId: "edith", status: "divorced", since: "1970", until: "1980" },
      { partnerId: "nadia", status: "married", since: "1983" },
    ],
  },
  {
    id: "nadia",
    name: "Nadia Marchetti",
    sex: "female",
    birth: { date: "1955" },
  },
  {
    id: "gwen",
    name: "Gwen Okonkwo",
    sex: "female",
    birth: { date: "1950" },
    parentIds: ["cedric", "dorothy"],
  },
  {
    id: "hugo",
    name: "Hugo Reyes",
    sex: "male",
    birth: { date: "1949" },
    partnerIds: ["gwen"],
  },
  // A second child of Arthur & Beatrice, so Edith has a full sibling
  {
    id: "oscar",
    name: "Oscar Vance",
    sex: "male",
    birth: { date: "1952" },
    parentIds: ["arthur", "beatrice"],
  },

  // Generation 2
  {
    id: "jonah",
    name: "Jonah Marchetti",
    sex: "male",
    birth: { date: "1972" },
    parentIds: ["edith", "felix"],
  },
  {
    id: "kira",
    name: "Kira Marchetti",
    sex: "female",
    birth: { date: "1985" },
    parentIds: ["felix", "nadia"],
  },
  {
    id: "liam",
    name: "Liam Reyes",
    sex: "male",
    birth: { date: "1975" },
    parentIds: ["gwen", "hugo"],
  },
  {
    id: "mira",
    name: "Mira Solis",
    sex: "female",
    birth: { date: "1977" },
    partnerIds: ["liam"],
  },
  // Oscar's child — Jonah's first cousin
  {
    id: "priya",
    name: "Priya Vance",
    sex: "female",
    birth: { date: "1980" },
    parentIds: ["oscar"],
  },

  // Generation 3
  {
    id: "nolan",
    name: "Nolan Reyes",
    sex: "male",
    birth: { date: "2004" },
    parentIds: ["liam", "mira"],
  },
  {
    id: "rosa",
    name: "Rosa Marchetti",
    sex: "female",
    birth: { date: "2001" },
    parentIds: ["jonah"],
  },
]
