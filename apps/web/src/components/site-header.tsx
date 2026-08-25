import { Link } from "@tanstack/react-router"
import { GitBranchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-4">
        <Link to="/" className="mr-4 flex items-center gap-2 font-medium">
          <GitBranchIcon className="size-4 rotate-180" />
          <span>family-tree</span>
        </Link>

        <Button variant="ghost" size="sm" render={<Link to="/demo" />}>
          Demo
        </Button>
        <Button variant="ghost" size="sm" render={<Link to="/docs" />}>
          Docs
        </Button>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
