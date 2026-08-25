import type { SVGProps } from "react"

/**
 * The project mark: one node, a drop, a sibling bus, two children — the same
 * shape the component draws. Kept in sync with `public/favicon.svg`.
 */
export function MarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 7v3" />
        <path d="M5 14.5v-2.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2.5" />
      </g>
      <g fill="currentColor">
        <circle cx="12" cy="4.25" r="2.6" />
        <circle cx="5" cy="17.25" r="2.6" />
        <circle cx="19" cy="17.25" r="2.6" />
      </g>
    </svg>
  )
}
