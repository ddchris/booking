import {
  getFirestore, doc, runTransaction,
  Timestamp, collection, query, where, getDocs
} from 'firebase/firestore'
import dayjs from 'dayjs'

// --- Interfaces ---
export interface UserProfile {
  uid: string
  displayName: string
  phoneNumber: string
  lineId: string
  isBlocked: boolean
  activeBookingTimeSlot: number | null
  monthlyCancellations: Record<string, number> // 'YYYY_MM' -> count
  totalBookings: number
  lastBookingAt: Timestamp | null
  firstBookingAt: Timestamp | null
}

export interface Booking {
  timeSlot: number
  status: 'booked' | 'cancelled'
  userId: string
  userSnapshot: {
    displayName: string
    phone: string
    lineId: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  canceledAt?: Timestamp
  canceledBy?: 'user' | 'admin'
}

// --- Service ---
export class BookingService {
  private get db() {
    return getFirestore()
  }

  /**
   * Create a new booking with Transaction
   * - Enforces: public_slots existence, blocked status, single active booking
   */
  async createBooking(user: UserProfile, timeSlot: number, dbInstance?: any) {
    const db = dbInstance || this.db
    const slotId = String(timeSlot)
    const publicSlotRef = doc(db, 'public_slots', slotId)
    const userRef = doc(db, 'users', user.uid)

    // Auto-generated ID for booking
    const bookingRef = doc(collection(db, 'bookings'))

    try {
      await runTransaction(this.db, async (transaction) => {
        // 1. Check if public_slots occupied (Source of Truth)
        const publicSlotDoc = await transaction.get(publicSlotRef)
        if (publicSlotDoc.exists()) {
          throw new Error('This time slot has already been booked.')
        }

        // 2. Check User status (Fresh read)
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists()) {
          throw new Error('User profile not found.')
        }
        const userData = userDoc.data() as UserProfile

        if (userData.isBlocked) {
          throw new Error('You are blocked from making bookings.')
        }
        if (userData.activeBookingTimeSlot != null) {
          throw new Error('You already have an active future booking.')
        }

        // 3. Prepare Data
        const now = Timestamp.now()
        const bookingData: Booking = {
          timeSlot,
          status: 'booked',
          userId: user.uid,
          userSnapshot: {
            displayName: user.displayName,
            phone: user.phoneNumber,
            lineId: user.lineId
          },
          createdAt: now,
          updatedAt: now
        }

        // 4. Writes
        transaction.set(bookingRef, bookingData)
        transaction.set(publicSlotRef, { lockedAt: now })

        transaction.update(userRef, {
          activeBookingTimeSlot: timeSlot,
          totalBookings: (userData.totalBookings || 0) + 1,
          lastBookingAt: now,
          // Set firstBookingAt if missing
          ...(userData.firstBookingAt ? {} : { firstBookingAt: now })
          // Note: We might also want to ensure basic info is synced if changed, 
          // but for now relying on Auth Store to keep profile updated.
        })
      })

      return bookingRef.id
    } catch (e: any) {
      console.error('Booking failed:', e)
      throw e
    }
  }

  /**
   * Cancel a booking (User action)
   * - Enforces: Time limit (2h), Monthly limit (1)
   */
  async cancelBooking(userId: string, bookingId: string, timeSlot: number) {
    const bookingRef = doc(this.db, 'bookings', bookingId)
    const publicSlotRef = doc(this.db, 'public_slots', String(timeSlot))
    const userRef = doc(this.db, 'users', userId)

    try {
      await runTransaction(this.db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef)
        if (!bookingDoc.exists()) throw new Error('Booking not found.')

        const booking = bookingDoc.data() as Booking

        // 1. Validate Ownership & Status
        if (booking.userId !== userId) throw new Error('Unauthorized.')
        if (booking.status !== 'booked') throw new Error('Booking is not active.')

        // 2. Validate Time Limit (server time)
        // Note: Firestore Timestamp comparisons
        const now = Timestamp.now()
        const slotTime = booking.timeSlot
        // 2 hours in ms
        const diff = slotTime - now.toMillis()
        if (diff < 2 * 60 * 60 * 1000) {
          throw new Error('Cannot cancel within 2 hours of appointment.')
        }

        // 3. Validate Monthly Limit
        const userDoc = await transaction.get(userRef)
        const userData = userDoc.data() as UserProfile
        const currentMonthKey = dayjs(now.toMillis()).format('YYYY_MM')

        const monthlyCounts = userData.monthlyCancellations || {}
        const currentCount = monthlyCounts[currentMonthKey] || 0

        if (currentCount >= 1) {
          throw new Error('Monthly cancellation limit exceeded (1 per month).')
        }

        // 4. Writes
        transaction.update(bookingRef, {
          status: 'cancelled',
          canceledAt: now,
          canceledBy: 'user',
          updatedAt: now
        })

        transaction.delete(publicSlotRef)

        // Update User: clear pointer, increment cancel count
        transaction.update(userRef, {
          activeBookingTimeSlot: null,
          [`monthlyCancellations.${currentMonthKey}`]: currentCount + 1
        })
      })
    } catch (e: any) {
      console.error('Cancellation failed:', e)
      throw e
    }
  }

  /**
   * Admin Delete Booking
   * - No penalties
   */
  async adminDeleteBooking(bookingId: string, timeSlot: number, userId: string) {
    const bookingRef = doc(this.db, 'bookings', bookingId)
    const publicSlotRef = doc(this.db, 'public_slots', String(timeSlot))
    const userRef = doc(this.db, 'users', userId)

    try {
      await runTransaction(this.db, async (transaction) => {
        // Just execute delete logic without limit checks

        const now = Timestamp.now()
        transaction.update(bookingRef, {
          status: 'cancelled',
          canceledAt: now,
          canceledBy: 'admin',
          updatedAt: now
        })

        // Ensure public slot is removed
        transaction.delete(publicSlotRef)

        // Clear user pointer, BUT DO NOT increment cancellation count
        transaction.update(userRef, {
          activeBookingTimeSlot: null
        })
      })
    } catch (e) {
      throw e
    }
  }
}

export const bookingService = new BookingService()
