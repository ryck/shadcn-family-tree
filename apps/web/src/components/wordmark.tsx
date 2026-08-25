import { MarkIcon } from "./mark-icon"
import { site } from "@/lib/site"

/**
 * `shadcn-family-tree` with the tail in amber, the way rtk-query-devtools
 * splits its own name.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <MarkIcon className="mr-2 inline size-4 align-[-2px] text-primary" />
      <span className="font-mono">{site.nameLead}</span>
      <span className="font-mono text-primary">{site.nameAccent}</span>
    </span>
  )
}
