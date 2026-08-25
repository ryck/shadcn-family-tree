import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { FamilyTree } from "@workspace/family-tree"
import { Badge } from "@workspace/ui/components/badge"

import { MarkIcon } from "@/components/mark-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { gonzalezLago } from "@/data/gonzalez"

export const Route = createFileRoute("/gonzalez")({
  head: () => ({
    meta: [
      { title: "González Lago family tree" },
      // Unlinked, and carries details of real living people, so keep it out of
      // search results. Deliberately not added to robots.txt: that file is
      // public and would advertise the path.
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: Gonzalez,
})

function Gonzalez() {
  // Opens on Ricardo, so every badge reads from his point of view.
  const [focusId, setFocusId] = React.useState<string | null>(
    "ricardo-gonzalez-castro"
  )

  const persona = focusId
    ? gonzalezLago.find((p) => p.id === focusId)
    : undefined

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <MarkIcon className="size-4 shrink-0 text-primary" />
        <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          González Lago
        </span>

        <span className="hidden text-sm text-muted-foreground sm:inline">
          {gonzalezLago.length} people
        </span>

        {persona ? (
          <>
            <span className="hidden text-sm text-muted-foreground md:inline">
              · viewing as
            </span>
            <Badge variant="secondary" className="truncate">
              {persona.name}
            </Badge>
          </>
        ) : null}

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Full bleed: the tree takes everything below the strip. */}
      <main className="min-h-0 flex-1">
        <FamilyTree
          people={gonzalezLago}
          focusId={focusId}
          onFocusChange={setFocusId}
          // Gen 1–3 (index 0–2) are great-grandparents and older: the records
          // are patchy and often carry a birth year with no death year, so
          // assuming they are alive produces ages like 98. Those rows show an
          // age only when a death date is actually recorded.
          inferLivingAge={(_person, generation) => generation >= 3}
          // 95 people is ~11,000px across: fitting the whole tree bottoms out
          // at the minimum zoom and the cards become unreadable. Isolate opens
          // on the selected person's line, and the toolbar switches back to
          // Highlight to explore the rest.
          defaultFocusMode="isolate"
        />
      </main>
    </div>
  )
}
