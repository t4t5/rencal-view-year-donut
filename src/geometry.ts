// Ring layout in SVG units. The SVG is VIEW_SIZE wide, centred on (0, 0).
export const VIEW_SIZE = 940

export const R_HOLE = 210
// Timed events stack outwards from the hole, one slot per event, earliest first.
export const R_TIMED = 220
export const TIMED_STEP = 10
export const TIMED_SLOTS = 11
// All-day and multi-day events are packed into lanes outside the timed band.
export const R_LANES = 340
export const LANE_STEP = 12
export const LANE_COUNT = 5
export const R_TICKS = 406
export const R_MONTHS = 420
export const R_OUTER = 462

const TAU = Math.PI * 2

// Angles run clockwise from 12 o'clock, so 1 January sits at the top.
export function dayAngle(dayIndex: number, daysInYear: number): number {
  return (dayIndex / daysInYear) * TAU
}

export function polar(r: number, angle: number): [number, number] {
  return [r * Math.sin(angle), -r * Math.cos(angle)]
}

const fmt = (n: number) => n.toFixed(2)

// A ring segment between radii r0 < r1 and angles a0 < a1.
export function sector(r0: number, r1: number, a0: number, a1: number): string {
  // A full turn would start and end on the same point and draw nothing.
  const end = Math.min(a1, a0 + TAU - 0.0001)
  const large = end - a0 > Math.PI ? 1 : 0
  const [ox0, oy0] = polar(r1, a0)
  const [ox1, oy1] = polar(r1, end)
  const [ix1, iy1] = polar(r0, end)
  const [ix0, iy0] = polar(r0, a0)

  return [
    `M${fmt(ox0)} ${fmt(oy0)}`,
    `A${r1} ${r1} 0 ${large} 1 ${fmt(ox1)} ${fmt(oy1)}`,
    `L${fmt(ix1)} ${fmt(iy1)}`,
    `A${r0} ${r0} 0 ${large} 0 ${fmt(ix0)} ${fmt(iy0)}`,
    "Z",
  ].join(" ")
}

// The day under a point given in SVG units, or null outside the ring.
export function dayAtPoint(x: number, y: number, daysInYear: number): number | null {
  const r = Math.hypot(x, y)
  if (r < R_HOLE || r > R_OUTER) return null

  const angle = (Math.atan2(x, -y) + TAU) % TAU
  return Math.min(Math.floor((angle / TAU) * daysInYear), daysInYear - 1)
}
