import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

/**
 * Reads the stored preference before paint so the page never flashes light.
 *
 * Precedence is explicit choice, then the OS setting, then dark. The last step
 * matters: `matchMedia` answers `false` to both queries where a browser has no
 * preference at all, and falling through to light there would contradict the
 * dark `theme-color` the document advertises. The `catch` lands the same way,
 * so a blocked `localStorage` degrades to dark rather than to nothing.
 *
 * Kept in step with rtk-query-devtools.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d;if(t){d=t==="dark"}else if(matchMedia("(prefers-color-scheme: dark)").matches){d=true}else if(matchMedia("(prefers-color-scheme: light)").matches){d=false}else{d=true}document.documentElement.classList.toggle("dark",d)}catch(e){document.documentElement.classList.add("dark")}})()`

function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark")
  document.documentElement.classList.toggle("dark", next)
  try {
    localStorage.setItem("theme", next ? "dark" : "light")
  } catch {
    // Private browsing; the toggle still works for this session.
  }
}

/**
 * Which icon shows is decided by CSS from the `dark` class, not by React state.
 * The class is set by `themeScript` before hydration, so reading it into state
 * would mean either a hydration mismatch or a setState inside an effect — this
 * way there is no state to get out of sync at all.
 */
export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  )
}
