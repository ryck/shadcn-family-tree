import type { Person } from "./types"

/**
 * Date handling for free-form genealogy data.
 *
 * `birth.date` and `death.date` are plain strings because that is what records
 * actually look like: "1987", "1952-03-01", "c. 1880". Everything here degrades
 * to whatever precision the string carries.
 */

/** The first four-digit year in a string, if there is one. */
export function yearOf(value: string | undefined): number | null {
  if (!value) return null
  const match = /\d{4}/.exec(value)
  return match ? Number(match[0]) : null
}

/** A calendar date, only when the string is a full ISO-style day. */
function dayOf(value: string | undefined): Date | null {
  if (!value) return null
  const match = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** True when a date pins an exact day rather than just a year. */
export function isPreciseDate(value: string | undefined): boolean {
  return dayOf(value) !== null
}

/**
 * Age in years: at death for those who have died, today for everyone else.
 *
 * Exact when both ends carry a day, otherwise the difference in years — which
 * is all year-only data can support, and is off by one until the birthday.
 * Returns null when there is nothing to measure: no birth year, or a death
 * with no year recorded.
 */
export function ageOf(person: Person, today: Date = new Date()): number | null {
  const bornYear = yearOf(person.birth?.date)
  if (bornYear === null) return null

  const diedYear = yearOf(person.death?.date)
  if (person.death && diedYear === null) return null

  const bornDay = dayOf(person.birth?.date)
  const endDay = person.death ? dayOf(person.death.date) : today

  if (bornDay && endDay) {
    let age = endDay.getFullYear() - bornDay.getFullYear()
    const beforeBirthday =
      endDay.getMonth() < bornDay.getMonth() ||
      (endDay.getMonth() === bornDay.getMonth() &&
        endDay.getDate() < bornDay.getDate())
    if (beforeBirthday) age--
    return age >= 0 ? age : null
  }

  const age = (diedYear ?? today.getFullYear()) - bornYear
  return age >= 0 ? age : null
}

/**
 * How a date reads on a card: just the year. A full date is worth recording —
 * `ageOf` uses it to get the age exactly right — but on a card it is noise.
 * Anything with no year in it falls back to the raw string rather than being
 * dropped.
 */
function displayYear(value: string | undefined): string | null {
  if (!value) return null
  const year = yearOf(value)
  return year === null ? value.trim() : String(year)
}

/**
 * "1948 – †2001", "1975", "†1990", or nothing at all.
 *
 * A bare year is a birth year — that is the overwhelmingly common case and a
 * "b." in front of every card is noise. The dagger always sits immediately
 * before the year of death, or stands alone when that year is unknown, so it
 * marks the death wherever it appears and never has to be read in context.
 * It is language-neutral too, unlike spelling the word out.
 */
export function lifespan(person: Person): string | null {
  const born = displayYear(person.birth?.date)
  const died = displayYear(person.death?.date)
  if (born && died) return `${born} – †${died}`
  if (born) return person.death ? `${born} – †` : born
  if (died) return `†${died}`
  return person.death ? "†" : null
}

export interface AgeOptions {
  today?: Date
  /**
   * A living person's age is *inferred*: it assumes the record is current and
   * that nobody has quietly died since it was written. That holds for recent
   * generations and stops holding further back. Set false where it does not,
   * and only a recorded death produces an age.
   */
  inferLiving?: boolean
}

/**
 * The age to actually put on a card, or null when it cannot be stated.
 *
 * A full birth date overrides `inferLiving`. Not because it says anything about
 * whether the person is alive — it does not — but because in practice a date
 * down to the day means someone knew them well enough to record it, and a
 * record that close is one that would have been updated on a death. A bare year
 * is the hearsay case `inferLiving` exists to catch.
 */
export function displayAge(
  person: Person,
  { today, inferLiving = true }: AgeOptions = {}
): number | null {
  const wellRecorded = person.death || isPreciseDate(person.birth?.date)
  if (!inferLiving && !wellRecorded) return null
  return ageOf(person, today)
}

/** Dates plus the age in brackets: "1931 – 2009 (78)", "b. 1987 (39)". */
export function lifespanWithAge(
  person: Person,
  options: AgeOptions = {}
): string | null {
  const dates = lifespan(person)
  if (!dates) return null
  const age = displayAge(person, options)
  return age === null ? dates : `${dates} (${age})`
}

/** Spells out what the bracketed number means, for a tooltip. */
export function ageHint(
  person: Person,
  options: AgeOptions = {}
): string | undefined {
  const age = displayAge(person, options)
  if (age === null) return undefined
  return person.death ? `Age ${age} at death` : `Age ${age}`
}
