import { defineStore } from 'pinia'
import { ref } from 'vue'
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

  const cancelBooking = async (bookingId: string, timeSlot: number) => {
    if (!authStore.user?.uid) return false

    loading.value = true
    error.value = null

    try {
      await bookingService.cancelBooking(authStore.user.uid, bookingId, timeSlot)
      return true
    } catch (e: any) {
      error.value = e.message || '取消失敗'
      return false
    } finally {
      loading.value = false
    }
  }

  // Admin Actions
  const blockSlot = async (timeSlot: number) => {
    loading.value = true
    try {
      await bookingService.blockSlot(timeSlot)
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

  const blockDay = async (timeSlots: number[]) => {
    loading.value = true
    try {
      const hasBookings = await bookingService.hasBookingsInSlots(timeSlots)
      if (hasBookings) {
        throw new Error('請先刪除該欄所有預約再進行操作')
      }
      await bookingService.blockDay(timeSlots)
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
