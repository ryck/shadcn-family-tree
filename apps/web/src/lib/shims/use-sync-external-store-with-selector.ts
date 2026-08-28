/* oxlint-disable react/refs, react/immutability, react/memo-dependencies, react/exhaustive-effect-dependencies --
 * This is a store primitive, not a component: it caches the selected value in a
 * ref and mutates closure state during render on purpose. That is what makes
 * `getSnapshot` return a stable reference, which `useSyncExternalStore`
 * requires — obeying the component rules here would loop forever. Kept as a
 * faithful port rather than a rewrite for that reason.
 */
/**
 * ESM stand-in for `use-sync-external-store/shim/with-selector`, for the same
 * reason as `./use-sync-external-store.ts` — see the note there.
 *
 * Ported from the upstream implementation (MIT, Meta Platforms), with the
 * shim's React 17 fallback dropped: it builds on React's own
 * `useSyncExternalStore` rather than the userspace re-implementation. Base UI
 * only reaches for this on React < 19, so on this app it is inert — but a
 * wrong implementation here would be a silent trap, so it stays faithful.
 */
import * as React from "react"

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  // Tracks the latest committed selection, so `isEqual` can compare against
  // what the caller actually saw rather than an intermediate value.
  const instRef = React.useRef<{
    hasValue: boolean
    value: Selection | null
  } | null>(null)

  let inst: { hasValue: boolean; value: Selection | null }
  if (instRef.current === null) {
    inst = { hasValue: false, value: null }
    instRef.current = inst
  } else {
    inst = instRef.current
  }

  const [getSelection, getServerSelection] = React.useMemo(() => {
    let hasMemo = false
    let memoizedSnapshot: Snapshot
    let memoizedSelection: Selection

    const memoizedSelector = (nextSnapshot: Snapshot) => {
      if (!hasMemo) {
        hasMemo = true
        memoizedSnapshot = nextSnapshot
        const nextSelection = selector(nextSnapshot)
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value as Selection
          if (isEqual(currentSelection, nextSelection)) {
            memoizedSelection = currentSelection
            return currentSelection
          }
        }
        memoizedSelection = nextSelection
        return nextSelection
      }

      const prevSnapshot = memoizedSnapshot
      const prevSelection = memoizedSelection
      if (Object.is(prevSnapshot, nextSnapshot)) return prevSelection

      const nextSelection = selector(nextSnapshot)
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot
        return prevSelection
      }

      memoizedSnapshot = nextSnapshot
      memoizedSelection = nextSelection
      return nextSelection
    }

    const maybeGetServerSnapshot =
      getServerSnapshot === undefined || getServerSnapshot === null
        ? undefined
        : getServerSnapshot

    return [
      () => memoizedSelector(getSnapshot()),
      maybeGetServerSnapshot === undefined
        ? undefined
        : () => memoizedSelector(maybeGetServerSnapshot()),
    ] as const
  }, [getSnapshot, getServerSnapshot, selector, isEqual])

  const value = React.useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection
  )

  React.useEffect(() => {
    inst.hasValue = true
    inst.value = value
  }, [value])

  React.useDebugValue(value)
  return value
}
