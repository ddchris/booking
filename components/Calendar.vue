<template>
  <div class="h-full flex flex-col select-none font-sans overflow-hidden justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
    <!-- Main Content Wrapper (Constrained on Desktop) -->
    <div class="flex-1 flex flex-col w-full md:max-w-5xl md:mx-auto overflow-hidden justify-center py-0.5 md:py-1">
      
      <!-- Header Controls -->
      <div 
        class="relative flex-none flex items-center justify-between mb-2 p-0.5 md:p-1 rounded-xl shadow-lg mx-0 md:mx-2 mt-0 transition-colors duration-300"
        style="background-color: #0d69c8;"
      >
        <!-- Left: Location (Hidden on Mobile) -->
        <div class="hidden md:flex items-center gap-1 md:gap-2 text-white text-[10px] md:text-sm font-medium px-1 py-0.5 md:px-2 md:py-1 rounded">
          <div class="i-carbon-earth-southeast-asia-filled text-white text-[10px] md:text-base"></div>
          <span class="hidden sm:inline">預約時段</span>
          <span class="sm:hidden text-[9px]">TW</span>
        </div>

        <!-- Center: Date Title -->
        <h2 class="text-base md:text-xl font-bold text-white tracking-widest flex items-center justify-center gap-2 shadow-sm absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex-none pointer-events-none md:pointer-events-auto">
          <span>{{ currentMonthLabel }}</span>
          <span class="text-white/90 font-light text-xs md:text-lg">{{ currentYearLabel }}</span>
        </h2>

        <!-- Right: Navigation -->
        <div class="flex items-center gap-2 ml-auto md:ml-0">
          <!-- Today Button -->
          <button 
            @click="goToToday"
            class="px-3 py-1 text-xs md:text-sm font-medium text-white rounded-lg transition-all hover:brightness-110 shadow-sm border border-transparent md:mr-2 flex items-center justify-center whitespace-nowrap"
            style="background-color: var(--el-color-success);"
            title="回到本週"
          >
            回本週
          </button>
          
          <!-- Week Navigation Group -->
          <div 
            class="flex items-center rounded-lg border border-transparent shadow-sm"
            style="background-color: var(--el-color-success);"
          >
            <!-- Prev Week -->
            <button 
              @click="prevWeek"
              class="p-1 hover:bg-black/10 rounded-l-lg text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
              :disabled="isPrevDisabled"
            >
              <!-- Chevron Left SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M10 16L20 6l1.4 1.4l-8.6 8.6l8.6 8.6L20 26z"/>
              </svg>
            </button>
            
            <div class="w-px h-3.5 md:h-4 bg-white/30 mx-0.5"></div>
            
            <!-- Next Week -->
            <button 
              @click="nextWeek"
              class="p-1 md:p-1 hover:bg-black/10 rounded-r-lg text-white transition-colors flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent"
              :disabled="isNextDisabled"
            >
               <!-- Chevron Right SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M22 16L12 26l-1.4-1.4l8.6-8.6l-8.6-8.6L12 6z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Weekly Grid Container -->
      <div class="flex-1 relative overflow-hidden pl-0 flex flex-col min-h-0">
        
        <!-- Scrollable Area -->
        <div class="flex-1 overflow-x-hidden md:overflow-x-auto overflow-y-auto lg:overflow-y-hidden no-scrollbar flex flex-col justify-start md:justify-center">
          <div class="min-h-full flex w-full md:min-w-full divide-x divide-transparent gap-px md:gap-4 lg:gap-1.5 px-1 pb-8 lg:pb-0">
            
            <!-- Day Column -->
            <div 
              v-for="day in daysInView" 
              :key="day.dateStr" 
              class="flex-1 min-w-[42px] flex flex-col group h-full justify-start pt-1 md:pt-1 lg:pt-2"
            >
              <!-- Column Header -->
              <div 
                class="flex-none text-center pb-0.5 flex flex-col items-center transition-colors rounded-t-lg"
                :class="day.isToday ? 'opacity-100' : 'opacity-60 hover:opacity-100'"
              >
                <!-- WeekDay -->
                <span 
                  class="text-[10px] md:text-xs font-bold mb-0.5 tracking-wider uppercase"
                  :class="day.isWeekend ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-300'"
                >
                  {{ day.weekName }}
                </span>

                <!-- Date Number (Circled if Today) -->
                <div 
                  class="mb-1 min-w-[24px] h-4 md:min-w-[28px] md:h-4 px-1 flex items-center justify-center rounded-full text-[11px] md:text-sm font-bold transition-all"
                  :class="day.isToday ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'text-gray-700 dark:text-gray-400'"
                >
                   {{ day.dayNum }}
                </div>
              </div>

              <!-- Slots List -->
              <div 
                class="flex-1 w-full gap-2 md:gap-4 lg:gap-0.5 pt-1 md:pt-2 pb-2 lg:pb-0 flex flex-col items-center" 
                :class="day.isToday ? 'bg-gray-50 dark:bg-white/[0.02] rounded-lg' : ''"
              >
                <button
                  v-for="slot in day.slots"
                  :key="slot.ts"
                  @click="handleSlotClick(slot)"
                  :disabled="slot.isDisabled && !auth.isAdmin"
                  class="w-full relative flex-1 min-h-[48px] md:min-h-0 lg:min-h-0 lg:h-10 py-1 md:py-3 lg:py-0 px-0.5 md:px-1 rounded-md border text-center transition-all duration-200 group/btn shrink-0 flex flex-col items-center justify-center overflow-hidden shadow-sm"
                  :class="getSlotClass(slot)"
                >
                  <!-- Formatted Time -->
                  <div class="leading-none flex flex-col lg:flex-row items-center lg:items-center justify-center w-full gap-0.5 md:gap-0.5 lg:gap-1">
                     <template v-if="slot.status === 'booked'">
                       <span class="text-sm md:text-xl font-mono font-bold tracking-wider">已被預約</span>
                     </template>
                     <template v-else-if="slot.isNotYetOpen">
                        <span class="text-sm md:text-xl font-mono font-bold tracking-wider">未開放</span>
                     </template>
                     <template v-else>
                       <span class="text-sm md:text-xl font-mono font-bold tracking-wider">{{ slot.timeOnly }}</span>
                     </template>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend (Optional, kept minimal) -->
    <div class="py-1 border-t border-gray-200 dark:border-gray-800 flex justify-center gap-6 text-[10px] text-gray-500 uppercase tracking-widest flex-none">
       <span class="flex items-center"><span class="w-3 h-3 inline-block bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 mr-2 rounded-full"></span>可預約</span>
       <span class="flex items-center"><span class="w-3 h-3 inline-block bg-amber-600 mr-2 rounded-full"></span>您的預約</span>
    </div>

    <!-- Booking Dialog -->
    <BookingDialog 
      v-model="showDialog" 
      :time-slot="selectedSlot" 
      @success="handleBookingSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { collection, query, where, onSnapshot, getDocs, limit } from 'firebase/firestore'
