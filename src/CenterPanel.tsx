import { memo } from "react"

import {
  type CalendarEvent,
  formatTime,
  formatWeekday,
  formatMonth,
  Temporal,
  UntitledEventText,
  useDisplaySettings,
  useEventProps,
} from "@rencomputer/rencal-sdk"

export function CenterPanel({
  date,
  dayIndex,
  daysInYear,
  events,
}: {
  date: Temporal.PlainDate
  dayIndex: number
  daysInYear: number
  events: readonly CalendarEvent[]
}) {
  return (
    <div
      data-slot="year-donut-center"
      className="flex flex-col items-center size-full rounded-full px-[14%] pt-[17%] pb-[14%] gap-1 text-center"
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        {formatWeekday(date, "long")}
      </div>
      <div data-typography="heading" className="text-2xl font-bold leading-none">
        {date.day} {formatMonth(date, "long")}
      </div>
      <div data-typography="numerical" className="text-2xs text-muted-foreground tabular-nums">
        Day {dayIndex + 1} of {daysInYear}
      </div>

      <div className="flex flex-col w-full min-h-0 grow overflow-y-auto pt-2 text-left">
        {events.map((event) => (
          <CenterEvent key={event.key} event={event} />
        ))}
        {events.length === 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2">No events</div>
        )}
      </div>
    </div>
  )
}

const CenterEvent = memo(function CenterEvent({ event }: { event: CalendarEvent }) {
  const { timeFormat } = useDisplaySettings()
  const eventProps = useEventProps(event)

  return (
    <div
      {...eventProps}
      data-view="year-donut-list"
      className="flex items-center gap-2 shrink-0 rounded-sm px-2 py-0.5 cursor-default outline-none"
    >
      <div data-slot="calendar-event-color-marker" className="size-2 shrink-0 rounded-full" />
      <div data-slot="calendar-event-title" className="text-xs font-medium truncate grow">
        {event.summary || <UntitledEventText />}
      </div>
      <div
        data-slot="calendar-event-time"
        data-typography="numerical"
        className="text-2xs text-muted-foreground tabular-nums shrink-0"
      >
        {event.start.kind === "date" ? "All day" : formatTime(event.start, timeFormat)}
      </div>
    </div>
  )
})
