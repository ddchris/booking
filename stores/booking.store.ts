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
    contactInfo?: { name: string, phone: string, lineId: string },
    saveAsDefault: boolean = false
  ) => {
    // 1. Check Authentication
    if (!authStore.user) {
      error.value = '請先登入'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // 2. Ensure Profile Exists or Update it
      // If we provided contact info, we should use it to ensure profile is up to date or created.
      if (contactInfo) {
        const { $db } = useNuxtApp()
        const { doc, setDoc, updateDoc } = await import('firebase/firestore') // Dynamic import to be safe or use what's available? 
        // We can assume imports are available or use useNuxtApp helpers if setup.
        // But store files usually import from 'firebase/firestore' directly at top.
        // Let's assume standard imports are okay.

        const userRef = doc($db, 'users', authStore.user.uid)

        if (!authStore.userProfile) {
          // Create new Profile locally and in DB
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

          // Save to Firestore
          await setDoc(userRef, newProfile)
          // Profile subscription in auth store should pick this up, but for immediate reference:
          // We can't easily write to authStore.profile (it's readonly or ref?). 
          // authStore.profile is a ref, we can technically write to it if exposed, but better to wait or pass 'newProfile' explicitly.
          // However, authStore.profile is read-only via getters usually? No, it's a ref returned from setup.
          // But strict stores might block it. The auth store returns { profile, ... }. It is mutable.
          // Let's force update it to ensure next line works.
          authStore.profile = newProfile as any

        } else if (saveAsDefault) {
          // Update existing profile
          await updateDoc(userRef, {
            displayName: contactInfo.name,
            phoneNumber: contactInfo.phone,
            lineId: contactInfo.lineId
          })
          // Optimistic update
          authStore.profile.displayName = contactInfo.name
          authStore.profile.phoneNumber = contactInfo.phone
          authStore.profile.lineId = contactInfo.lineId
        } else {
          // User didn't ask to save default, but we need to pass the current info to the Service
          // if we want the Booking to reflect "Chris" instead of old name.
          // bookingService.createBooking takes userProfile and copies fields.
          // If we don't update profile, service uses old profile data.
          // To fix this without saving to DB, we can create a "Temporary Profile Object" to pass to service.
          // We just override the fields in a copy.
        }
      }

      // 3. Prepare Profile for Service
      // If we just created it, authStore.userProfile should be set (or we use a fallback).
      let profileToUse = authStore.userProfile

      if (!profileToUse && contactInfo) {
        // Fallback if authStore didn't update yet (race condition)
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
        // Use provided info for this booking ONLY, without saving to DB
        profileToUse = {
          ...profileToUse,
          displayName: contactInfo.name,
          phoneNumber: contactInfo.phone,
          lineId: contactInfo.lineId
        }
      }

      if (!profileToUse) {
        error.value = 'User profile not loaded'
        return false
      }

      const { $db } = useNuxtApp()
      await bookingService.createBooking(profileToUse, timeSlot, $db)
      return true
    } catch (e: any) {
      error.value = e.message || 'Booking failed'
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
      error.value = e.message || 'Cancellation failed'
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
    clearError
  }
})
