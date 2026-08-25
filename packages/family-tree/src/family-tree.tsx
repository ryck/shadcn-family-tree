import * as React from "react"
import { FocusIcon, MaximizeIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { Connectors } from "./connectors"
import { DEFAULT_LAYOUT_OPTIONS } from "./layout"
import { MemoPersonCard, personLabel } from "./person-card"
import type { PersonCardContext } from "./person-card"
import type { LayoutOptions, Person, Rect, Relationship } from "./types"
import { useFamilyTree, useGraphDiagnostics } from "./use-family-tree"
import type { FocusMode } from "./use-family-tree"
import { useViewport } from "./use-viewport"

import "./family-tree.css"

export interface FamilyTreeProps extends React.ComponentProps<"div"> {
  people: Person[]
  /** Controlled focus. Pair with `onFocusChange`. */
  focusId?: string | null
  defaultFocusId?: string | null
  onFocusChange?: (personId: string | null) => void
  focusMode?: FocusMode
  defaultFocusMode?: FocusMode
  onFocusModeChange?: (mode: FocusMode) => void
  /** Override the rendered card entirely. */
  renderCard?: (context: PersonCardContext) => React.ReactNode
  /** Rewrite the calculated relationship term, for i18n or house style. */
  formatRelationship?: (relationship: Relationship, person: Person) => string
  layout?: Partial<LayoutOptions>
  showToolbar?: boolean
  showGenerationRules?: boolean
}

export function FamilyTree({
  people,
  focusId: focusIdProp,
  defaultFocusId = null,
  onFocusChange,
  focusMode: focusModeProp,
  defaultFocusMode = "highlight",
  onFocusModeChange,
  renderCard,
  formatRelationship,
  layout: layoutOptions,
  showToolbar = true,
  showGenerationRules = true,
  className,
  ...props
}: FamilyTreeProps) {
  const [focusIdState, setFocusIdState] = React.useState(defaultFocusId)
  const focusId = focusIdProp !== undefined ? focusIdProp : focusIdState

  const [focusModeState, setFocusModeState] = React.useState(defaultFocusMode)
  const focusMode = focusModeProp ?? focusModeState

  const opts = React.useMemo(
    () => ({ ...DEFAULT_LAYOUT_OPTIONS, ...layoutOptions }),
    [layoutOptions]
  )

  const model = useFamilyTree({ people, focusId, focusMode, layout: opts })
  useGraphDiagnostics(model.graph)

  const {
    containerRef,
    transform,
    isPanning,
    size,
    fitTo,
    centerOn,
    zoomBy,
    handlers,
  } = useViewport({ fitBottomInset: showToolbar ? 72 : 0 })

  /* ------------------------------ focus moves ------------------------------ */

  const setFocus = React.useCallback(
    (personId: string | null) => {
      if (focusIdProp === undefined) setFocusIdState(personId)
      onFocusChange?.(personId)
    },
    [focusIdProp, onFocusChange]
  )

  const setFocusMode = React.useCallback(
    (mode: FocusMode) => {
      if (focusModeProp === undefined) setFocusModeState(mode)
      onFocusModeChange?.(mode)
    },
    [focusModeProp, onFocusModeChange]
  )

  /** Bounding box of the focus person's line, for the camera to frame. */
  const lineageBounds = React.useMemo((): Rect | null => {
    if (!model.lineage) return null

    const nodes = model.layout.nodes.filter((node) =>
      model.lineage!.all.has(node.personId)
    )
    if (nodes.length === 0) return null

    const minX = Math.min(...nodes.map((n) => n.x))
    const minY = Math.min(...nodes.map((n) => n.y))
    const maxX = Math.max(...nodes.map((n) => n.x + n.width))
    const maxY = Math.max(...nodes.map((n) => n.y + n.height))

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, [model.lineage, model.layout])

  const fitAll = React.useCallback(() => {
    fitTo(model.layout.bounds)
  }, [fitTo, model.layout.bounds])

  // Frame the whole tree once the container has a real size, and again whenever
  // the dataset changes shape. Without the size guard this fires against a
  // zero-width container on the first paint and the tree opens off-screen.
  const boundsKey = `${model.layout.bounds.width}x${model.layout.bounds.height}`
  const hasSize = size.width > 0 && size.height > 0
  // Keyed on the bounds *value*, not on `fitAll`, whose identity changes with
  // every layout recompute — depending on it would re-frame the tree on each
  // focus change and fight the lineage camera below.
  React.useEffect(() => {
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
    if (hasSize) fitAll()
  }, [boundsKey, hasSize])

  // Follow the focus person, but only once the user has actually chosen
  // someone. Re-framing on the first paint would hide most of the family behind
  // whatever `defaultFocusId` happened to be.
  const settled = React.useRef(false)
  // Deliberately fires on focus changes only. `lineageBounds` changes whenever
  // the layout does, and following that would yank the camera during ordinary
  // re-renders rather than when the user picks someone.
  React.useEffect(() => {
    if (!hasSize) return
    if (!settled.current) {
      settled.current = true
      return
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
    if (lineageBounds) fitTo(lineageBounds)
  }, [focusId, focusMode, hasSize])

  const centerOnFocus = React.useCallback(() => {
    const node = focusId ? model.layout.nodeById.get(focusId) : null
    if (node)
      centerOn({ x: node.x + node.width / 2, y: node.y + node.height / 2 })
    else fitAll()
  }, [focusId, model.layout, centerOn, fitAll])

  /* ---------------------------- keyboard moves ---------------------------- */

  // Arrow keys move the selection; DOM focus has to follow it, or a screen
  // reader announces nothing when the selected card changes.
  const movedByKeyboard = React.useRef(false)

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!focusId) return
      const target = navigate(event.key, focusId, model)
      if (!target) return
      event.preventDefault()
      movedByKeyboard.current = true
      setFocus(target)
    },
    [focusId, model, setFocus]
  )

  React.useEffect(() => {
    if (!movedByKeyboard.current || !focusId) return
    movedByKeyboard.current = false

    const card = containerRef.current?.querySelector<HTMLElement>(
      `[data-person-id="${CSS.escape(focusId)}"] [data-slot="family-tree-select"]`
    )
    // The camera is a transform, so let it do the moving — the browser's own
    // scroll-into-view would fight it.
    card?.focus({ preventScroll: true })
  }, [focusId, containerRef])

  /* -------------------------------- render -------------------------------- */

  const rowHeight = opts.cardHeight + opts.rowGap
  const lineageSet = model.lineage?.all ?? null

  return (
    <div
      data-slot="family-tree"
      data-focus-mode={focusMode}
      className={cn(
        "relative size-full overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      {/* `application` is a widget role: it tells assistive technology to pass
          arrow keys through to the tree rather than using them to browse. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={containerRef}
        data-slot="family-tree-viewport"
        role="application"
        aria-label="Family tree"
        aria-describedby="family-tree-help"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          "size-full outline-none",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        {...handlers}
      >
        <div
          data-slot="family-tree-surface"
          className="relative"
          style={{
            width: model.layout.bounds.width,
            height: model.layout.bounds.height,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {showGenerationRules
            ? model.layout.generations.map((row) => (
                <React.Fragment key={row.generation}>
                  <div
                    data-slot="family-tree-generation-rule"
                    style={{
                      top: row.y - opts.rowGap / 2,
                      width: model.layout.bounds.width,
                    }}
                  />
                  <span
                    className="absolute -translate-x-full pr-3 text-[11px] text-muted-foreground/70 tabular-nums"
                    style={{ top: row.y, left: 0 }}
                  >
                    {`Gen ${row.generation + 1}`}
                  </span>
                </React.Fragment>
              ))
            : null}

          <Connectors
            layout={model.layout}
            branchOf={model.branchOf}
            statusOf={(unionId) =>
              model.visibleGraph.unionById.get(unionId)?.status
            }
            lineage={lineageSet}
            rowGap={opts.rowGap}
            cardWidth={opts.cardWidth}
          />

          {model.layout.nodes.map((node) => {
            const person = model.visibleGraph.personById.get(node.personId)
            if (!person) return null

            const relationship = model.relationshipOf(node.personId)
            const context: PersonCardContext = {
              person,
              generation: node.generation,
              branch: model.branchOf.get(node.personId) ?? null,
              relationship:
                relationship && formatRelationship
                  ? {
                      ...relationship,
                      label: formatRelationship(relationship, person),
                    }
                  : relationship,
              isFocused: node.personId === focusId,
              isDimmed: lineageSet !== null && !lineageSet.has(node.personId),
            }

            // Selecting is a real <button> stretched over the card, rather than
            // the card itself being one: the card carries a link to the
            // person's location, and an <a> inside a <button> is invalid. The
            // overlay sits below that link so both stay clickable — and custom
            // cards passed to `renderCard` get the behaviour for free.
            return (
              <div
                key={node.personId}
                data-slot="family-tree-node"
                data-person-id={node.personId}
                data-dimmed={context.isDimmed || undefined}
                data-branch={context.branch ?? "none"}
                className="group/node"
                style={{
                  translate: `${node.x}px ${node.y}px`,
                  width: node.width,
                  height: node.height,
                }}
              >
                {renderCard ? (
                  renderCard(context)
                ) : (
                  <MemoPersonCard {...context} />
                )}
                <button
                  type="button"
                  data-slot="family-tree-select"
                  data-ft-interactive=""
                  aria-pressed={context.isFocused}
                  aria-label={personLabel(person, context.relationship)}
                  onClick={() => setFocus(node.personId)}
                  className="absolute inset-0 z-0 cursor-pointer rounded-lg outline-none focus-visible:ring-[2px] focus-visible:ring-ring/60"
                />
              </div>
            )
          })}
        </div>
      </div>

      <p id="family-tree-help" className="sr-only">
        {model.layout.nodes.length} people across{" "}
        {model.layout.generations.length} generations. Select a person to see
        how everyone is related to them, then use the arrow keys to move between
        parents, children and siblings.
      </p>

      {showToolbar ? (
        <Toolbar
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
          onFit={fitAll}
          onCenterFocus={centerOnFocus}
          hasFocus={Boolean(focusId)}
        />
      ) : null}

      {/* Keeps the row-height token in sync for consumers styling from CSS. */}
      <style>{`[data-slot="family-tree"]{--ft-row-height:${rowHeight}px}`}</style>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Toolbar                                   */
/* -------------------------------------------------------------------------- */

function Toolbar({
  focusMode,
  onFocusModeChange,
  onZoomIn,
  onZoomOut,
  onFit,
  onCenterFocus,
  hasFocus,
}: {
  focusMode: FocusMode
  onFocusModeChange: (mode: FocusMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onCenterFocus: () => void
  hasFocus: boolean
}) {
  return (
    <div
      data-slot="family-tree-toolbar"
      data-ft-interactive=""
      className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/85 p-1 shadow-sm backdrop-blur"
    >
      <IconButton label="Zoom out" onClick={onZoomOut}>
        <ZoomOutIcon />
      </IconButton>
      <IconButton label="Zoom in" onClick={onZoomIn}>
        <ZoomInIcon />
      </IconButton>
      <IconButton label="Fit to screen" onClick={onFit}>
        <MaximizeIcon />
      </IconButton>
      <IconButton
        label="Centre on selection"
        onClick={onCenterFocus}
        disabled={!hasFocus}
      >
        <FocusIcon />
      </IconButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Base UI's ToggleGroup always deals in arrays, single-select or not. */}
      <ToggleGroup
        size="sm"
        value={[focusMode]}
        onValueChange={(value) => {
          const next = value[0] as FocusMode | undefined
          if (next) onFocusModeChange(next)
        }}
      >
        <ToggleGroupItem value="highlight" className="px-2 text-xs">
          Highlight
        </ToggleGroupItem>
        <ToggleGroupItem value="isolate" className="px-2 text-xs">
          Isolate
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={label} {...props}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Keyboard navigation                            */
/* -------------------------------------------------------------------------- */

/**
 * Moves selection by family relationship rather than document order: up and
 * down walk the generations, left and right step along the current row. That
 * matches what the tree looks like, which is the only mental model a keyboard
 * user has to go on.
 */
function navigate(
  key: string,
  focusId: string,
  model: ReturnType<typeof useFamilyTree>
): string | null {
  const { visibleGraph: graph, layout } = model
  const node = layout.nodeById.get(focusId)
  if (!node) return null

  if (key === "ArrowUp") {
    return (graph.parentsOf.get(focusId) ?? [])[0] ?? null
  }

  if (key === "ArrowDown") {
    return (graph.childrenOf.get(focusId) ?? [])[0] ?? null
  }

  if (key === "ArrowLeft" || key === "ArrowRight") {
    const row = layout.generations.find((r) => r.generation === node.generation)
    if (!row) return null
    const index = row.personIds.indexOf(focusId)
    const next = key === "ArrowLeft" ? index - 1 : index + 1
    return row.personIds[next] ?? null
  }

  return null
}
