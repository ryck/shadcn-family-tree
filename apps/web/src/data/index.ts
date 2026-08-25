import type { Person } from "@workspace/family-tree"

import { hollis } from "./hollis"
import { vance } from "./vance"

export interface Dataset {
  name: string
  people: Person[]
  defaultFocusId: string
}

export const datasets = {
  hollis: { name: "Hollis–Adeyemi", people: hollis, defaultFocusId: "iris" },
  vance: { name: "Vance", people: vance, defaultFocusId: "theo" },
} satisfies Record<string, Dataset>

export type DatasetKey = keyof typeof datasets
