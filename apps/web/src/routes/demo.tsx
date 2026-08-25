import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { FamilyTree } from "@workspace/family-tree"
import type { FocusMode } from "@workspace/family-tree"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

import { SiteHeader } from "@/components/site-header"
import { datasets } from "@/data"
import type { DatasetKey } from "@/data"

export const Route = createFileRoute("/demo")({ component: Demo })

function Demo() {
  const [key, setKey] = React.useState<DatasetKey>("hollis")
  const [focusMode, setFocusMode] = React.useState<FocusMode>("highlight")

  const dataset = datasets[key]
  const [focusId, setFocusId] = React.useState<string | null>(
    dataset.defaultFocusId
  )

  // A new dataset needs a focus person that exists in it.
  const selectDataset = (next: DatasetKey) => {
    setKey(next)
    setFocusId(datasets[next].defaultFocusId)
  }

  const focused = focusId
    ? dataset.people.find((person) => person.id === focusId)
    : undefined

  return (
    // Same centred column as the landing and docs pages, with the header kept
    // in place so the demo is never a dead end. The tree fills whatever height
    // is left rather than the whole viewport.
    <div className="flex h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Dataset</span>
          {(Object.keys(datasets) as DatasetKey[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={option === key ? "secondary" : "ghost"}
              onClick={() => selectDataset(option)}
            >
              {datasets[option].name}
            </Button>
          ))}

          <Separator orientation="vertical" className="mx-1 h-5" />

          <span className="text-sm text-muted-foreground">
            {dataset.people.length} people
          </span>

          {focused ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <span className="text-sm text-muted-foreground">Viewing as</span>
              <Badge variant="secondary">{focused.name}</Badge>
            </>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-muted/30">
          <FamilyTree
            key={key}
            people={dataset.people}
            focusId={focusId}
            onFocusChange={setFocusId}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
          />
        </div>
      </main>
    </div>
  )
}
