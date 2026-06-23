export function computeBreakTime(
  shiftStart: string,
  shiftEnd: string,
  offsetFrom: string,
  offsetMinutes: number,
  slotOffsetMinutes = 0,
): string {
  const base = offsetFrom === 'end' ? shiftEnd : shiftStart
  const [h, m] = base.split(':').map(Number)
  const baseMins = offsetFrom === 'end'
    ? (h * 60 + m) - offsetMinutes
    : (h * 60 + m) + offsetMinutes
  const totalMins = baseMins + slotOffsetMinutes
  const rh = Math.floor(((totalMins % 1440) + 1440) / 60) % 24
  const rm = ((totalMins % 60) + 60) % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}
