import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBookingStore } from './booking.store'
import { useAuthStore } from './auth.store'
import { bookingService } from '~/services/booking.service'

// Mock dependencies
vi.mock('~/services/booking.service', () => ({
  bookingService: {
    createBooking: vi.fn(),
    cancelBooking: vi.fn()
  }
}))

vi.mock('./auth.store', () => ({
  useAuthStore: vi.fn()
}))

describe('Booking Store', () => {
  let store: ReturnType<typeof useBookingStore>
  const mockAuthStore = {
    user: { uid: 'u1' },
    userProfile: { uid: 'u1', isBlocked: false }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Setup Mock Auth Store
    // @ts-ignore
    useAuthStore.mockReturnValue(mockAuthStore)
    // Mock useNuxtApp for setDoc/updateDoc logic
    vi.stubGlobal('useNuxtApp', () => ({ $db: {} }))
    store = useBookingStore()
  })

  it('createBooking should call service and manage loading state', async () => {
    // Setup Service Success
    // @ts-ignore
    bookingService.createBooking.mockResolvedValue('bookingId')

    const services = ['haircut']
    const promise = store.createBooking(12345, services)
    expect(store.loading).toBe(true) // Loading true during await

    const result = await promise

    expect(store.loading).toBe(false)
    expect(result).toBe(true)
    expect(store.error).toBeNull()
    expect(bookingService.createBooking).toHaveBeenCalledWith(mockAuthStore.userProfile, 12345, services, expect.anything())
  })

  it('createBooking should handle service errors', async () => {
    // Setup Service Fail
    // @ts-ignore
    bookingService.createBooking.mockRejectedValue(new Error('Service Error'))

    const result = await store.createBooking(12345, [])

    expect(result).toBe(false)
    expect(store.error).toBe('Service Error')
    expect(store.loading).toBe(false)
  })

  it('should not book if profile missing', async () => {
    setActivePinia(createPinia())
    // @ts-ignore
    useAuthStore.mockReturnValue({ userProfile: null })
    store = useBookingStore() // Re-init

    const result = await store.createBooking(123, [])
    expect(result).toBe(false)
    expect(bookingService.createBooking).not.toHaveBeenCalled()
  })
})
