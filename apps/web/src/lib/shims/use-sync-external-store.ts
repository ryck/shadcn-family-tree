/**
 * ESM stand-in for `use-sync-external-store/shim`.
 *
 * The real package is CJS-only. When Vite inlines it into the SSR bundle its
 * `require("react")` survives as a *runtime* require, which loads a second
 * React from disk — one whose dispatcher the bundled `react-dom/server` never
 * sets. Every `useSyncExternalStore` call from Base UI's store then threw
 * `Cannot read properties of null (reading 'useSyncExternalStore')` during SSR,
 * React gave up on the boundary and fell back to client rendering (error #419).
 *
 * The shim only exists for React 17, which lacks the hook. We are on 19, so
 * re-exporting React's own implementation is exactly what the shim would pick,
 * minus the second copy of React. Aliased in `vite.config.ts`.
 */
export { useSyncExternalStore } from "react"
