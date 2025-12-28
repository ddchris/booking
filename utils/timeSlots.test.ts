import { describe, it, expect } from 'vitest'
import { generateDailySlots, isValidSlot } from './timeSlots'
import dayjs from 'dayjs'

describe('timeSlots', () => {
  describe('generateDailySlots', () => {
    it('should generate valid slots for a given day', () => {
      // 2023-12-25
      const dateStr = '2023-12-25'
      const slots = generateDailySlots(dateStr)

      expect(slots.length).toBeGreaterThan(0)

      // Validation: All slots must be valid
      slots.forEach(ts => {
        expect(isValidSlot(ts)).toBe(true)
        // Check date part preserves 2023-12-25
        expect(dayjs(ts).format('YYYY-MM-DD')).toBe(dateStr)
      })
    })

    it('should exclude break times (12:30, 18:30)', () => {
      const slots = generateDailySlots('2023-12-25')
      const hours = slots.map(ts => dayjs(ts).hour())

      expect(hours).not.toContain(12)
      expect(hours).not.toContain(18)
    })

    it('should include start and end boundaries (10:30, 20:30)', () => {
      const slots = generateDailySlots('2023-12-25')
      const hours = slots.map(ts => dayjs(ts).hour())

      expect(hours).toContain(10)
      expect(hours).toContain(20)
    })
  })

  describe('isValidSlot', () => {
    const base = dayjs('2023-12-25').startOf('day')

    it('should return true for valid slots', () => {
      // 10:30
      expect(isValidSlot(base.hour(10).minute(30).valueOf())).toBe(true)
      // 11:30
      expect(isValidSlot(base.hour(11).minute(30).valueOf())).toBe(true)
      // 20:30
      expect(isValidSlot(base.hour(20).minute(30).valueOf())).toBe(true)
    })

    it('should return false for invalid minutes', () => {
      // 10:00
      expect(isValidSlot(base.hour(10).minute(0).valueOf())).toBe(false)
      // 10:31
      expect(isValidSlot(base.hour(10).minute(31).valueOf())).toBe(false)
    })

    it('should return false for break times', () => {
      // 12:30
      expect(isValidSlot(base.hour(12).minute(30).valueOf())).toBe(false)
      // 18:30
      expect(isValidSlot(base.hour(18).minute(30).valueOf())).toBe(false)
    })

    it('should return false for out of bounds hours', () => {
      // 09:30
      expect(isValidSlot(base.hour(9).minute(30).valueOf())).toBe(false)
      // 21:30
      expect(isValidSlot(base.hour(21).minute(30).valueOf())).toBe(false)
    })
  })
})
