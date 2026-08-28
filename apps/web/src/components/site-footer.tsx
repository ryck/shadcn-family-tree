import { HeartIcon } from "lucide-react"

import { textLink } from "@/lib/link"

/**
 * Outbound only. The header already carries the internal routes, and repeating
 * them here would just be a second nav.
 */
const LINKS = [
  { href: "https://ui.shadcn.com", label: "shadcn/ui" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {/*
            The phrase is the hover target, not the heart: at 12px the icon
            alone is a fiddly thing to land on.
          */}
          <span className="group">
            Made with{" "}
            {/*
              A lucide icon rather than an emoji, so the heart takes the brand
              amber instead of the font's own colour. `fill-primary` wins over
              lucide's `fill="none"` attribute because CSS beats presentation
              attributes. `inline-block` because transforms do not apply to
              inline boxes, so the beat would otherwise do nothing.

              The word is carried by adjacent screen-reader text rather than by
              `role="img"` + `aria-label` on the svg, so this still reads "Made
              with love by ryck.dev" without dressing a decorative glyph up as
              an image.
            */}
            <HeartIcon
              size={12}
              aria-hidden
              className="inline-block fill-primary align-[-0.1em] text-primary group-hover:animate-heartbeat"
            />
            <span className="sr-only">love</span> by{" "}
            <a
              href="https://ryck.dev"
              target="_blank"
              rel="noreferrer"
              className={textLink}
            >
              ryck.dev
            </a>
          </span>
        </span>

        <div className="flex flex-wrap gap-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={textLink}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
