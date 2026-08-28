import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

/**
 * Chrome for the document-style pages: the landing page, the docs and the 404.
 *
 * Deliberately not applied in `__root`, and so not to every route. `/playground` and
 * `/gonzalez` are full-viewport surfaces where the tree takes all the height
 * below the header — a footer there would be pushed off screen or eat into the
 * canvas, so those two keep a header-only shell of their own.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
