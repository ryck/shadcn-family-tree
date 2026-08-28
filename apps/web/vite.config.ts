import { fileURLToPath } from "node:url"

import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom"],
    // One React instance, or none of the hooks work. `use-sync-external-store`
    // is CJS-only; inlined into the server bundle, its `require("react")`
    // survives as a runtime require and loads a *second* React whose dispatcher
    // the bundled react-dom/server never sets. Base UI's store then threw on
    // every useSyncExternalStore call and React fell back to client rendering
    // (error #419). Still load-bearing under prerendering: the pages are
    // rendered through the same server renderer, just at build time rather than
    // per request. These ESM stand-ins import React normally, so the bundler
    // links them to the one copy. Most specific pattern first.
    alias: [
      {
        find: /^use-sync-external-store\/shim\/with-selector$/,
        replacement: fileURLToPath(
          new URL(
            "./src/lib/shims/use-sync-external-store-with-selector.ts",
            import.meta.url
          )
        ),
      },
      {
        find: /^use-sync-external-store\/shim$/,
        replacement: fileURLToPath(
          new URL("./src/lib/shims/use-sync-external-store.ts", import.meta.url)
        ),
      },
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    // Prerendered to static HTML rather than server-rendered. Every route reads
    // from a TS module in src/data — there is no request-time data anywhere, so
    // a server has nothing to add. This keeps the deploy a pure static upload
    // with no serverless runtime, matching rtk-query-devtools.
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true },
      // `crawlLinks` only finds what is reachable from `/`, and nothing links
      // to /gonzalez on purpose — it is unlisted and noindex. Without naming it
      // here it would be the one route that ships no HTML.
      pages: [{ path: "/gonzalez" }],
    }),
    viteReact(),
  ],
})

export default config
