<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">管理員預約總覽</h1>
      <NuxtLink to="/admin/customers" class="text-sm text-amber-500 hover:text-amber-400">
        查看客戶清單 →
      </NuxtLink>
    </div>

    <!-- Booking List -->
    <div class="space-y-4">
      <div v-for="b in bookings" :key="b.id" class="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
             <div class="text-amber-500 font-bold font-mono">
               {{ formatDate(b.timeSlot) }} {{ formatTime(b.timeSlot) }}
             </div>
             
             <!-- Customer Info -->
             <div class="text-white font-medium">
               {{ b.userSnapshot?.displayName || '未知' }}
             </div>
             <div class="text-sm text-gray-400">
               {{ b.userSnapshot?.phone || '--' }} | LINE: {{ b.userSnapshot?.lineId || '--' }}
             </div>
          </div>
          
          <div class="text-right space-y-2">
             <div class="px-2 py-1 rounded text-xs inline-block" :class="getStatusClass(b)">
               {{ getStatusLabel(b) }}
             </div>
             
             <div v-if="b.status === 'booked'" class="block">
                <button 
                  @click="deleteBooking(b)"
                  class="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded"
                >
                  刪除預約
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, getFirestore } from 'firebase/firestore'
import dayjs from 'dayjs'
import { bookingService } from '~/services/booking.service'

definePageMeta({
  middleware: ['auth'] // Should check admin here or inside logic
})

const { $db } = useNuxtApp()
const auth = useAuthStore()

// Admin Check
onMounted(() => {
  if (auth.isAuthenticated && !auth.isAdmin) {
    navigateTo('/')
  }
})

const bookings = ref<any[]>([])

// Real-time listener for ALL booking history?
// Or maybe just future? "可看到所有時段預約者" - usually means all.
// But keeping it performant: maybe limit to recent?
// For phase 1: Limit to 100 recent or just all (system is new).
// Let's order by timeSlot desc.
const q = query(collection($db, 'bookings'), orderBy('timeSlot', 'desc'))

onMounted(() => {
  onSnapshot(q, (snap) => {
    bookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

const formatDate = (ts: number) => dayjs(ts).format('YYYY/MM/DD')
const formatTime = (ts: number) => dayjs(ts).format('HH:mm')

const getStatusClass = (b: any) => {
  if (b.status === 'cancelled') return 'bg-red-500/10 text-red-500'
  if (dayjs(b.timeSlot).isBefore(dayjs())) return 'bg-gray-700 text-gray-400'
  return 'bg-green-500/10 text-green-500'
}

const getStatusLabel = (b: any) => {
  if (b.status === 'cancelled') return '已取消'
  if (dayjs(b.timeSlot).isBefore(dayjs())) return '已完成'
  return '已預約'
}

const deleteBooking = async (b: any) => {
  if (!confirm(`確定要刪除 ${b.userSnapshot?.displayName} 的預約嗎？\n(此操作不會計入客戶取消次數)`)) return
  
  try {
    await bookingService.adminDeleteBooking(b.id, b.timeSlot, b.userId)
    alert('已刪除')
  } catch (e: any) {
    alert(e.message || '刪除失敗')
  }
}
</script>
