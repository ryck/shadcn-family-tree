import { Link } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"

import { GithubIcon } from "./github-icon"
import { textLink, textLinkActive } from "@/lib/link"
import { site } from "@/lib/site"
import { ThemeToggle } from "./theme-toggle"
import { Wordmark } from "./wordmark"

export function SiteHeader() {
  return (
    // Translucent + blurred rather than opaque, so content scrolling underneath
    // stays legible as motion instead of vanishing at a hard edge. The `/85`
    // fallback applies where `backdrop-filter` is unsupported, where a more
    // transparent bar would leave the nav unreadable.
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center text-sm text-foreground">
          <Wordmark />
        </Link>

        {/*
          Text links rather than ghost buttons: these navigate, and the
          underline is the affordance the rest of the site uses. It also drops
          the `nativeButton={false}` dance Base UI needs to render a Button as
          an anchor.
        */}
        <nav className="flex items-center gap-6 font-mono text-sm text-muted-foreground">
          <Link
            to="/playground"
            className={textLink}
            activeProps={{ className: textLinkActive }}
          >
            Playground
          </Link>
          <Link
            to="/documentation"
            className={textLink}
            activeProps={{ className: textLinkActive }}
          >
            Documentation
          </Link>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            // The icon sits outside the underline, so the decoration tracks the
            // label rather than striking through the mark.
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GithubIcon className="size-[15px]" />
            <span className={cn(textLink, "hidden sm:inline")}>GitHub</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
