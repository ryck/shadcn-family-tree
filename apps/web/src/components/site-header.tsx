import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

import { GithubIcon } from "./github-icon"
import { Wordmark } from "./wordmark"
import { site } from "@/lib/site"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-4">
        <Link to="/" className="mr-4 flex items-center text-sm font-medium">
          <Wordmark />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/demo" />}
        >
          Demo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/docs" />}
        >
          Docs
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="View the source on GitHub"
            nativeButton={false}
            render={
              <a href={site.github} target="_blank" rel="noreferrer">
                <GithubIcon className="size-4" />
              </a>
            }
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
