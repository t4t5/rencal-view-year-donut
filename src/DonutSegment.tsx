import { memo } from "react"

import { type CalendarEvent, useEventProps } from "@rencomputer/rencal-sdk"

export const DonutSegment = memo(function DonutSegment({
  event,
  d,
}: {
  event: CalendarEvent
  d: string
}) {
  const eventProps = useEventProps(event)

  return (
    <path {...eventProps} data-view="year-donut" d={d} className="cursor-default outline-none">
      <title>{event.summary || "Untitled"}</title>
    </path>
  )
})