import { generateDailySlots, formatSlotTime } from '~/utils/timeSlots'
import { bookingService } from '~/services/booking.service'

dayjs.extend(isBetween)

const { $db } = useNuxtApp()
const auth = useAuthStore()

// --- State ---
const anchorDate = ref(dayjs()) 
const occupiedSlots = ref<Set<string>>(new Set())
const showDialog = ref(false)
const selectedSlot = ref<number | null>(null)

// --- Computed ---
const myBookingSlot = computed(() => auth.userProfile?.activeBookingTimeSlot)

// Calculate the 7 days to show. Default to anchorDate being the start (Today).
const startOfWeek = computed(() => anchorDate.value)

const currentMonthLabel = computed(() => startOfWeek.value.format('M月'))
const currentYearLabel = computed(() => startOfWeek.value.format('YYYY'))

const isPrevDisabled = computed(() => {
  const today = dayjs().startOf('day')
  return startOfWeek.value.isBefore(today.add(1, 'day'))
})

const isNextDisabled = computed(() => {
  const maxDate = dayjs().add(3, 'months')
  return startOfWeek.value.isAfter(maxDate)
})

interface ViewSlot {
  ts: number
  meridiem: string
  timeOnly: string
  isMyBooking: boolean
  isDisabled: boolean
  isNotYetOpen: boolean
  status: 'available' | 'mine' | 'past' | 'booked'
}

