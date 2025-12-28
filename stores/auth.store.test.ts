import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'

// Mock dependencies
const mockAuth = {}
const mockDb = {}
const mockOnAuthStateChanged = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockSignOut = vi.fn()
const mockOnSnapshot = vi.fn()
const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()

vi.mock('#app', () => ({
  useNuxtApp: () => ({ $auth: mockAuth, $db: mockDb })
}))

vi.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  GoogleAuthProvider: vi.fn(),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (auth, cb) => {
    mockOnAuthStateChanged.mockImplementation(cb)
    return () => { } // unsubscribe
  }
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  onSnapshot: (ref, cb) => {
    mockOnSnapshot.mockImplementation(cb)
    return () => { } // unsubscribe
  }
}))

describe('身分驗證 Store (Auth Store)', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('useNuxtApp', () => ({ $auth: mockAuth, $db: mockDb }))

    // 模擬 localStorage
    const mockStorage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(key => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = value }),
      removeItem: vi.fn(key => { delete mockStorage[key] }),
      clear: vi.fn(() => { for (const key in mockStorage) delete mockStorage[key] })
    })

    store = useAuthStore()
  })

  it('初始化時應具有載入狀態', () => {
    expect(store.loading).toBe(true)
    expect(store.user).toBeNull()
  })

  it('應在身分驗證變更時更新狀態', async () => {
    const mockUser = { uid: '123', displayName: 'Test' }

    // 模擬 auth 初始化調用
    const initPromise = store.initAuth()

    // 模擬回呼執行
    mockOnAuthStateChanged(mockUser)

    await initPromise

    expect(store.user).toEqual(mockUser)
    expect(store.loading).toBe(false)
  })

  it('subscribeToProfile 應獲取使用者資料', async () => {
    const mockUser = { uid: '123' }
    const mockProfile = { uid: '123', role: 'admin', isBlocked: false }

    store.initAuth()

    mockOnAuthStateChanged(mockUser)

    // onSnapshot 回呼
    mockOnSnapshot({
      exists: () => true,
      data: () => mockProfile
    })

    expect(store.profile).toEqual(mockProfile)
    expect(store.isAdmin).toBe(true)
  })

  it('登入應觸發彈出視窗，並在缺少個人資料時建立', async () => {
    const mockUser = { uid: 'new', displayName: 'New' }
    mockSignInWithPopup.mockResolvedValue({ user: mockUser })
    mockGetDoc.mockResolvedValue({ exists: () => false }) // 個人資料缺失

    await store.login()

    expect(mockSignInWithPopup).toHaveBeenCalled()
    expect(mockSetDoc).toHaveBeenCalled() // 已建立預設個人資料
  })

  it('登出應清除狀態', async () => {
    await store.logout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
  })
})
