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

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('useNuxtApp', () => ({ $auth: mockAuth, $db: mockDb }))
    store = useAuthStore()
  })

  it('should initialize with loading state', () => {
    expect(store.loading).toBe(true)
    expect(store.user).toBeNull()
  })

  it('should update state on auth change', async () => {
    const mockUser = { uid: '123', displayName: 'Test' }

    // Simulate auth init call
    const initPromise = store.initAuth()

    // Simulate callback execution
    mockOnAuthStateChanged(mockUser)

    await initPromise

    expect(store.user).toEqual(mockUser)
    expect(store.loading).toBe(false)
  })

  it('subscribeToProfile should fetch user data', async () => {
    const mockUser = { uid: '123' }
    const mockProfile = { uid: '123', role: 'admin', isBlocked: false }

    store.initAuth()

    mockOnAuthStateChanged(mockUser)

    // onSnapshot callback
    mockOnSnapshot({
      exists: () => true,
      data: () => mockProfile
    })

    expect(store.profile).toEqual(mockProfile)
    expect(store.isAdmin).toBe(true)
  })

  it('login should trigger popup and create profile if missing', async () => {
    const mockUser = { uid: 'new', displayName: 'New' }
    mockSignInWithPopup.mockResolvedValue({ user: mockUser })
    mockGetDoc.mockResolvedValue({ exists: () => false }) // Profile missing

    await store.login()

    expect(mockSignInWithPopup).toHaveBeenCalled()
    expect(mockSetDoc).toHaveBeenCalled() // Created default profile
  })

  it('logout should clear state', async () => {
    await store.logout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
  })
})
