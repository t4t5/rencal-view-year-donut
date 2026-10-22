import { type CalendarEvent, epochDay } from "@rencomputer/rencal-sdk"

import { LANE_COUNT, TIMED_SLOTS } from "./geometry"

export interface LaneEvent {
  event: CalendarEvent
  lane: number
  // Day indices within the year, inclusive and clamped to it.
  from: number
  to: number
}

export interface TimedEvent {
  event: CalendarEvent
  day: number
  slot: number
}

export interface YearLayout {
  lanes: LaneEvent[]
  timed: TimedEvent[]
  // Every event covering each day of the year, for the centre panel.
  byDay: CalendarEvent[][]
}

const spansDays = (event: CalendarEvent) =>
  event.start.kind === "date" || !event.firstDay.equals(event.lastDay)

export function layoutYear(
  events: readonly CalendarEvent[],
  yearStartDay: number,
  daysInYear: number,
): YearLayout {
  const byDay: CalendarEvent[][] = Array.from({ length: daysInYear }, () => [])
  const laneUse = Array.from({ length: LANE_COUNT }, () => new Uint8Array(daysInYear))
  const timedCount = new Uint8Array(daysInYear)
  const lanes: LaneEvent[] = []
  const timed: TimedEvent[] = []

  // Events arrive in start order, so first-fit packs them into the fewest lanes.
  for (const event of events) {
    const from = Math.max(epochDay(event.firstDay) - yearStartDay, 0)
    const to = Math.min(epochDay(event.lastDay) - yearStartDay, daysInYear - 1)
    if (from > to) continue

    for (let day = from; day <= to; day++) byDay[day].push(event)

    if (spansDays(event)) {
      const lane = laneUse.findIndex((use) => !use.subarray(from, to + 1).some(Boolean))
      if (lane === -1) continue
      laneUse[lane].fill(1, from, to + 1)
      lanes.push({ event, lane, from, to })
    } else {
      const slot = timedCount[from]
      if (slot >= TIMED_SLOTS) continue
      timedCount[from] = slot + 1
      timed.push({ event, day: from, slot })
    }
  }

  return { lanes, timed, byDay }
}
