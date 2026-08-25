/**
 * Small amber label above a heading — mono, uppercase, widely tracked.
 * Borrowed from rtk-query-devtools, where it is the piece that carries the
 * brand colour without shouting.
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
      {children}
    </p>
  )
}
