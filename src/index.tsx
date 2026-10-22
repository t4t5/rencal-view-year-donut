import { type MouseEvent, type PointerEvent, useMemo, useState } from "react"

import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  epochDay,
  formatMonth,
  startOfWeek,
  Temporal,
  useDisplaySettings,
  useEventsInRange,
  useNavigation,
  useToday,
} from "@rencomputer/rencal-sdk"

import { CenterPanel } from "./CenterPanel"
import { DonutSegment } from "./DonutSegment"
import {
  dayAngle,
  dayAtPoint,
  LANE_STEP,
  polar,
  R_HOLE,
  R_LANES,
  R_MONTHS,
  R_OUTER,
  R_TICKS,
  R_TIMED,
  sector,
  TIMED_STEP,
  VIEW_SIZE,
} from "./geometry"
import { layoutYear } from "./layout"
import "./styles.css"

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
// Gap on each side of a day's slice, as a fraction of the slice.
const DAY_PAD = 0.12

export default function YearDonutView() {
  const { activeDate, goToDate } = useNavigation()
  const { firstDayOfWeek } = useDisplaySettings()
  const today = useToday()
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  const { year } = activeDate
  const yearStart = useMemo(() => Temporal.PlainDate.from({ year, month: 1, day: 1 }), [year])
  const nextYearStart = useMemo(() => yearStart.add({ years: 1 }), [yearStart])
  const daysInYear = yearStart.daysInYear
  const yearStartDay = epochDay(yearStart)
  const events = useEventsInRange(yearStart, nextYearStart)

  const layout = useMemo(
    () => layoutYear(events, yearStartDay, daysInYear),
    [events, yearStartDay, daysInYear],
  )

  const angleOf = (day: number) => dayAngle(day, daysInYear)
  const slice = (day: number, r0: number, r1: number, toDay = day) => {
    const pad = angleOf(DAY_PAD)
    return sector(r0, r1, angleOf(day) + pad, angleOf(toDay + 1) - pad)
  }

  const segments = useMemo(() => {
    const angle = (day: number) => dayAngle(day, daysInYear)
    const pad = angle(DAY_PAD)
    const arc = (from: number, to: number, r0: number, r1: number) =>
      sector(r0, r1, angle(from) + pad, angle(to + 1) - pad)

    return [
      ...layout.lanes.map(({ event, lane, from, to }) => {
        const r0 = R_LANES + lane * LANE_STEP
        return { event, d: arc(from, to, r0, r0 + LANE_STEP - 2) }
      }),
      ...layout.timed.map(({ event, day, slot }) => {
        const r0 = R_TIMED + slot * TIMED_STEP
        return { event, d: arc(day, day, r0, r0 + TIMED_STEP - 1.5) }
      }),
    ]
  }, [layout, daysInYear])

  // Weekend shading, week ticks and month bands only change with the year.
  const backdrop = useMemo(() => {
    const angle = (day: number) => dayAngle(day, daysInYear)

    const weekends: string[] = []
    let runStart: number | null = null
    for (let day = 0; day <= daysInYear; day++) {
      const weekend = day < daysInYear && yearStart.add({ days: day }).dayOfWeek >= 6
      if (weekend && runStart === null) runStart = day
      if (!weekend && runStart !== null) {
        weekends.push(sector(R_HOLE, R_TICKS, angle(runStart), angle(day)))
        runStart = null
      }
    }

    const weekStarts: number[] = []
    const firstWeek = startOfWeek(yearStart, firstDayOfWeek)
    for (let date = firstWeek; date.year <= year; date = date.add({ weeks: 1 })) {
      const day = epochDay(date) - yearStartDay
      if (day > 0) weekStarts.push(day)
    }

    const months = MONTHS.map((month) => {
      const start = Temporal.PlainDate.from({ year, month, day: 1 })
      const from = epochDay(start) - yearStartDay
      const to = from + start.daysInMonth
      return { month, start, from, to }
    })

    return { weekends, weekStarts, months }
  }, [year, yearStart, yearStartDay, daysInYear, firstDayOfWeek])

  const selectedDay = epochDay(activeDate) - yearStartDay
  const todayDay = today.year === year ? epochDay(today) - yearStartDay : null
  const focusDay = hoverDay ?? selectedDay
  const focusDate = yearStart.add({ days: focusDay })

  const toViewPoint = (e: PointerEvent | MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = VIEW_SIZE / rect.width
    return {
      x: (e.clientX - rect.left) * scale - VIEW_SIZE / 2,
      y: (e.clientY - rect.top) * scale - VIEW_SIZE / 2,
    }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const { x, y } = toViewPoint(e)
    // Keep the hovered day while the pointer is over the centre, so its events can be clicked.
    if (Math.hypot(x, y) < R_HOLE) return
    setHoverDay(dayAtPoint(x, y, daysInYear))
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (target.closest('[data-slot="calendar-event"], [data-slot="year-donut-center"]')) return
    const { x, y } = toViewPoint(e)
    const day = dayAtPoint(x, y, daysInYear)
    if (day !== null) goToDate(yearStart.add({ days: day }))
  }

  const holeInset = `${((VIEW_SIZE / 2 - R_HOLE) / VIEW_SIZE) * 100}%`
  const holeSize = `${((R_HOLE * 2) / VIEW_SIZE) * 100}%`

  return (
    <div data-slot="year-donut" className="flex flex-col h-full">
      <div
        data-slot="year-donut-header"
        className="flex items-center justify-between shrink-0 px-(--layout-padding) pb-2"
      >
        <div className="flex items-baseline gap-3">
          <h2 data-typography="heading" className="text-2xl font-bold">
            {year}
          </h2>
          <span data-typography="numerical" className="text-xs text-muted-foreground tabular-nums">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            data-direction="previous"
            aria-label="Previous year"
            variant="ghost"
            size="icon-xs"
            round
            tabIndex={-1}
            onClick={() => goToDate(activeDate.subtract({ years: 1 }))}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            data-direction="next"
            aria-label="Next year"
            variant="ghost"
            size="icon-xs"
            round
            tabIndex={-1}
            onClick={() => goToDate(activeDate.add({ years: 1 }))}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="grow min-h-0 flex items-center justify-center px-(--layout-padding) pb-(--layout-padding)"
        style={{ containerType: "size" }}
      >
        <div
          className="relative aspect-square select-none"
          style={{ width: "min(100cqw, 100cqh)" }}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverDay(null)}
          onClick={handleClick}
        >
          <svg
            viewBox={`${-VIEW_SIZE / 2} ${-VIEW_SIZE / 2} ${VIEW_SIZE} ${VIEW_SIZE}`}
            className="size-full overflow-visible"
          >
            <g pointerEvents="none">
              {backdrop.weekends.map((d, i) => (
                <path key={i} d={d} fill="var(--weekend)" />
              ))}

              <path d={slice(selectedDay, R_HOLE, R_TICKS)} fill="var(--selected)" opacity={0.7} />
              {hoverDay !== null && hoverDay !== selectedDay && (
                <path d={slice(hoverDay, R_HOLE, R_TICKS)} fill="var(--hover)" />
              )}

              {backdrop.months.map(({ month, from }) => {
                const [x0, y0] = polar(R_HOLE, angleOf(from))
                const [x1, y1] = polar(R_MONTHS, angleOf(from))
                return (
                  <line
                    key={month}
                    x1={x0}
                    y1={y0}
                    x2={x1}
                    y2={y1}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                )
              })}

              {backdrop.weekStarts.map((day) => {
                const [x0, y0] = polar(R_TICKS, angleOf(day))
                const [x1, y1] = polar(R_TICKS + 7, angleOf(day))
                return (
                  <line
                    key={day}
                    x1={x0}
                    y1={y0}
                    x2={x1}
                    y2={y1}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                  />
                )
              })}

              {backdrop.months.map(({ month, start, from, to }) => (
                <MonthBand
                  key={month}
                  label={formatMonth(start, "short")}
                  a0={angleOf(from)}
                  a1={angleOf(to)}
                  isActive={month === focusDate.month}
                />
              ))}
            </g>

            {segments.map(({ event, d }) => (
              <DonutSegment key={event.key} event={event} d={d} />
            ))}

            {todayDay !== null && <TodayNeedle angle={angleOf(todayDay + 0.5)} />}
          </svg>

          <div className="absolute" style={{ left: holeInset, top: holeInset, width: holeSize, height: holeSize }}>
            <CenterPanel
              date={focusDate}
              dayIndex={focusDay}
              daysInYear={daysInYear}
              events={layout.byDay[focusDay] ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthBand({
  label,
  a0,
  a1,
  isActive,
}: {
  label: string
  a0: number
  a1: number
  isActive: boolean
}) {
  const mid = (a0 + a1) / 2
  const [x, y] = polar((R_MONTHS + R_OUTER) / 2, mid)
  const degrees = (mid * 180) / Math.PI
  // Flip labels on the lower half so they never read upside down.
  const rotation = mid > Math.PI / 2 && mid < (Math.PI * 3) / 2 ? degrees + 180 : degrees

  return (
    <g data-slot="year-donut-month" data-active={isActive || undefined}>
      <path
        d={sector(R_MONTHS, R_OUTER, a0 + 0.004, a1 - 0.004)}
        fill={isActive ? "var(--accent)" : "var(--muted)"}
      />
      <text
        x={x}
        y={y}
        transform={`rotate(${rotation} ${x} ${y})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        letterSpacing={1.5}
        fill={isActive ? "var(--accent-foreground)" : "var(--muted-foreground)"}
      >
        {label.toUpperCase()}
      </text>
    </g>
  )
}

function TodayNeedle({ angle }: { angle: number }) {
  const [x0, y0] = polar(R_HOLE - 4, angle)
  const [x1, y1] = polar(R_OUTER + 6, angle)

  return (
    <g data-slot="year-donut-today" pointerEvents="none">
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--primary)" strokeWidth={2} />
      <circle cx={x1} cy={y1} r={5} fill="var(--primary)" />
    </g>
  )
}
