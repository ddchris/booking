import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BookingService } from './booking.service'
import { Timestamp } from 'firebase/firestore'

// Mock Firebase
const mockTransaction = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

const mockRunTransaction = vi.fn((db, callback) => callback(mockTransaction))
const mockDoc = vi.fn((db, col, id) => ({ path: `${col}/${id}` }))
const mockCollection = vi.fn()

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: (db, col, id) => mockDoc(db, col, id),
  collection: (db, col) => mockCollection(),
  runTransaction: (db, cb) => mockRunTransaction(db, cb),
  Timestamp: {
    now: () => ({ toMillis: () => 1700000000000 }) // Fixed time for test
  }
}))

describe('BookingService', () => {
  let service: BookingService

  beforeEach(() => {
    service = new BookingService()
    vi.clearAllMocks()
  })

  describe('建立預約 (createBooking)', () => {
    it('當時段空閒時，應成功建立預約', async () => {
      // 設定
      const timeSlot = 1703668200000
      const user = {
        uid: 'user1', displayName: 'Test', isBlocked: false, activeBookingTimeSlot: null
      } as any

      // 模擬交易取得結果
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path.includes('public_slots')) {
          // 時段不存在 (空閒)
          return { exists: () => false }
        }
        if (ref.path.includes('users')) {
          return { exists: () => true, data: () => user }
        }
        return { exists: () => true }
      })

      await service.createBooking(user, timeSlot, [])

      // 驗證寫入操作
      expect(mockTransaction.set).toHaveBeenCalledTimes(2) // 預約 + public_slots
      expect(mockTransaction.update).toHaveBeenCalledTimes(1) // 用戶

      // 驗證用戶更新 (activeBookingTimeSlot 已設定)
      const userUpdateCall = mockTransaction.update.mock.calls[0]
      expect(userUpdateCall[1].activeBookingTimeSlot).toBe(timeSlot)
    })

    it('如果時段已被佔用，應拋出錯誤', async () => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path.includes('public_slots')) {
          // 時段存在 (已被佔用)
          return { exists: () => true }
        }
        return { exists: () => true }
      })

      const user = { uid: 'user1', isBlocked: false, activeBookingTimeSlot: null } as any
      await expect(service.createBooking(user, 123, [])).rejects.toThrow('already been booked')
    })

    it('如果用戶被封鎖，應拋出錯誤', async () => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path.includes('public_slots')) return { exists: () => false }
        if (ref.path.includes('users')) return { exists: () => true, data: () => ({ isBlocked: true }) }
        return { exists: () => false }
      })
      await expect(service.createBooking({ uid: 'u1' } as any, 123, [])).rejects.toThrow('blocked')
    })

    it('should throw error if user has active booking', async () => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path.includes('public_slots')) return { exists: () => false }
        if (ref.path.includes('users')) return { exists: () => true, data: () => ({ activeBookingTimeSlot: 999 }) }
        return { exists: () => false }
      })
      await expect(service.createBooking({ uid: 'u1' } as any, 123, [])).rejects.toThrow('active future booking')
    })
  })

  describe('cancelBooking', () => {
    it('should cancel booking if limits valid', async () => {
      // Current Mock Time: 1700000000000
      // Valid Slot: Time + 5 hours (Limit is 4 hours)
      const slotTime = 1700000000000 + (5 * 60 * 60 * 1000)

      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path.includes('bookings')) {
          return {
            exists: () => true,
            data: () => ({ userId: 'user1', status: 'booked', timeSlot: slotTime })
          }
        }
        if (ref.path.includes('users')) {
          return {
            exists: () => true,
            data: () => ({ monthlyCancellations: {} })
          }
        }
        return { exists: () => true }
      })

      await service.cancelBooking('user1', 'b1', slotTime)

      expect(mockTransaction.update).toHaveBeenCalledTimes(2) // booking + user matches
      expect(mockTransaction.delete).toHaveBeenCalledTimes(1)
    })
  })
})
