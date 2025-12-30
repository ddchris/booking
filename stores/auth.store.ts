import { defineStore } from 'pinia'
import { ref, computed, shallowRef, markRaw } from 'vue'
import {
  signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged,
  type User, signInWithPopup
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import type { UserProfile } from '~/services/booking.service'

export const useAuthStore = defineStore('auth', () => {
  const { $auth, $db } = useNuxtApp()

  const user = shallowRef<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)
  const isInitialized = ref(false)
  let profileUnsub: Unsubscribe | null = null

  const SESSION_KEY = 'focus_auth_session'
  const EXPIRE_TIME = 2 * 60 * 60 * 1000 // 2 hours

  // 輔助函數：獲取本地工作階段

  const getLocalSession = () => {
    if (!import.meta.client) return null
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null
      const data = JSON.parse(stored)
      const now = Date.now()

      // 檢查閒置超時

      if (now - data.lastActive > EXPIRE_TIME) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return data
    } catch {
      return null
    }
  }

  // 輔助函數：儲存本地工作階段

  const saveLocalSession = (userData: any, profileData: any) => {
    if (!import.meta.client) return
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user: userData ? {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL
      } : null,
      profile: profileData,
      lastActive: Date.now()
    }))
  }

  // 輔助函數：清除工作階段

  const clearLocalSession = () => {
    if (!import.meta.client) return
    localStorage.removeItem(SESSION_KEY)
  }

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isBlocked = computed(() => profile.value?.isBlocked ?? false)
  const userProfile = computed(() => profile.value)

  // Actions
  const ensuresUserProfile = async (firebaseUser: User) => {
    const userRef = doc($db, 'users', firebaseUser.uid)
    const snap = await getDoc(userRef)

    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'User',
        phoneNumber: '',
        lineId: '',
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
  }

  let initPromise: Promise<void> | null = null

  const initAuth = () => {
    if (isInitialized.value) return Promise.resolve()
    if (initPromise) return initPromise

    // 在伺服器端，Firebase Auth SDK 無法工作，直接完成初始化並設為訪客
    if (import.meta.server) {
      isInitialized.value = true
      loading.value = false
      return Promise.resolve()
    }


    // 立即從快取中恢復（防止畫面閃爍）
    const cached = getLocalSession()
    if (cached && cached.user) {
      console.log('[AuthStore] 正在從快取預載...')
      user.value = cached.user as User
      profile.value = cached.profile
      loading.value = false // 立即將 loading 設為 false 以顯示 UI
    }

    initPromise = new Promise<void>((resolve) => {
      onAuthStateChanged($auth, (currentUser) => {
        console.log('[AuthStore] Firebase Auth 已驗證：', currentUser?.uid || '訪客')
        // 使用 markRaw 防止 Vue 對 Firebase User 物件進行深層代理
        // 這可以修復 'SecurityError: Blocked a frame...' 問題
        user.value = currentUser ? markRaw(currentUser) : null

        if (currentUser) {
          // 訂閱個人資料變更（即時監控封鎖狀態）
          subscribeToProfile(currentUser.uid)
        } else {
          profile.value = null
          clearLocalSession()
          if (profileUnsub) profileUnsub()
        }

        // 完成初始化
        isInitialized.value = true
        loading.value = false
        resolve()
      })
    })

    return initPromise
  }

  const subscribeToProfile = (uid: string) => {
    const ref = doc($db, 'users', uid)
    if (profileUnsub) profileUnsub()

    profileUnsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile
        profile.value = data
        if (profile.value) profile.value.uid = uid
        console.log('[AuthStore] 個人資料已更新。角色：', data.role, '是否為管理員：', data.role === 'admin')

        // 每次個人資料更新時同步到快取
        saveLocalSession(user.value, profile.value)
      } else {
        profile.value = null
        console.log('[AuthStore] 找不到個人資料')
      }
    })
  }

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider()
      // 恢復使用彈出視窗以避免開發環境中的 CSP 問題
      const result = await signInWithPopup($auth, provider)

      // 登入後確保個人資料存在
      if (result.user) {
        await ensuresUserProfile(result.user)
        // 工作階段將由 subscribeToProfile 儲存
      }
    } catch (e) {
      console.error('登入失敗', e)
      throw e
    }
  }

  const logout = async () => {
    try {
      if (profileUnsub) profileUnsub()
      await signOut($auth)
      user.value = null
      profile.value = null
      clearLocalSession()
    } catch (e) {
      console.error('登出失敗', e)
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isBlocked,
    isInitialized,
    userProfile,
    initAuth,
    login,
    logout
  }
})
