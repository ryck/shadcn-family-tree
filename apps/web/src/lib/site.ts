/** Canonical links and the install command, so nothing drifts between pages. */
export const site = {
  name: "shadcn-family-tree",
  /** Split for the wordmark: the tail takes the brand colour. */
  nameLead: "shadcn-family-",
  nameAccent: "tree",
  url: "https://shadcn-familytree.ryck.dev",
  github: "https://github.com/ryck/shadcn-familytree",
  /** Namespace a consumer registers to install by name. */
  namespace: "@familytree",
} as const

/** Zero-setup install: the registry item's URL, straight from the CLI. */
export const installCommand = `npx shadcn@latest add ${site.url}/r/family-tree.json`
