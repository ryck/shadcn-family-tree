import * as React from "react"
import type { Rect } from "./types"

export interface Transform {
  x: number
  y: number
  scale: number
}

export interface ViewportOptions {
  minScale?: number
  maxScale?: number
  /** Padding kept around the content when fitting, in screen pixels. */
  fitPadding?: number
  /** Extra room reserved at the bottom, for a floating toolbar. */
  fitBottomInset?: number
}

const DEFAULTS = {
  minScale: 0.15,
  maxScale: 2.5,
  fitPadding: 48,
  fitBottomInset: 0,
}
const TWEEN_MS = 420

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Ease-out cubic — decelerates into place without overshooting. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Pan and zoom over a fixed-size content plane, with no dependencies.
 *
 * Drag pans, wheel zooms toward the cursor, two fingers pinch. Momentum is
 * deliberately left out: on a graph you are usually aiming at a specific card,
 * and glide makes that harder rather than nicer.
 */
export function useViewport(options: ViewportOptions = {}) {
  const opts = { ...DEFAULTS, ...options }
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = React.useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  })

  // The container measures zero on the first paint, so anything that needs its
  // size (fitting the tree on load) has to wait for a real measurement.
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height }
      )
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const frameRef = React.useRef<number | null>(null)
  // Mirrored into a ref so the imperative helpers below can read the current
  // transform without taking it as a dependency. Written in an effect rather
  // than during render — every read happens in an event handler or a callback,
  // all of which run after commit.
  const transformRef = React.useRef(transform)
  React.useEffect(() => {
    transformRef.current = transform
  }, [transform])

  const cancelTween = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const tweenTo = React.useCallback(
    (target: Transform) => {
      cancelTween()

      if (prefersReducedMotion()) {
        setTransform(target)
        return
      }

      const from = transformRef.current
      const start = performance.now()

      const step = (now: number) => {
        const t = clamp((now - start) / TWEEN_MS, 0, 1)
        const k = ease(t)
        setTransform({
          x: from.x + (target.x - from.x) * k,
          y: from.y + (target.y - from.y) * k,
          scale: from.scale + (target.scale - from.scale) * k,
        })
        frameRef.current = t < 1 ? requestAnimationFrame(step) : null
      }

      frameRef.current = requestAnimationFrame(step)
    },
    [cancelTween]
  )

  React.useEffect(() => cancelTween, [cancelTween])

  /** Frames `rect` (in content coordinates) inside the container. */
  const fitTo = React.useCallback(
    (rect: Rect, maxScale = 1) => {
      const container = containerRef.current
      if (!container || rect.width <= 0 || rect.height <= 0) return

      const { width, height } = container.getBoundingClientRect()
      const pad = opts.fitPadding * 2
      // The usable band stops short of the toolbar, and its centre sits that
      // much higher than the container's — otherwise the bottom row of cards
      // ends up underneath the controls.
      const usableHeight = height - opts.fitBottomInset
      const scale = clamp(
        Math.min(
          (width - pad) / rect.width,
          (usableHeight - pad) / rect.height
        ),
        opts.minScale,
        Math.min(opts.maxScale, maxScale)
      )

      tweenTo({
        scale,
        x: width / 2 - (rect.x + rect.width / 2) * scale,
        y: usableHeight / 2 - (rect.y + rect.height / 2) * scale,
      })
    },
    [
      opts.fitPadding,
      opts.fitBottomInset,
      opts.minScale,
      opts.maxScale,
      tweenTo,
    ]
  )

  /** Brings a point in content coordinates to the middle of the container. */
  const centerOn = React.useCallback(
    (point: { x: number; y: number }, scale?: number) => {
      const container = containerRef.current
      if (!container) return

      const { width, height } = container.getBoundingClientRect()
      const nextScale = clamp(
        scale ?? transformRef.current.scale,
        opts.minScale,
        opts.maxScale
      )

      tweenTo({
        scale: nextScale,
        x: width / 2 - point.x * nextScale,
        y: height / 2 - point.y * nextScale,
      })
    },
    [opts.minScale, opts.maxScale, tweenTo]
  )

  /** Zooms about the container's centre, for the toolbar buttons. */
  const zoomBy = React.useCallback(
    (factor: number) => {
      const container = containerRef.current
      if (!container) return

      const { width, height } = container.getBoundingClientRect()
      const current = transformRef.current
      const next = clamp(current.scale * factor, opts.minScale, opts.maxScale)
      if (next === current.scale) return

      const ratio = next / current.scale
      tweenTo({
        scale: next,
        x: width / 2 - (width / 2 - current.x) * ratio,
        y: height / 2 - (height / 2 - current.y) * ratio,
      })
    },
    [opts.minScale, opts.maxScale, tweenTo]
  )

  /* ------------------------------ interaction ------------------------------ */

  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const gesture = React.useRef<{
    // Pan origin, in screen pixels.
    startX: number
    startY: number
    originX: number
    originY: number
    // Pinch baseline.
    distance: number
    scale: number
  } | null>(null)

  const [isPanning, setIsPanning] = React.useState(false)

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Let clicks on cards through; only empty canvas starts a pan.
      if ((event.target as HTMLElement).closest("[data-ft-interactive]")) return

      cancelTween()
      const element = event.currentTarget
      element.setPointerCapture(event.pointerId)
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })

      const current = transformRef.current
      if (pointers.current.size === 1) {
        gesture.current = {
          startX: event.clientX,
          startY: event.clientY,
          originX: current.x,
          originY: current.y,
          distance: 0,
          scale: current.scale,
        }
        setIsPanning(true)
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        gesture.current = {
          startX: (a.x + b.x) / 2,
          startY: (a.y + b.y) / 2,
          originX: current.x,
          originY: current.y,
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          scale: current.scale,
        }
      }
    },
    [cancelTween]
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId) || !gesture.current) return
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })

      const g = gesture.current

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        if (g.distance === 0) return

        const scale = clamp(
          (g.scale * distance) / g.distance,
          opts.minScale,
          opts.maxScale
        )
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        const ratio = scale / g.scale

        setTransform({
          scale,
          x: midX - (g.startX - g.originX) * ratio - (midX - g.startX),
          y: midY - (g.startY - g.originY) * ratio - (midY - g.startY),
        })
        return
      }

      setTransform((current) => ({
        ...current,
        x: g.originX + (event.clientX - g.startX),
        y: g.originY + (event.clientY - g.startY),
      }))
    },
    [opts.minScale, opts.maxScale]
  )

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId)
      if (pointers.current.size === 0) {
        gesture.current = null
        setIsPanning(false)
      }
    },
    []
  )

  /**
   * Wheel zooms about the cursor. Registered manually rather than via a React
   * prop because React attaches wheel listeners passively, and this one must
   * call `preventDefault` to stop the page scrolling behind the tree.
   */
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      cancelTween()

      const rect = container.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      setTransform((current) => {
        // Trackpads report small deltas continuously; the exponent keeps the
        // response even across mice and trackpads alike.
        const factor = Math.exp(-event.deltaY * 0.0015)
        const scale = clamp(
          current.scale * factor,
          opts.minScale,
          opts.maxScale
        )
        if (scale === current.scale) return current

        const ratio = scale / current.scale
        return {
          scale,
          x: pointerX - (pointerX - current.x) * ratio,
          y: pointerY - (pointerY - current.y) * ratio,
        }
      })
    }

    container.addEventListener("wheel", onWheel, { passive: false })
    return () => container.removeEventListener("wheel", onWheel)
  }, [cancelTween, opts.minScale, opts.maxScale])

  return {
    containerRef,
    transform,
    isPanning,
    size,
    setTransform,
    fitTo,
    centerOn,
    zoomBy,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
