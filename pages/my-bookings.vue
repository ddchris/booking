<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-white pt-2">我的預約</h1>

    <div v-if="loading" class="text-center py-10 text-gray-500">
      載入中...
    </div>

    <div v-else-if="!bookings.length" class="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <p>目前沒有預約記錄</p>
      <NuxtLink to="/" class="inline-block mt-4 text-amber-500 hover:text-amber-400 text-sm">
        去預約 →
      </NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="booking in paginatedBookings" 
        :key="booking.id"
        class="bg-gray-800 rounded-xl p-3 border border-gray-700 relative overflow-hidden flex items-center justify-between gap-4"
      >
        <!-- Center Content (70% width roughly) -->
        <div class="flex-1 flex items-center justify-between w-full max-w-[90%] mx-auto px-2 md:px-4">
            
            <!-- Left: Date info -->
            <div class="flex items-center gap-4">
              <div class="text-lg md:text-xl font-bold text-white font-mono tracking-wide">
                {{ formatDate(booking.timeSlot) }}
              </div>
              <div class="text-sm md:text-base text-gray-400 font-mono">
                {{ formatTime(booking.timeSlot) }}
              </div>
              <!-- Hidden on very small screens or make separate line -->
              <div class="hidden sm:block text-xs text-gray-600">
                (預約於 {{ formatDate(booking.createdAt.toMillis()) }})
              </div>
            </div>

            <!-- Right: Status & Action -->
            <div class="flex items-center gap-4">
               <div class="px-2 py-0.5 rounded text-xs font-medium tracking-wider" :class="getStatusClass(booking)">
                  {{ getStatusLabel(booking) }}
               </div>
               
               <button 
                  v-if="canCancel(booking)"
                  @click="handleCancel(booking)"
                  class="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded transition hover:bg-red-500/10"
                  :disabled="bookingStore.loading"
               >
                  取消
               </button>
            </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-6 p-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 8, 10, 20]"
          layout="total, sizes, prev, pager, next"
          :total="bookings.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'
import { ElMessageBox, ElMessage } from 'element-plus'

definePageMeta({
  middleware: ['auth']
})

const { $db } = useNuxtApp()
const auth = useAuthStore()
const bookingStore = useBookingStore()

interface BookingRecord {
  id: string
  timeSlot: number
  status: 'booked' | 'cancelled'
  createdAt: Timestamp
  userId: string
}

const bookings = ref<BookingRecord[]>([])
const loading = ref(true)

// Pagination State
const currentPage = ref(1)
const pageSize = ref(8)

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return bookings.value.slice(start, end)
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // Reset to first page
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const fetchBookings = async () => {
  if (!auth.user?.uid) {
    // If not authenticated (and middleware passed?), stop loading potential
    loading.value = false
    return
  }
  loading.value = true
  
  try {
    const q = query(
      collection($db, 'bookings'),
      where('userId', '==', auth.user.uid),
      orderBy('timeSlot', 'desc')
    )
    const snap = await getDocs(q)
    bookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) as BookingRecord[]
  } catch (e: any) {
    console.error('Fetch bookings failed:', e)
    // Check for index error specifically
    if (e.code === 'failed-precondition' && e.message.includes('index')) {
      console.warn('NOTE TO DEV: A required Firestore Index is missing. Open the console to click the creation link.')
    }
  } finally {
    loading.value = false
  }
}

// Watch for User Auth to be ready
watch(() => auth.user, (u) => {
  if (u) fetchBookings()
  else loading.value = false 
}, { immediate: true })

// UI Helpers
const formatDate = (ts: number) => dayjs(ts).format('YYYY/MM/DD')
const formatTime = (ts: number) => dayjs(ts).format('HH:mm')

const getStatusClass = (b: BookingRecord) => {
  if (b.status === 'cancelled') return 'bg-red-500/10 text-red-500'
  // Check if past
  if (dayjs(b.timeSlot).isBefore(dayjs())) return 'bg-gray-700/50 text-gray-500 border border-gray-700'
  return 'bg-green-500/10 text-green-500 border border-green-500/20'
}

const getStatusLabel = (b: BookingRecord) => {
  if (b.status === 'cancelled') return '已取消'
  if (dayjs(b.timeSlot).isBefore(dayjs())) return '已過期'
  return '已預約'
}

const canCancel = (b: BookingRecord) => {
  if (b.status !== 'booked') return false
  const now = dayjs()
  const slotDate = dayjs(b.timeSlot)
  
  // Rule: 2 hours difference
  const diffHours = slotDate.diff(now, 'hour', true)
  if (diffHours < 2) return false
  
  // Rule: Month limit check is done in backend/store, checking frontend logic here
  // We can show button but it might fail.
  return true
}

const handleCancel = async (b: BookingRecord) => {
  try {
    await ElMessageBox.confirm(
      '每月僅限自行取消 1 次，確定要取消此預約嗎？',
      '取消預約確認',
      {
        confirmButtonText: '確定取消',
        cancelButtonText: '暫不取消',
        type: 'warning',
        draggable: true,
      }
    )
    
    // User clicked confirm
    const success = await bookingStore.cancelBooking(b.id, b.timeSlot)
    if (success) {
      ElMessage.success('已取消預約')
      fetchBookings() // Refresh list
    } else {
      const errMsg = bookingStore.error || '取消失敗'
      const translatedMsg = errMsg.includes('Monthly cancellation limit') 
        ? '本月已達自行取消次數上限(1次)' 
        : errMsg.includes('2 hours')
        ? '距離預約時間不足2小時，無法線上取消'
        : errMsg
        
      ElMessage.error(translatedMsg)
    }
  } catch (e) {
    // User cancelled the dialog (or error)
    // console.log('Cancellation aborted')
  }
}
</script>
