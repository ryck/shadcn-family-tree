import { createFileRoute } from "@tanstack/react-router"

import { Eyebrow } from "@/components/eyebrow"
import { SiteShell } from "@/components/site-shell"
import { installCommand, site } from "@/lib/site"

export const Route = createFileRoute("/documentation")({ component: Documentation })

const SECTIONS = [
  { id: "installation", title: "Installation" },
  { id: "data", title: "Data model" },
  { id: "props", title: "Props" },
  { id: "kinship", title: "Relationship terms" },
  { id: "theming", title: "Theming" },
  { id: "accessibility", title: "Accessibility" },
]

function Documentation() {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-10">
        <nav className="sticky top-24 hidden h-fit w-44 shrink-0 flex-col gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="py-1 text-sm text-muted-foreground hover:text-primary"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Eyebrow>{site.namespace}/family-tree</Eyebrow>
          <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-primary">
            Documentation
          </h1>
          <p className="mt-2 text-muted-foreground">
            A vertical family tree component. Everything below ships as source
            into your project.
          </p>

          <Section id="installation" title="Installation">
            <P>
              The component and its whole engine install as one registry item.
              It pulls in the shadcn primitives it composes — card, badge,
              button, separator, toggle-group and tooltip — and has no runtime
              dependencies of its own.
            </P>
            <Code>{installCommand}</Code>
            <P>
              To install by name instead, register the namespace once in your{" "}
              <Cd>components.json</Cd>:
            </P>
            <Code>{`{
  "registries": {
    "${site.namespace}": "${site.url}/r/{name}.json"
  }
}`}</Code>
            <Code>{`npx shadcn@latest add ${site.namespace}/family-tree`}</Code>
            <P>Then render it inside something with a height.</P>
            <Code>{`import { FamilyTree } from "@/components/ui/family-tree"

export function Page() {
  return (
    <div className="h-svh">
      <FamilyTree people={people} defaultFocusId="iris" />
    </div>
  )
}`}</Code>
          </Section>

          <Section id="data" title="Data model">
            <P>
              A person needs a <Cd>name</Cd> and a <Cd>sex</Cd>. Relationships
              are flat: point at parents and partners by id, and the component
              derives the couples — what genealogists call unions — from that.
            </P>
            <Code>{`const people: Person[] = [
  { id: "a", name: "Ada Vance", sex: "female" },
  { id: "s", name: "Sam Vance", sex: "male", partnerIds: ["a"] },
  { id: "i", name: "Iris Vance", sex: "female", parentIds: ["a", "s"] },
]`}</Code>
            <P>
              Every distinct pair of parents becomes its own union, so half
              siblings separate automatically — no extra bookkeeping. Use{" "}
              <Cd>partnerships</Cd> instead of <Cd>partnerIds</Cd> when you want
              a status or a date, which is what drives the connector styling:
              solid for a marriage, dashed for a partnership, hatched for a
              divorce.
            </P>
            <Code>{`{
  id: "felix",
  name: "Felix Marchetti",
  sex: "male",
  partnerships: [
    { partnerId: "edith", status: "divorced", since: "1970", until: "1980" },
    { partnerId: "nadia", status: "married", since: "1983" },
  ],
}`}</Code>
            <P>
              Everything else is optional and rendered when present:{" "}
              <Cd>nickname</Cd>, <Cd>birth</Cd>, <Cd>death</Cd>,{" "}
              <Cd>location</Cd>, <Cd>branchId</Cd> to override the computed
              colour, and <Cd>meta</Cd> for anything you want to reach in a
              custom card. A location renders as a link to Google Maps.
            </P>
            <Note>
              Malformed data produces console diagnostics in development rather
              than exceptions — unknown ids, more than two parents and ancestry
              cycles are all reported and then worked around.
            </Note>
          </Section>

          <Section id="props" title="Props">
            <Table
              rows={[
                ["people", "Person[]", "The family. The only required prop."],
                [
                  "focusId / defaultFocusId",
                  "string | null",
                  "Who the tree is drawn relative to. Controlled or uncontrolled.",
                ],
                [
                  "onFocusChange",
                  "(id) => void",
                  "Fires when a card is selected.",
                ],
                [
                  "focusMode",
                  '"highlight" | "isolate"',
                  "Dim everyone off the line, or filter them out and re-lay out.",
                ],
                [
                  "renderCard",
                  "(ctx) => ReactNode",
                  "Replace the card entirely. Receives person, relationship, branch and focus state.",
                ],
                [
                  "formatRelationship",
                  "(rel, person) => string",
                  "Rewrite the calculated term, for translation or house style.",
                ],
                [
                  "layout",
                  "Partial<LayoutOptions>",
                  "Card size and the gaps between cards, rows and siblings.",
                ],
                [
                  "showToolbar / showGenerationRules",
                  "boolean",
                  "Both default to true.",
                ],
              ]}
            />
          </Section>

          <Section id="kinship" title="Relationship terms">
            <P>
              Selecting a person recomputes every other card's badge against
              them. The calculation walks both pedigrees to the nearest common
              ancestor and names the result, so it handles the awkward cases
              rather than stopping at cousins.
            </P>
            <Table
              head={["Situation", "Term"]}
              rows={[
                ["Shares both parents", "brother / sister"],
                ["Shares one parent", "half-brother / half-sister"],
                [
                  "Parent's spouse who is not a parent",
                  "step-mother / step-father",
                ],
                ["Grandparent's sibling", "great-aunt / great-uncle"],
                ["Common ancestor two up on both sides", "first cousin"],
                [
                  "Common ancestor two up, three on theirs",
                  "first cousin once removed",
                ],
                ["Spouse's parent", "mother-in-law / father-in-law"],
                ["Sibling's spouse", "brother-in-law / sister-in-law"],
                ["Dissolved partnership", "ex-husband / ex-wife"],
              ]}
            />
            <P>
              Terms follow the person being described. A sex of <Cd>other</Cd>{" "}
              or <Cd>unknown</Cd> falls back to neutral wording — sibling,
              child, partner — rather than guessing.
            </P>
          </Section>

          <Section id="theming" title="Theming">
            <P>
              Sizing and colour come from CSS custom properties on the root
              element, so you can restyle without touching the source.
            </P>
            <Code>{`.my-tree {
  --ft-card-width: 240px;
  --ft-card-height: 148px;
  --ft-row-gap: 96px;
  --ft-connector-width: 2px;
  --ft-dim-opacity: 0.2;
  --ft-branch-1: oklch(0.55 0.16 255);
}`}</Code>
            <Note>
              Changing <Cd>--ft-card-width</Cd> or <Cd>--ft-card-height</Cd>{" "}
              alone only restyles the cards. The layout is computed in
              JavaScript, so pass the same numbers through the <Cd>layout</Cd>{" "}
              prop for the geometry to follow.
            </Note>
            <P>
              Cards and connectors carry stable data attributes —{" "}
              <Cd>data-person-id</Cd>, <Cd>data-sex</Cd>,{" "}
              <Cd>data-generation</Cd>, <Cd>data-branch</Cd>,{" "}
              <Cd>data-focused</Cd>, <Cd>data-deceased</Cd>,{" "}
              <Cd>data-dimmed</Cd> — so you can hook styles onto any of them.
            </P>
          </Section>

          <Section id="accessibility" title="Accessibility">
            <P>
              Cards are real buttons with an accessible name that includes the
              calculated relationship, so a screen reader announces "Colin
              Hollis, father" rather than just a name. The viewport is described
              by a summary of how many people and generations it holds.
            </P>
            <P>
              Arrow keys navigate by family rather than by document order: up
              and down move to a parent or a child, left and right step along
              the current generation, and keyboard focus follows the selection.
              Pan and zoom animations respect <Cd>prefers-reduced-motion</Cd>.
            </P>
          </Section>
        </main>
      </div>
    </SiteShell>
  )
}

/* -------------------------------------------------------------------------- */

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 pt-10">
      <h2 className="font-heading text-xl font-medium tracking-tight text-primary">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  )
}

function Cd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em] text-foreground">
      {children}
    </code>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm">
      <code className="font-mono">{children}</code>
    </pre>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-muted-foreground/30 py-1 pl-4 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

const DEFAULT_HEAD = ["Prop", "Type", "Description"]

function Table({
  head = DEFAULT_HEAD,
  rows,
}: {
  head?: string[]
  rows: string[][]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-2 text-left font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t">
              {row.map((cell, index) => (
                <td
                  key={cell}
                  className={
                    index === row.length - 1
                      ? "px-4 py-2 text-muted-foreground"
                      : "px-4 py-2 font-mono text-xs whitespace-nowrap"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
