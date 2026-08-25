import * as React from "react"
import type { TreeLayout, UnionAnchor } from "./types"

export interface ConnectorsProps {
  layout: TreeLayout
  branchOf: Map<string, number>
  statusOf: (unionId: string) => string | undefined
  /** People currently on the focus person's line; null means "no focus". */
  lineage: Set<string> | null
  /** Vertical distance between one row's bottom and the next row's top. */
  rowGap: number
  /** Needed to inset the couple link so it starts at the cards' edges. */
  cardWidth: number
}

const RADIUS = 10

/**
 * Draws every relationship line as one SVG layer beneath the cards.
 *
 * The layer is a sibling of the card layer inside the same transformed
 * container — not a `<foreignObject>` wrapping the cards. WebKit ignores `x`
 * and `y` on `foreignObject`, which is why bracket libraries that nest their
 * HTML inside SVG collapse to the origin in Safari. Keeping the two as
 * independent layers over a shared transform sidesteps that entirely and still
 * guarantees the lines and the cards move together.
 */
export function Connectors({
  layout,
  branchOf,
  statusOf,
  lineage,
  rowGap,
  cardWidth,
}: ConnectorsProps) {
  return (
    <svg
      data-slot="family-tree-connectors"
      width={layout.bounds.width}
      height={layout.bounds.height}
      aria-hidden
    >
      {layout.unions.map((anchor) => (
        <UnionEdges
          key={anchor.unionId}
          anchor={anchor}
          branchOf={branchOf}
          status={statusOf(anchor.unionId)}
          lineage={lineage}
          rowGap={rowGap}
          cardWidth={cardWidth}
        />
      ))}
    </svg>
  )
}

function UnionEdges({
  anchor,
  branchOf,
  status,
  lineage,
  rowGap,
  cardWidth,
}: {
  anchor: UnionAnchor
  branchOf: Map<string, number>
  status?: string
  lineage: Set<string> | null
  rowGap: number
  cardWidth: number
}) {
  const { partnerPoints, childPoints } = anchor

  // The whole union takes one colour, from whichever partner has a branch.
  const branch =
    partnerPoints
      .map((p) => branchOf.get(p.personId))
      .find((b) => b !== undefined) ??
    childPoints
      .map((p) => branchOf.get(p.personId))
      .find((b) => b !== undefined)

  const onLine =
    lineage === null ||
    partnerPoints.some((p) => lineage.has(p.personId)) ||
    childPoints.some((p) => lineage.has(p.personId))

  const shared = {
    "data-slot": "family-tree-edge",
    "data-branch": branch ?? "none",
    "data-dimmed": onLine ? undefined : true,
  } as const

  const elements: React.ReactNode[] = []

  /* ----------------------------- couple link ----------------------------- */

  if (partnerPoints.length === 2) {
    const [left, right] =
      partnerPoints[0].x <= partnerPoints[1].x
        ? partnerPoints
        : [partnerPoints[1], partnerPoints[0]]

    // Start and end at the cards' facing edges — a centre-to-centre line would
    // spend most of its length hidden behind the two cards.
    const startX = left.x + cardWidth / 2
    const endX = right.x - cardWidth / 2

    elements.push(
      <line
        key="couple"
        {...shared}
        data-status={status}
        x1={startX}
        y1={left.y}
        x2={endX}
        y2={right.y}
      />
    )

    // A dissolved marriage gets a hatch through the middle of the link, the
    // convention genealogy charts use for a divorce.
    if (status === "divorced") {
      const midX = (startX + endX) / 2
      const midY = (left.y + right.y) / 2
      for (const offset of [-3, 3]) {
        elements.push(
          <line
            key={`hatch${offset}`}
            {...shared}
            data-status={undefined}
            x1={midX + offset - 3}
            y1={midY + 6}
            x2={midX + offset + 3}
            y2={midY - 6}
          />
        )
      }
    }
  }

  /* ---------------------------- descent lines ---------------------------- */

  if (childPoints.length > 0) {
    // The bus runs across the middle of the gap between the two rows, so the
    // drop and the stubs are the same length regardless of how tall cards are.
    const busY = anchor.y + rowGap / 2
    const childTop = Math.min(...childPoints.map((p) => p.y))

    elements.push(
      <path
        key="drop"
        {...shared}
        d={`M ${anchor.x} ${anchor.y} L ${anchor.x} ${busY}`}
      />
    )

    for (const child of childPoints) {
      elements.push(
        <path
          key={`child-${child.personId}`}
          {...shared}
          data-branch={branchOf.get(child.personId) ?? branch ?? "none"}
          data-dimmed={
            lineage === null || lineage.has(child.personId) ? undefined : true
          }
          d={elbow(anchor.x, busY, child.x, childTop)}
        />
      )
    }
  }

  return <>{elements}</>
}

/**
 * An orthogonal path from the sibling bus down into a child's top edge:
 * along the bus, a rounded corner, then straight down. A child sitting directly
 * below its parents gets a plain vertical line with no corner at all.
 */
function elbow(fromX: number, busY: number, toX: number, toY: number): string {
  const dx = toX - fromX
  if (Math.abs(dx) < 0.5) return `M ${fromX} ${busY} L ${toX} ${toY}`

  const direction = Math.sign(dx)
  const radius = Math.min(RADIUS, Math.abs(dx) / 2, Math.abs(toY - busY) / 2)
  const cornerX = toX - direction * radius

  return [
    `M ${fromX} ${busY}`,
    `L ${cornerX} ${busY}`,
    `Q ${toX} ${busY} ${toX} ${busY + radius}`,
    `L ${toX} ${toY}`,
  ].join(" ")
}
