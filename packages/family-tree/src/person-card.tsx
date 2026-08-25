import * as React from "react"
import {
  CircleHelpIcon,
  MapPinIcon,
  MarsIcon,
  NonBinaryIcon,
  VenusIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { ageHint, lifespanWithAge } from "./dates"
import type { Person, Relationship, Sex } from "./types"

export interface PersonCardContext {
  person: Person
  generation: number
  /** Palette slot, or null when the person sits outside every coloured line. */
  branch: number | null
  relationship: Relationship | null
  isFocused: boolean
  isDimmed: boolean
  /** False where a living person's age would be a guess; see `AgeOptions`. */
  inferLivingAge: boolean
}

export interface PersonCardProps extends Omit<PersonCardContext, "isDimmed"> {
  /** Drops the location row, for dense trees. */
  compact?: boolean
}

const SEX_ICON: Record<Sex, React.ComponentType<{ className?: string }>> = {
  male: MarsIcon,
  female: VenusIcon,
  other: NonBinaryIcon,
  unknown: CircleHelpIcon,
}

const SEX_LABEL: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  other: "Non-binary",
  unknown: "Sex not recorded",
}

/** What a screen reader announces for a card: name plus how they are related. */
export function personLabel(
  person: Person,
  relationship: Relationship | null
): string {
  const term = relationship?.label ? relationship.label : null
  return term ? `${person.name}, ${term}` : person.name
}

/** Where a place name points. A search, not a pin — the data is free text. */
export function mapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
}

export function PersonCard({
  person,
  generation,
  branch,
  relationship,
  isFocused,
  inferLivingAge,
  compact = false,
}: PersonCardProps) {
  const dates = lifespanWithAge(person, { inferLiving: inferLivingAge })
  const deceased = Boolean(person.death)
  const SexIcon = SEX_ICON[person.sex]

  // The focused card gets a badge too — an empty slot where every other card
  // has a term reads as missing data rather than as "this one is you".
  const badge = relationship?.label ? relationship.label : null

  const place = person.location ?? person.birth?.place

  // Nickname rides with the dates rather than trailing the name, which keeps
  // the name row short enough to survive truncation at this card width.
  const meta = [person.nickname && `“${person.nickname}”`, dates]
    .filter(Boolean)
    .join(" · ")

  return (
    <Card
      data-slot="family-tree-card"
      data-person-id={person.id}
      data-sex={person.sex}
      data-generation={generation}
      data-branch={branch ?? "none"}
      data-focused={isFocused || undefined}
      data-deceased={deceased || undefined}
      className={cn(
        "relative flex size-full flex-col gap-0 overflow-hidden rounded-lg py-2 pr-2.5 pl-3 select-none",
        "transition-[box-shadow,border-color]",
        "group-hover/node:border-[var(--ft-branch)]",
        isFocused &&
          "border-[var(--ft-branch)] ring-[2px] ring-[var(--ft-branch)]/35",
        deceased && "border-dashed"
      )}
    >
      {/* Branch identity as a spine, so several branches side by side stay
          distinguishable without washing the whole card in colour. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ft-branch)]"
      />

      {/* Name, led by the sex icon. */}
      <div className="flex items-center gap-1.5">
        <SexIcon
          className="size-3.5 shrink-0 text-[var(--ft-branch)]"
          aria-label={SEX_LABEL[person.sex]}
        />
        <span
          className={cn(
            "truncate text-[13px] leading-tight font-medium",
            deceased && "text-muted-foreground"
          )}
          title={person.name}
        >
          {person.name}
        </span>
      </div>

      {/* Nickname and lifespan. */}
      {meta ? (
        <div
          className="mt-0.5 truncate text-[10px] text-muted-foreground tabular-nums"
          title={ageHint(person, { inferLiving: inferLivingAge })}
        >
          {meta}
        </div>
      ) : null}

      {/* Relationship on the left, where it is; place on the right. */}
      <div className="mt-auto flex h-4 items-center justify-between gap-2">
        {badge ? (
          <Badge
            variant={isFocused ? "default" : "secondary"}
            className="h-4 shrink truncate px-1.5 text-[10px] font-normal"
          >
            {badge}
          </Badge>
        ) : (
          <span />
        )}

        {place && !compact ? (
          // Sits above the stretched select button that covers the card, so
          // the link stays reachable on its own.
          <a
            href={mapsUrl(place)}
            target="_blank"
            rel="noreferrer"
            data-ft-interactive=""
            className={cn(
              "group/place relative z-10 text-muted-foreground hover:text-foreground",
              "flex min-w-0 shrink items-center gap-0.5 text-[10px]"
            )}
            title={`Find ${place} on Google Maps`}
          >
            <MapPinIcon className="size-2.5 shrink-0" aria-hidden />
            <span className="truncate underline-offset-2 group-hover/place:underline">
              {place}
            </span>
          </a>
        ) : null}
      </div>
    </Card>
  )
}

export const MemoPersonCard = React.memo(PersonCard)