interface ViewDay {
  dateStr: string
  weekName: string
  dayNum: string
  isToday: boolean
  isWeekend: boolean
  slots: ViewSlot[]
}

const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const daysInView = computed<ViewDay[]>(() => {
  const list: ViewDay[] = []
  const nowMs = dayjs().valueOf()
  const todayStr = dayjs().format('YYYY-MM-DD')
  
  // Booking Window Rules: Tomorrow ~ +31 days
  const minBookDate = dayjs().add(1, 'day').startOf('day')
  const maxBookDate = dayjs().add(31, 'day').endOf('day')

  // Generate 7 days
  for (let i = 0; i < 7; i++) {
    const d = startOfWeek.value.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const rawSlots = generateDailySlots(dateStr)
    const dayIndex = d.day()
    
    // Convert slot formatting
    const slots: ViewSlot[] = rawSlots.map(ts => {
      // Slot Logic
      const isMy = !!myBookingSlot.value && (Number(myBookingSlot.value) === Number(ts))
      const isLocked = occupiedSlots.value.has(String(ts))
      
      const slotTime = dayjs(ts)
      const isUnavailable = slotTime.isBefore(minBookDate) || slotTime.isAfter(maxBookDate)
      const isTodaySlot = (dayjs(ts).format('YYYY-MM-DD') === todayStr)
      
      // Check if it's "not yet open" (today's slots OR future time outside booking window)
      const isNotYetOpen = isTodaySlot || (isUnavailable && ts > nowMs)

      let status: ViewSlot['status'] = 'available'
      if (isMy) status = 'mine'
      else if (isUnavailable) status = 'past' // Treat outside window as 'past' (disabled/grey)
      else if (isLocked) status = 'booked'
      // Double check past time just in case logic changes, but minBookDate covers it
      else if (ts < nowMs) status = 'past'

      // Time Formatting Logic
      const hour = slotTime.hour()
      const meridiem = hour < 12 ? '上午' : '下午'
      const timeOnly = slotTime.format('HH:mm') 
      
      return {
        ts,
        meridiem,
        timeOnly,
        isMyBooking: isMy,
        isDisabled: status !== 'available' && status !== 'mine',
        isNotYetOpen,
        status
      }
    })

    list.push({
      dateStr,
      weekName: weekMap[dayIndex],
      dayNum: d.format('M/D'), // '1/3'
      isToday: dateStr === todayStr,
      isWeekend: dayIndex === 0 || dayIndex === 6,
      slots
    })
  }
  return list
})

// --- Firestore Sync ---
let unsub: (() => void) | null = null

watch(startOfWeek, (start) => {
  if (unsub) unsub()
  const qStart = start.subtract(1, 'day').valueOf()
  const qEnd = start.add(8, 'day').valueOf()

  const q = query(
    collection($db, 'public_slots'),
    where('__name__', '>=', String(qStart)),
    where('__name__', '<=', String(qEnd))
  )
  
  unsub = onSnapshot(q, (snap) => {
    const set = new Set<string>()
    snap.forEach(doc => set.add(doc.id))
    occupiedSlots.value = set
  })
}, { immediate: true })

onUnmounted(() => {
  if (unsub) unsub()
})

// --- Actions ---
import { ElMessage, ElMessageBox } from 'element-plus'

const nextWeek = () => anchorDate.value = anchorDate.value.add(1, 'week')
const prevWeek = () => {
  if (isPrevDisabled.value) return
  anchorDate.value = anchorDate.value.subtract(1, 'week')
}
const goToToday = () => anchorDate.value = dayjs()

