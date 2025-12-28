<template>
  <div class="h-full flex flex-col select-none font-sans overflow-hidden justify-center bg-gray-900/50">
    <!-- Main Content Wrapper (Constrained on Desktop) -->
    <div class="flex-1 flex flex-col w-full md:max-w-5xl md:mx-auto overflow-hidden justify-center py-0.5 md:py-1">
      
      <!-- Header Controls -->
      <div 
        class="relative flex-none flex items-center justify-between mb-0.5 p-0.5 md:p-1 rounded-xl shadow-lg mx-0 md:mx-2 mt-0"
        style="background-color: var(--el-color-primary-dark-2);"
      >
        <!-- Left: Location (Hidden on Mobile) -->
        <div class="hidden md:flex items-center gap-1 md:gap-2 text-white text-[10px] md:text-sm font-medium px-1 py-0.5 md:px-2 md:py-1 rounded">
          <div class="i-carbon-earth-southeast-asia-filled text-white text-[10px] md:text-base"></div>
          <span class="hidden sm:inline">預約時段</span>
          <span class="sm:hidden text-[9px]">TW</span>
        </div>

        <!-- Center: Date Title -->
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
            class="p-1 text-white rounded-lg transition-all hover:brightness-110 shadow-sm border border-transparent md:mr-2 flex items-center justify-center"
            style="background-color: var(--el-color-success);"
            title="回到本週"
          >
            <!-- Carbon Calendar Icon (SVG) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
              <path d="M26 4h-2V2h-2v2h-8V2h-2v2H8c-1.103 0-2 .897-2 2v20c0 1.103.897 2 2 2h20c1.03 0 2-1.03 2-2V6c0-1.103-.897-2-2-2zm0 22H8V12h18v14zm0-16H8V6h4v2h2V6h8v2h2V6h2v4z"/>
            </svg>
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
              class="p-1 md:p-1 hover:bg-black/10 rounded-r-lg text-white transition-colors flex items-center justify-center"
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
        <div class="flex-1 overflow-x-hidden md:overflow-x-auto overflow-y-hidden no-scrollbar flex flex-col justify-center">
          <div class="h-full flex w-full md:min-w-full divide-x divide-transparent gap-px md:gap-4 px-1">
            
            <!-- Day Column -->
            <div 
              v-for="day in daysInView" 
              :key="day.dateStr" 
              class="flex-1 min-w-[42px] flex flex-col group h-full justify-center"
            >
              <!-- Column Header -->
              <div 
                class="flex-none text-center pb-0.5 flex flex-col items-center transition-colors rounded-t-lg"
                :class="day.isToday ? 'opacity-100' : 'opacity-60 hover:opacity-100'"
              >
                <!-- WeekDay -->
                <span 
                  class="text-[10px] md:text-xs font-medium mb-0.5 tracking-wider uppercase"
                  :class="day.isWeekend ? 'text-red-400' : 'text-gray-400'"
                >
                  {{ day.weekName }}
                </span>

                <!-- Date Number (Circled if Today) -->
                <div 
                  class="mb-1 min-w-[24px] h-4 md:min-w-[28px] md:h-4 px-1 flex items-center justify-center rounded-full text-[11px] md:text-sm transition-all"
                  :class="day.isToday ? 'bg-green-500 text-white font-bold shadow-lg shadow-green-500/30' : 'text-gray-200'"
                >
                   {{ day.dayNum }}
                </div>
              </div>

              <!-- Slots List -->
              <div 
                class="flex-none w-full space-y-4 md:space-y-2 pt-0.5 md:pt-0 flex flex-col items-center" 
                :class="day.isToday ? 'bg-white/[0.02] rounded-lg' : ''"
              >
                <button
                  v-for="slot in day.slots"
                  :key="slot.ts"
                  @click="!slot.isDisabled && handleSlotClick(slot)"
                  :disabled="slot.isDisabled"
                  class="w-full relative py-0.8 md:py-1.3 px-0.5 md:px-2 rounded-md border text-center transition-all duration-200 group/btn shrink-0 flex flex-col items-center justify-center min-h-[32px] md:min-h-0 overflow-hidden"
                  :class="getSlotClass(slot)"
                >
                  <!-- Formatted Time -->
                  <div class="leading-none flex flex-row items-center justify-center w-full gap-[1px] md:gap-1 flex-col md:flex-row">
                     <template v-if="slot.status === 'booked' && slot.status !== 'mine'">
                       <span class="text-[10px] opacity-70">已被</span>
                       <span class="text-[10px] opacity-70">預約</span>
                     </template>
                     <template v-else>
                       <span class="text-[9px] md:text-xs opacity-90">{{ slot.meridiem }}</span>
                       <span class="text-xs md:text-sm font-mono font-bold">{{ slot.timeOnly }}</span>
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
    <div class="py-1 border-t border-gray-800 flex justify-center gap-6 text-[10px] text-gray-500 uppercase tracking-widest flex-none">
       <span class="flex items-center"><span class="w-2 h-2 inline-block bg-gray-700/50 border border-gray-600 mr-2 rounded-full"></span>可預約</span>
       <span class="flex items-center"><span class="w-2 h-2 inline-block bg-amber-600 mr-2 rounded-full"></span>您的預約</span>
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
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { generateDailySlots, formatSlotTime } from '~/utils/timeSlots'

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
  return startOfWeek.value.isBefore(today.add(1, 'day')) // Allow going back to Today, but not past it? Or if Today is start, prevent going back? 
  // User wants "Today leftmost". So we can't go to "Last week". The earliest view is [Today...Today+6].
  // So if startOfWeek is Today (or before?), disable Prev. 
  return startOfWeek.value.isSame(today, 'day') || startOfWeek.value.isBefore(today, 'day')
})

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

      let status: ViewSlot['status'] = 'available'
      if (isMy) status = 'mine'
      else if (isUnavailable) status = 'past' // Treat outside window as 'past' (disabled/grey)
      else if (isLocked) status = 'booked'
      // Double check past time just in case logic changes, but minBookDate covers it
      else if (ts < nowMs) status = 'past'

      // Time Formatting Logic
      const hour = slotTime.hour()
      const meridiem = hour < 12 ? '上午' : '下午'
      const timeOnly = slotTime.format('hh:mm') 
      
      return {
        ts,
        meridiem,
        timeOnly,
        isMyBooking: isMy,
        isDisabled: status !== 'available' && status !== 'mine', 
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
import { ElMessage } from 'element-plus'

const nextWeek = () => anchorDate.value = anchorDate.value.add(1, 'week')
const prevWeek = () => {
  if (isPrevDisabled.value) return
  anchorDate.value = anchorDate.value.subtract(1, 'week')
}
const goToToday = () => anchorDate.value = dayjs()

const handleSlotClick = async (slot: ViewSlot) => {
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
  
  if (auth.isBlocked) { 
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

const handleBookingSuccess = () => {
  ElMessage.success('預約成功！')
  // Ideally refresh data if needed, but onSnapshot handles slots.
  // Profile update logic in store should handle 'myBookingSlot'.
}

// --- Styles ---
const getSlotClass = (slot: ViewSlot) => {
  // My Booking (Highest Priority)
  if (slot.status === 'mine') {
    return 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/50 opacity-100 z-10'
  }
  
  // Past
  if (slot.status === 'past') {
    return 'border-transparent text-gray-700 opacity-30 cursor-not-allowed'
  }
  
  // Booked (By others)
  if (slot.status === 'booked') {
     return 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-60'
  }
  
  // Available
  return 'border-gray-600/50 text-gray-300 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10 cursor-pointer active:scale-95 active:bg-green-500/20'
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
