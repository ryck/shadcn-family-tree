import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FamilyTree } from "@workspace/family-tree"
import { ArrowRightIcon, CheckIcon, CopyIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { SiteHeader } from "@/components/site-header"
import { hollis } from "@/data/hollis"

export const Route = createFileRoute("/")({ component: Home })

const INSTALL = "npx shadcn@latest add @familytree/family-tree"

const FEATURES = [
  {
    title: "Generation-layered",
    body: "Every person is placed on the row their generation belongs to, and each couple sits centred over the children hanging below them.",
  },
  {
    title: "Relationships, calculated",
    body: "Click anyone and the whole tree re-labels itself around them — second cousin twice removed, step-mother, brother-in-law, all derived from the graph.",
  },
  {
    title: "Colour-coded lines",
    body: "The four grandparent lines of whoever you are viewing as get their own hue, so the palette always answers: which side of the family is this?",
  },
  {
    title: "Zero dependencies",
    body: "The layout, the kinship calculus and the pan/zoom are all in the source you install. No graph library, no canvas runtime.",
  },
]

function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-10">
          <Badge variant="secondary" className="mb-4">
            shadcn registry component
          </Badge>

          <h1 className="max-w-2xl font-heading text-4xl font-medium tracking-tight text-balance sm:text-5xl">
            Family trees that know who everyone is to you.
          </h1>

          <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            A vertical, generation-layered tree built from shadcn cards. Pick a
            person and every other card tells you how they are related.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CopyableCommand command={INSTALL} />
            <Button variant="outline" render={<Link to="/demo" />}>
              Open the demo
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>

        {/* The component is the hero — a static screenshot would undersell the
            part that matters, which is what happens when you click someone. */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <div className="h-[560px] overflow-hidden rounded-xl border bg-muted/30">
            <FamilyTree people={hollis} defaultFocusId="iris" />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Drag to pan, scroll to zoom, click a card to view the family through
            their eyes.
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-24 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-1.5">
              <h2 className="font-heading font-medium">{feature.title}</h2>
              <p className="text-sm text-pretty text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span>Built with shadcn/ui, Base UI and TanStack Start.</span>
          <Link
            to="/docs"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  )
}

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked; the command is selectable either way.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3">
      <code className="font-mono text-sm whitespace-nowrap">{command}</code>
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
