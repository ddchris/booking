import {
  getFirestore, doc, runTransaction,
  Timestamp, collection, query, where, getDocs, writeBatch, deleteDoc, setDoc, increment
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
  totalCancellations: number // Added
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
        // 1. 檢查時段是否已被佔用
        const publicSlotDoc = await transaction.get(publicSlotRef)
        if (publicSlotDoc.exists()) {
          throw new Error('該時段已被預約或禁用。')
        }

        // 2. 檢查使用者狀態 (Reload profile inside transaction to be safe)
        const userDoc = await transaction.get(userRef)
        const userData = userDoc.data() as UserProfile

        if (!userData) {
          throw new Error('找不到使用者資料。')
        }
        if (userData.isBlocked && userData.role !== 'admin') {
          throw new Error('您已被封鎖，無法進行預約。')
        }
        if (userData.activeBookingTimeSlot != null) {
          // 只有當現有預約是在「未來」時才阻擋
          if (userData.activeBookingTimeSlot > Date.now()) {
            throw new Error('您已有一個尚未進行的預約。')
          }
        }

        // 3. 準備資料
        const now = Timestamp.now()
        const newBooking: Booking = {
          timeSlot,
          status: 'booked',
          userId: user.uid,
          services,
          userSnapshot: {
            displayName: user.displayName,
            phone: user.phoneNumber,
            lineId: user.lineId
          },
          createdAt: now,
          updatedAt: now
        }

        // 4. 寫入操作
        transaction.set(bookingRef, newBooking)
        transaction.set(publicSlotRef, { lockedAt: now })

        // 更新使用者：設置活動預約指針、增加總次數、更新最近預約時間
        transaction.update(userRef, {
          activeBookingTimeSlot: timeSlot,
          totalBookings: (userData.totalBookings || 0) + 1,
          lastBookingAt: now,
          firstBookingAt: userData.firstBookingAt || now
        })
      })
    } catch (e: any) {
      console.error('預約失敗：', e)
      throw e
    }
  }

  /**
   * 客戶自行取消預約
   * - 規則：4 小時前、每月限 1 次
   */
  async cancelBooking(userId: string, bookingId: string, timeSlot: number) {
    const bookingRef = doc(this.db, 'bookings', bookingId)
    const publicSlotRef = doc(this.db, 'public_slots', String(timeSlot))
    const userRef = doc(this.db, 'users', userId)

    try {
      await runTransaction(this.db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef)
        if (!bookingDoc.exists()) throw new Error('找不到該預約。')
        const booking = bookingDoc.data() as Booking
        if (booking.status !== 'booked') throw new Error('預約狀態不正確。')

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
          totalCancellations: (userData.totalCancellations || 0) + 1,
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

        // 確保客人的指針也被清除
        transaction.update(userRef, {
          activeBookingTimeSlot: null,
          totalCancellations: increment(1)
        })
      })
    } catch (e) {
      console.error('管理員刪除失敗：', e)
      throw e
    }
  }

  /**
   * 檢查時段是否已有預約
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
   * 管理員禁用特定時段
   */
  async blockSlot(timeSlot: number, note?: string) {
    const slotId = String(timeSlot)
    const publicSlotRef = doc(this.db, 'public_slots', slotId)
    await setDoc(publicSlotRef, {
      lockedAt: Timestamp.now(),
      isBlocked: true,
      note: note || null
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
   * 管理員禁用整天
   */
  async blockDay(timeSlots: number[], note?: string) {
    const batch = writeBatch(this.db)
    const now = Timestamp.now()

    timeSlots.forEach(ts => {
      const ref = doc(this.db, 'public_slots', String(ts))
      batch.set(ref, {
        lockedAt: now,
        isBlocked: true,
        note: note || null
      })
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
