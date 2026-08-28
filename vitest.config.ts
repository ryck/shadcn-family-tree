import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          // Node, not jsdom: everything under test here is pure graph, layout
          // and date logic. A component project can be added alongside this one
          // when there is something to render.
          environment: "node",
          include: ["packages/*/src/**/*.test.{ts,tsx}"],
          // Explicit imports from "vitest" in every file, so a test reads the
          // same in the editor as it does in CI.
          globals: false,
        },
      },
    ],
  },
})