const handleSlotClick = async (slot: ViewSlot) => {
  // Admin Override: Allow clicking 'booked' slots
  if (auth.isAdmin && slot.status === 'booked') {
     handleAdminSlotClick(slot)
     return
  }

  if (slot.isMyBooking || slot.isDisabled) return
  
  if (!auth.isAuthenticated) { 
    try {
      await auth.login()
      // Re-check authentication after login attempt
       if (!auth.isAuthenticated) return // User cancelled or failed
    } catch (e) {
      return // Login failed
    }
  }
  
  if (auth.isBlocked && !auth.isAdmin) { 
    ElMessage.error('您的帳號權限目前受限，無法進行預約')
    return 
  }
  if (auth.userProfile?.activeBookingTimeSlot) { 
    ElMessage.warning('您已有進行中的預約，請先完成或取消現有預約')
    return 
  }
  
  selectedSlot.value = slot.ts
  showDialog.value = true
}

const handleAdminSlotClick = async (slot: ViewSlot) => {
  try {
    const q = query(collection($db, 'bookings'), where('timeSlot', '==', slot.ts), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) {
      ElMessage.warning('找不到該時段的預約資料 (可能數據不一致)')
      return
    }
    const booking = { id: snap.docs[0].id, ...snap.docs[0].data() } as any
    const user = booking.userSnapshot || {}

    await ElMessageBox.confirm(
      `
        <div class="text-left">
          <p><strong>預約人:</strong> ${user.displayName || '未知'}</p>
          <p><strong>電話:</strong> ${user.phone || '--'}</p>
          <p><strong>LINE:</strong> ${user.lineId || '--'}</p>
          <p class="mt-2 text-sm text-gray-400">確定要強制刪除此預約嗎？</p>
        </div>
      `,
      '預約詳情',
      {
        confirmButtonText: '刪除預約',
        confirmButtonClass: 'el-button--danger',
        cancelButtonText: '關閉',
        dangerouslyUseHTMLString: true,
        customClass: 'dark-dialog',
        type: 'info'
      }
    )

    // Delete
    await bookingService.adminDeleteBooking(booking.id, booking.timeSlot, booking.userId)
    ElMessage.success('已刪除該預約')
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('操作失敗: ' + e.message)
    }
  }
}

const handleBookingSuccess = () => {
  ElMessage.success('預約成功！')
}

// --- Styles ---
const getSlotClass = (slot: ViewSlot) => {
  // My Booking (Highest Priority)
  if (slot.status === 'mine') {
    return 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/50 opacity-100 z-10'
  }
  
  // Past (Disabled)
  if (slot.status === 'past') {
    // Not Open Yet (Future) - Make it visible but distinct from available
      return 'border-gray-200 dark:border-gray-800 text-gray-400/80 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/30 cursor-not-allowed'
  }
  
  // Booked (By others)
  if (slot.status === 'booked') {
     if (auth.isAdmin) {
       return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-amber-600 dark:text-amber-500 cursor-pointer opacity-100 ring-1 ring-amber-500/30 font-medium'
     }
     return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
  }
  
  // Available
  return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 cursor-pointer active:scale-95 active:bg-green-500/20'
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<style>
/* Global styles for dynamic elements attached to body */
.dark-dialog {
  background-color: #1f2937 !important; /* gray-800 */
  border-color: #374151 !important; /* gray-700 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
}
.dark-dialog .el-message-box__title {
  color: #f3f4f6 !important; /* gray-100 */
}
.dark-dialog .el-message-box__content {
  color: #d1d5db !important; /* gray-300 */
}
.dark-dialog .el-message-box__headerbtn .el-message-box__close {
  color: #9ca3af !important; /* gray-400 */
}
.dark-dialog .el-message-box__headerbtn:hover .el-message-box__close {
  color: white !important;
}
/* Cancel Button in Dark Dialog */
.dark-dialog .el-button:not(.el-button--primary):not(.el-button--danger) {
  background-color: transparent !important;
  border-color: #4b5563 !important;
  color: #d1d5db !important;
}
.dark-dialog .el-button:not(.el-button--primary):not(.el-button--danger):hover {
  border-color: #6b7280 !important;
  color: white !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
