import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  type User
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import type { UserProfile } from '~/services/booking.service'

export const useAuthStore = defineStore('auth', () => {
  const { $auth, $db } = useNuxtApp()

  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)
  let profileUnsub: Unsubscribe | null = null

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isBlocked = computed(() => profile.value?.isBlocked ?? false)
  const userProfile = computed(() => profile.value)

  // Actions
  const initAuth = () => {
    return new Promise<void>((resolve) => {
      onAuthStateChanged($auth, (currentUser) => {
        user.value = currentUser

        if (currentUser) {
          // Subscribe to profile changes (real-time blocked status)
          subscribeToProfile(currentUser.uid)
        } else {
          profile.value = null
          if (profileUnsub) profileUnsub()
        }
        loading.value = false
        resolve()
      })
    })
  }

  const subscribeToProfile = (uid: string) => {
    const ref = doc($db, 'users', uid)
    if (profileUnsub) profileUnsub()

    profileUnsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        profile.value = snap.data() as UserProfile
        // Inject uid if missing in data (though it should be the ID)
        if (profile.value) profile.value.uid = uid
      } else {
        // First login? Create default profile?
        // Usually, we create it here or let UI handle it.
        // For simplicity: We treat missing profile as limited user until created.
        profile.value = null
      }
    })
  }

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup($auth, provider)

      // Check if profile exists, if not create default
      const userRef = doc($db, 'users', result.user.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName || 'User',
          phoneNumber: '', // Needs update
          lineId: '',      // Needs update
          isBlocked: false,
          role: 'user',
          activeBookingTimeSlot: null,
          monthlyCancellations: {},
          totalBookings: 0,
          firstBookingAt: null,
          lastBookingAt: null
        }
        await setDoc(userRef, newProfile)
      }
    } catch (e) {
      console.error('Login failed', e)
      throw e
    }
  }

  const logout = async () => {
    try {
      if (profileUnsub) profileUnsub()
      await signOut($auth)
      user.value = null
      profile.value = null
    } catch (e) {
      console.error('Logout failed', e)
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isBlocked,
    userProfile,
    initAuth,
    login,
    logout
  }
})
