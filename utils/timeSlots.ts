import dayjs from 'dayjs'

// Business Rules:
// - Daily: 10:30 - 21:30
// - Booking unit: 1 hour
// - Break: 12:30 - 13:30 (Exclude 12:30 slot)
// - Break: 18:30 - 19:30 (Exclude 18:30 slot)
// - Valid start hours: 10, 11, 13, 14, 15, 16, 17, 19, 20
// - Minutes always 30

export const generateDailySlots = (dateDisplayStr: string): number[] => {
  // Use dayjs(startOf('day')) to avoid timezone issues
  // Input dateDisplayStr should be YYYY-MM-DD
  const base = dayjs(dateDisplayStr).startOf('day')
  const slots: number[] = []

  for (let h = 10; h <= 20; h++) {
    // Exclude break times
    if (h === 12 || h === 18) continue

    // Always 30 minutes
    const slot = base.hour(h).minute(30).second(0).millisecond(0).valueOf()
    slots.push(slot)
  }

  return slots
}

// NOTE: This logic MUST match Firestore Security Rules
export const isValidSlot = (amount: number): boolean => {
  const d = dayjs(amount)

  const m = d.minute()
  // Rule: minute must be 30
  if (m !== 30) return false

  const h = d.hour()
  // Rule: hour between 10 and 20 (inclusive)
  if (h < 10 || h > 20) return false

  // Rule: Exclude 12 (12:30) and 18 (18:30)
  if (h === 12 || h === 18) return false

  return true
}

export const formatSlotTime = (ts: number): string => {
  return dayjs(ts).format('HH:mm')
}
