import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import { bookingService } from '~/services/booking.service'
import { useAuthStore } from './auth.store'

export const useBookingStore = defineStore('booking', () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  // Actions
  const createBooking = async (
    timeSlot: number,
    services: string[], // Added
    contactInfo?: { name: string, phone: string, lineId: string },
    saveAsDefault: boolean = false
  ) => {
    // 1. 驗證身分
    if (!authStore.user) {
      error.value = '請先登入'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // 2. 確保個人資料存在或更新它
      // 如果提供了聯絡資訊，我們應該使用它來確保個人資料是最新的或已建立。
      if (contactInfo) {
        const { $db } = useNuxtApp()
        const { doc, setDoc, updateDoc } = await import('firebase/firestore') // Dynamic import to be safe or use what's available? 
        // 我們可以假設導入已可用，或者使用 useNuxtApp 輔助函數。
        // 但 Store 檔案通常會在頂部直接從 'firebase/firestore' 導入。
        // 我們假設標準導入是沒問題的。

        const userRef = doc($db, 'users', authStore.user.uid)

        if (!authStore.userProfile) {
          // 在本地與資料庫建立新的個人資料
          const newProfile = {
            uid: authStore.user.uid,
            displayName: contactInfo.name || authStore.user.displayName || 'User',
            phoneNumber: contactInfo.phone,
            lineId: contactInfo.lineId,
            isBlocked: false,
            role: 'user',
            activeBookingTimeSlot: null,
            monthlyCancellations: {} as any,
            totalBookings: 0,
            firstBookingAt: null,
            lastBookingAt: null
          }

          // 儲存至 Firestore
          await setDoc(userRef, newProfile)
          // Auth Store 中的個人資料訂閱應該會捕捉到這一點，但為了立即引用：
          // 我們可以直接強制更新 authStore.profile。
          authStore.profile = newProfile as any

        } else if (saveAsDefault) {
          // 更新現有的個人資料
          await updateDoc(userRef, {
            displayName: contactInfo.name,
            phoneNumber: contactInfo.phone,
            lineId: contactInfo.lineId
          })
          // 樂觀更新 (Optimistic update)
          if (authStore.profile) {
            authStore.profile.displayName = contactInfo.name
            authStore.profile.phoneNumber = contactInfo.phone
            authStore.profile.lineId = contactInfo.lineId
          }

        } else {
          // 用戶沒有要求儲存預設值，但我們仍需將當前資訊傳遞給 Service
          // 以確保預約內容反映的是「Chris」而不是舊名稱。
        }
      }

      // 3. 為 Service 準備個人資料
      // 如果剛剛建立了，authStore.userProfile 應該已設置（或我們使用備案）。
      let profileToUse = authStore.userProfile

      if (!profileToUse && contactInfo) {
        // 備案：如果 authStore 尚未更新（競爭條件）
        profileToUse = {
          uid: authStore.user.uid,
          displayName: contactInfo.name,
          phoneNumber: contactInfo.phone,
          lineId: contactInfo.lineId,
          role: 'user',
          // defaults...
          isBlocked: false,
          activeBookingTimeSlot: null,
          monthlyCancellations: {},
          totalBookings: 0,
          totalCancellations: 0,
          firstBookingAt: null,
          lastBookingAt: null
        }
      } else if (profileToUse && contactInfo && !saveAsDefault) {
        // 僅將提供的資訊用於「此筆預約」，不儲存至資料庫
        profileToUse = {
          ...profileToUse,
          displayName: contactInfo.name,
          phoneNumber: contactInfo.phone,
          lineId: contactInfo.lineId
        }
      }

      if (!profileToUse) {
        error.value = '無法載入個人資料'
        return false
      }

      const { $db } = useNuxtApp()
      await bookingService.createBooking(profileToUse, timeSlot, services, $db)
      return true
    } catch (e: any) {
      error.value = e.message || '預約失敗'
      return false
    } finally {
      loading.value = false
    }
  }

  const cancelBooking = async (bookingId: string, timeSlot: number, userId?: string) => {
    if (!authStore.user?.uid) return false

    loading.value = true
    error.value = null

    try {
      const targetUserId = userId || authStore.user.uid

      // 前置檢查 (僅針對一般會員)
      if (!authStore.isAdmin) {
        // 1. 檢查 4 小時限制
        const now = Date.now()
        const diff = timeSlot - now
        if (diff < 4 * 60 * 60 * 1000) {
          throw new Error('距離預約時間不足 4 小時，無法線上取消')
        }

        // 2. 檢查每月取消次數上限
        // 優先從 profile 檢查，如果 profile 還沒載入也應提示
        const profile = authStore.userProfile
        if (profile) {
          const currentMonthKey = dayjs(now).format('YYYY_MM')
          const monthlyCounts = profile.monthlyCancellations || {}
          const currentCount = monthlyCounts[currentMonthKey] || 0

          if (currentCount >= 1) {
            throw new Error('本月自行取消預約次數已達上限 (1次)，請聯繫店長處理')
          }
        }
      }

      // 如果是管理員，使用管理員刪除邏輯來避開規則限制與權限問題
      if (authStore.isAdmin) {
        await bookingService.adminDeleteBooking(bookingId, timeSlot, targetUserId)
      } else {
        await bookingService.cancelBooking(targetUserId, bookingId, timeSlot)
      }
      return true
    } catch (e: any) {
      let msg = e.message || '取消失敗'

      // 針對 Firebase 權限錯誤進行智慧判斷
      if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
        // 如果是管理員，那就是真的權限設定有問題
        if (authStore.isAdmin) {
          msg = '管理員權限設定不足，請檢查資料庫規則'
        } else {
          // 一般用戶：如果是權限不足，既然通過了本地 4 小時檢查（或本地檢查沒擋住），
          // 且到了後端被規則擋下，極大可能是「每月次數上限」或「4小時限制」（伺服器時間判定）
          const now = Date.now()
          const diff = timeSlot - now

          // 再次確認時間 (伺服器可能認定不足 4 小時)
          if (diff < 4 * 60 * 60 * 1000) {
            msg = '距離預約時間不足 4 小時，無法線上取消'
          } else {
            // 時間充裕卻被擋 -> 肯定是次數上限
            msg = '本月自行取消預約次數已達上限 (1次)，請聯繫店長處理'
          }
        }
      }

      error.value = msg
      return false
    } finally {
      loading.value = false
    }
  }

  // Admin Actions
  const blockSlot = async (timeSlot: number, note?: string) => {
    loading.value = true
    try {
      await bookingService.blockSlot(timeSlot, note)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  const unblockSlot = async (timeSlot: number) => {
    loading.value = true
    try {
      await bookingService.unblockSlot(timeSlot)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  const blockDay = async (timeSlots: number[], note?: string) => {
    loading.value = true
    try {
      const hasBookings = await bookingService.hasBookingsInSlots(timeSlots)
      if (hasBookings) {
        throw new Error('請先刪除該欄所有預約再進行操作')
      }
      await bookingService.blockDay(timeSlots, note)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  const unblockDay = async (timeSlots: number[]) => {
    loading.value = true
    try {
      await bookingService.unblockDay(timeSlots)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    loading,
    error,
    createBooking,
    cancelBooking,
    blockSlot,
    unblockSlot,
    blockDay,
    unblockDay,
    clearError
  }
})
