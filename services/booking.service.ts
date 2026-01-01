import {
  getFirestore, doc, runTransaction,
  Timestamp, collection, query, where, getDocs, writeBatch, deleteDoc, setDoc
} from 'firebase/firestore'
import dayjs from 'dayjs'

// --- 介面定義 ---

export interface UserProfile {
  uid: string
  displayName: string
  phoneNumber: string
  lineId: string
  role: 'user' | 'admin'
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
  services: string[] // Added: Multiple services support
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

// --- 服務實作 ---

export class BookingService {
  private get db() {
    return getFirestore()
  }

  /**
   * 使用 Transaction 建立新預約
   * - 強制執行：檢查時段是否可用、使用者是否被封鎖、是否已有作用中的預約
   */
  async createBooking(user: UserProfile, timeSlot: number, services: string[], dbInstance?: any) {
    const db = dbInstance || this.db
    const slotId = String(timeSlot)
    const publicSlotRef = doc(db, 'public_slots', slotId)
    const userRef = doc(db, 'users', user.uid)

    // 預約的自動生成 ID
    const bookingRef = doc(collection(db, 'bookings'))

    try {
      await runTransaction(this.db, async (transaction) => {
        // 1. 檢查時段是否已被佔用（資料唯一來源）
        const publicSlotDoc = await transaction.get(publicSlotRef)
        if (publicSlotDoc.exists()) {
          throw new Error('此時段已被預約。')
        }

        // 2. 檢查使用者狀態（即時讀取）
        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists()) {
          throw new Error('找不到使用者個人資料。')
        }
        const userData = userDoc.data() as UserProfile

        if (userData.isBlocked && userData.role !== 'admin') {
          throw new Error('您已被封鎖，無法進行預約。')
        }
        // 強制每人僅能有一個作用中的預約（包含管理員）
        if (userData.activeBookingTimeSlot != null) {
          throw new Error('您已有一個尚未進行的預約。')
        }

        // 3. 準備資料

        const now = Timestamp.now()
        const bookingData: Booking = {
          timeSlot,
          status: 'booked',
          userId: user.uid,
          services: services || [], // Included: Multiple services
          userSnapshot: {
            displayName: user.displayName,
            phone: user.phoneNumber,
            lineId: user.lineId
          },
          createdAt: now,
          updatedAt: now
        }

        // 4. 寫入操作

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
      console.error('預約失敗：', e)
      throw e
    }
  }

  /**
   * 取消預約（用戶端操作）
   * - 強制執行：時間限制 (4小時)、每月限制 (1次)
   */
  async cancelBooking(userId: string, bookingId: string, timeSlot: number) {
    const bookingRef = doc(this.db, 'bookings', bookingId)
    const publicSlotRef = doc(this.db, 'public_slots', String(timeSlot))
    const userRef = doc(this.db, 'users', userId)

    try {
      await runTransaction(this.db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef)
        if (!bookingDoc.exists()) throw new Error('找不到預約記錄。')

        const booking = bookingDoc.data() as Booking

        // 1. 驗證權限與狀態
        if (booking.userId !== userId) throw new Error('權限不足。')
        if (booking.status !== 'booked') throw new Error('預約並非作用中狀態。')

        // 2. 驗證時間限制（伺服器時間）
        // 註：Firestore Timestamp 比較
        const now = Timestamp.now()
        const slotTime = booking.timeSlot
        // 4 小時（毫秒）
        const diff = slotTime - now.toMillis()
        if (diff < 4 * 60 * 60 * 1000) {
          throw new Error('預約前 4 小時內不可取消。')
        }

        // 3. 驗證每月限制
        const userDoc = await transaction.get(userRef)
        const userData = userDoc.data() as UserProfile
        const currentMonthKey = dayjs(now.toMillis()).format('YYYY_MM')

        const monthlyCounts = userData.monthlyCancellations || {}
        const currentCount = monthlyCounts[currentMonthKey] || 0

        if (currentCount >= 1) {
          throw new Error('已超過每月取消上限（每月 1 次）。')
        }

        // 4. 寫入操作

        transaction.update(bookingRef, {
          status: 'cancelled',
          canceledAt: now,
          canceledBy: 'user',
          updatedAt: now
        })

        transaction.delete(publicSlotRef)

        // 更新使用者：清除指針、增加取消次數
        transaction.update(userRef, {
          activeBookingTimeSlot: null,
          [`monthlyCancellations.${currentMonthKey}`]: currentCount + 1
        })
      })
    } catch (e: any) {
      console.error('取消失敗：', e)
      throw e
    }
  }

  /**
   * 管理員刪除預約
   * - 無任何懲罰限制
   */
  async adminDeleteBooking(bookingId: string, timeSlot: number, userId: string) {
    const bookingRef = doc(this.db, 'bookings', bookingId)
    const publicSlotRef = doc(this.db, 'public_slots', String(timeSlot))
    const userRef = doc(this.db, 'users', userId)

    try {
      await runTransaction(this.db, async (transaction) => {
        // 直接執行刪除邏輯，不檢查限制

        const now = Timestamp.now()
        transaction.update(bookingRef, {
          status: 'cancelled',
          canceledAt: now,
          canceledBy: 'admin',
          updatedAt: now
        })

        // 確保公用時段被移除
        transaction.delete(publicSlotRef)

        // 清除使用者指針，但 不要 增加取消計數
        transaction.update(userRef, {
          activeBookingTimeSlot: null
        })
      })
    } catch (e) {
      throw e
    }
  }

  /**
   * 管理員禁用特定時段
   */
  async blockSlot(timeSlot: number) {
    const slotId = String(timeSlot)
    const publicSlotRef = doc(this.db, 'public_slots', slotId)
    await setDoc(publicSlotRef, {
      lockedAt: Timestamp.now(),
      isBlocked: true // Optional flag to distinguish from regular bookings if needed
    })
  }

  /**
   * 管理員解除禁用特定時段
   */
  async unblockSlot(timeSlot: number) {
    const slotId = String(timeSlot)
    const publicSlotRef = doc(this.db, 'public_slots', slotId)
    await deleteDoc(publicSlotRef)
  }

  /**
   * 檢查某些時段是否已有預約
   */
  async hasBookingsInSlots(timeSlots: number[]): Promise<boolean> {
    if (timeSlots.length === 0) return false
    const q = query(
      collection(this.db, 'bookings'),
      where('timeSlot', 'in', timeSlots),
      where('status', '==', 'booked')
    )
    const snap = await getDocs(q)
    return !snap.empty
  }

  /**
   * 管理員禁用整天
   */
  async blockDay(timeSlots: number[]) {
    const batch = writeBatch(this.db)
    const now = Timestamp.now()

    timeSlots.forEach(ts => {
      const ref = doc(this.db, 'public_slots', String(ts))
      batch.set(ref, { lockedAt: now, isBlocked: true })
    })

    await batch.commit()
  }

  /**
   * 管理員解除整天禁用
   * 註：這只會刪除 public_slots，如果其中有真實預約，也會被解除（通常 UI 會先擋掉）
   */
  async unblockDay(timeSlots: number[]) {
    const batch = writeBatch(this.db)

    timeSlots.forEach(ts => {
      const ref = doc(this.db, 'public_slots', String(ts))
      batch.delete(ref)
    })

    await batch.commit()
  }
}

export const bookingService = new BookingService()
