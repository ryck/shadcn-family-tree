import { describe, expect, it } from "vitest"
import {
  ageHint,
  ageOf,
  displayAge,
  isPreciseDate,
  lifespan,
  lifespanWithAge,
} from "../dates"
import type { Person } from "../types"

/** A fixed "today" so these never rot. */
const TODAY = new Date(2026, 7, 25) // 25 August 2026

const person = (over: Partial<Person>): Person => ({
  id: "x",
  name: "Test",
  sex: "unknown",
  ...over,
})

describe("ageOf", () => {
  it("counts to today for the living", () => {
    expect(ageOf(person({ birth: { date: "1987" } }), TODAY)).toBe(39)
  })

  it("counts to death for the dead", () => {
    const p = person({ birth: { date: "1931" }, death: { date: "2009" } })
    expect(ageOf(p, TODAY)).toBe(78)
  })

  it("is exact when both ends carry a day", () => {
    const p = person({
      birth: { date: "1931-11-02" },
      death: { date: "2009-06-14" },
    })
    // Died before his birthday that year, so 77 rather than 78.
    expect(ageOf(p, TODAY)).toBe(77)
  })

  it("does not count a birthday that has not happened yet", () => {
    expect(ageOf(person({ birth: { date: "1987-12-01" } }), TODAY)).toBe(38)
    expect(ageOf(person({ birth: { date: "1987-01-01" } }), TODAY)).toBe(39)
  })

  it("handles a birthday falling exactly today", () => {
    expect(ageOf(person({ birth: { date: "1987-08-25" } }), TODAY)).toBe(39)
  })

  it("reads a year out of a fuzzy date", () => {
    expect(ageOf(person({ birth: { date: "c. 1880" } }), TODAY)).toBe(146)
  })

  it("returns null without a birth year", () => {
    expect(ageOf(person({}), TODAY)).toBeNull()
    expect(ageOf(person({ death: { date: "1990" } }), TODAY)).toBeNull()
  })

  it("returns null when the death year is unrecorded", () => {
    // Marked dead with no date: there is nothing to measure against.
    const p = person({ birth: { date: "1940" }, death: {} })
    expect(ageOf(p, TODAY)).toBeNull()
  })

  it("returns null rather than a negative age", () => {
    const p = person({ birth: { date: "2009" }, death: { date: "1931" } })
    expect(ageOf(p, TODAY)).toBeNull()
  })
})

describe("lifespan", () => {
  it("renders each combination of dates", () => {
    expect(
      lifespan(person({ birth: { date: "1948" }, death: { date: "2001" } }))
    ).toBe("1948 – †2001")
    expect(lifespan(person({ birth: { date: "1975" } }))).toBe("1975")
    expect(lifespan(person({ death: { date: "1990" } }))).toBe("†1990")
    expect(lifespan(person({ death: {} }))).toBe("†")
    expect(lifespan(person({}))).toBeNull()
  })

  it("marks a death with no year so a bare year always means birth", () => {
    expect(lifespan(person({ birth: { date: "1928" }, death: {} }))).toBe(
      "1928 – †"
    )
  })

  it("shows only the year, even when a full date is recorded", () => {
    const p = person({
      birth: { date: "1979-10-15" },
      death: { date: "2009-06-14" },
    })
    expect(lifespan(p)).toBe("1979 – †2009")
    expect(lifespan(person({ birth: { date: "1979-10-15" } }))).toBe("1979")
  })

  it("normalises a fuzzy year but keeps a date it cannot parse", () => {
    expect(lifespan(person({ birth: { date: "c. 1880" } }))).toBe("1880")
    expect(lifespan(person({ birth: { date: "primavera" } }))).toBe("primavera")
  })
})

describe("lifespanWithAge", () => {
  it("brackets the age after the dates", () => {
    const p = person({ birth: { date: "1931" }, death: { date: "2009" } })
    expect(lifespanWithAge(p, { today: TODAY })).toBe("1931 – †2009 (78)")
    expect(
      lifespanWithAge(person({ birth: { date: "1987" } }), { today: TODAY })
    ).toBe("1987 (39)")
  })

  it("keeps the precise date for the age but not for the label", () => {
    const p = person({ birth: { date: "1979-10-15" } })
    // Birthday not reached on 25 Aug 2026, so 46 rather than 47.
    expect(lifespanWithAge(p, { today: TODAY })).toBe("1979 (46)")
  })

  it("leaves the dates alone when there is no age to show", () => {
    expect(
      lifespanWithAge(person({ death: { date: "1990" } }), { today: TODAY })
    ).toBe("†1990")
    expect(lifespanWithAge(person({}), { today: TODAY })).toBeNull()
  })
})

describe("displayAge", () => {
  it("infers a living age by default", () => {
    expect(
      displayAge(person({ birth: { date: "1987" } }), { today: TODAY })
    ).toBe(39)
  })

  it("withholds an inferred age when asked to", () => {
    const living = person({ birth: { date: "1928" } })
    expect(displayAge(living, { today: TODAY, inferLiving: false })).toBeNull()
  })

  it("shows an age from a full birth date even when inference is off", () => {
    // A date down to the day means the record is close enough to trust.
    const p = person({ birth: { date: "1966-09-25" } })
    expect(displayAge(p, { today: TODAY, inferLiving: false })).toBe(59)
  })

  it("still reports age at death when inference is off", () => {
    const dead = person({ birth: { date: "1931" }, death: { date: "2009" } })
    expect(displayAge(dead, { today: TODAY, inferLiving: false })).toBe(78)
  })

  it("drops the bracketed age from the label too", () => {
    const living = person({ birth: { date: "1928" } })
    expect(lifespanWithAge(living, { today: TODAY, inferLiving: false })).toBe(
      "1928"
    )
  })
})

describe("isPreciseDate", () => {
  it("tells a full day apart from a bare year", () => {
    expect(isPreciseDate("1966-09-25")).toBe(true)
    expect(isPreciseDate("1966")).toBe(false)
    expect(isPreciseDate("c. 1880")).toBe(false)
    expect(isPreciseDate(undefined)).toBe(false)
  })
})

describe("ageHint", () => {
  it("says what the bracketed number means", () => {
    expect(ageHint(person({ birth: { date: "1987" } }), { today: TODAY })).toBe(
      "Age 39"
    )
    expect(
      ageHint(person({ birth: { date: "1931" }, death: { date: "2009" } }), {
        today: TODAY,
      })
    ).toBe("Age 78 at death")
    expect(ageHint(person({}), { today: TODAY })).toBeUndefined()
  })
})
