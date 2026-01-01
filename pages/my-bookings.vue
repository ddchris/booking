<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white pt-2 px-4">我的預約</h1>

    <div v-if="loading" class="text-center py-10 text-gray-500">
      載入中...
    </div>

    <div v-else-if="!bookings.length" class="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <p>目前沒有預約記錄</p>
      <NuxtLink to="/" class="inline-block mt-4 text-amber-500 hover:text-amber-400 text-sm">
        去預約 →
      </NuxtLink>
    </div>

    <div v-else class="space-y-4 px-4 md:px-0">
      <!-- Desktop: Table View (>= 1024px) -->
      <div class="hidden lg:block w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <el-table 
          :data="paginatedBookings" 
          style="width: 100%" 
          border
        >
          <!-- Customer Info (Self) -->
          <el-table-column label="客戶資訊" min-width="140">
            <template #default="{ row }">
              <div class="font-medium text-amber-600 dark:text-amber-500 whitespace-nowrap">{{ row.userSnapshot?.displayName || '未知' }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ row.userSnapshot?.phone || '--' }}</div>
            </template>
          </el-table-column>

          <!-- Appointment Time -->
          <el-table-column label="預約時間" min-width="160">
            <template #default="{ row }">
              <div class="font-bold font-mono text-base whitespace-nowrap">
                {{ formatDate(row.timeSlot) }} {{ formatTime(row.timeSlot) }}
              </div>
            </template>
          </el-table-column>

          <!-- Operation Time -->
          <el-table-column label="操作時間" min-width="160">
             <template #default="{ row }">
               <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                 <div v-if="row.status === 'cancelled' && row.canceledAt">
                   {{ dayjs(row.canceledAt.toMillis()).format('YYYY/MM/DD HH:mm') }}
                   <span class="text-red-500 dark:text-red-400 text-[10px] ml-1">(取消)</span>
                 </div>
                 <div v-else>
                   {{ row.createdAt ? dayjs(row.createdAt.toMillis()).format('YYYY/MM/DD HH:mm') : '-' }}
                   <span class="text-gray-500 text-[10px] ml-1">(建立)</span>
                 </div>
               </div>
             </template>
          </el-table-column>

          <!-- Status -->
          <el-table-column label="狀態" min-width="100" align="center">
            <template #default="{ row }">
               <el-tag :type="getStatusType(row)" size="small">
                 {{ getStatusLabel(row) }}
               </el-tag>
            </template>
          </el-table-column>

          <!-- Service Items -->
          <el-table-column label="預約項目" min-width="140">
            <template #default="{ row }">
              <div class="text-xs text-gray-700 dark:text-gray-300">
                {{ getServiceLabels(row.services) }}
              </div>
            </template>
          </el-table-column>

          <!-- Action -->
          <el-table-column label="操作" min-width="110" align="center">
             <template #default="{ row }">
               <el-button 
                 v-if="canCancel(row)"
                 type="danger" 
                 size="small" 
                 :loading="bookingStore.loading"
                 @click="handleCancel(row)"
               >
                 取消預約
               </el-button>
             </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile: el-descriptions View (< 1024px) -->
      <div class="lg:hidden space-y-4">
        <el-descriptions
          v-for="booking in paginatedBookings"
          :key="booking.id"
          :column="2"
          direction="vertical"
          border
          size="small"
          class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <!-- Row 1: Full Width -->
          <el-descriptions-item label="預約時間" :span="2">
            <div class="font-bold font-mono text-sm">
              {{ formatDate(booking.timeSlot) }} {{ formatTime(booking.timeSlot) }}
            </div>
          </el-descriptions-item>

          <!-- Row 2: 50/50 -->
          <el-descriptions-item label="客戶資訊" :span="1">
            <div class="font-medium text-amber-600 dark:text-amber-500 text-sm">
              {{ booking.userSnapshot?.displayName || '未知' }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ booking.userSnapshot?.phone || '--' }}</div>
          </el-descriptions-item>

          <el-descriptions-item label="預約項目" :span="1">
            <div class="text-xs text-gray-700 dark:text-gray-300">
              {{ getServiceLabels(booking.services) }}
            </div>
          </el-descriptions-item>

          <!-- Row 3: 50/50 -->
          <el-descriptions-item label="操作時間" :span="1">
            <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              <div v-if="booking.status === 'cancelled' && booking.canceledAt">
                {{ dayjs(booking.canceledAt.toMillis()).format('YYYY/MM/DD HH:mm') }}
                <div class="text-red-500 text-[10px] mt-0.5">(取消)</div>
              </div>
              <div v-else>
                {{ booking.createdAt ? dayjs(booking.createdAt.toMillis()).format('YYYY/MM/DD HH:mm') : '-' }}
                <div class="text-gray-500 text-[10px] mt-0.5">(建立)</div>
              </div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="狀態" :span="1">
            <div class="flex flex-col gap-2 pt-1">
              <el-tag :type="getStatusType(booking)" size="small" class="w-fit">
                {{ getStatusLabel(booking) }}
              </el-tag>
              <el-button 
                v-if="canCancel(booking)"
                type="danger" 
                size="small" 
                class="w-fit !ml-0"
                :loading="bookingStore.loading"
                @click="handleCancel(booking)"
              >
                取消
              </el-button>
            </div>
          </el-descriptions-item>
        </el-descriptions>
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
          size="small"
        />
      </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useBookingStore } from '~/stores/booking.store'

const { $db } = useNuxtApp()
const auth = useAuthStore()
const bookingStore = useBookingStore()

interface BookingRecord {
  id: string
  timeSlot: number
  status: 'booked' | 'cancelled'
  createdAt: Timestamp
  updatedAt: Timestamp
  canceledAt?: Timestamp
  userId: string
  canceledBy?: 'user' | 'admin'
  services: string[]
  userSnapshot: {
    displayName: string
    phone: string
  }
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
      where('userId', '==', auth.user.uid)
    )
    const snap = await getDocs(q)
    const rawData = snap.docs.map(d => ({ id: d.id, ...d.data() })) as BookingRecord[]
    
    // Client-side sort to avoid index build wait
    bookings.value = rawData.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0
      const timeB = b.updatedAt?.toMillis?.() || 0
      return timeB - timeA
    })
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
const formatFullDateTime = (ts: any) => {
  if (!ts) return '-'
  const d = ts.toMillis ? dayjs(ts.toMillis()) : dayjs(ts)
  return d.format('YYYY/MM/DD HH:mm')
}

const serviceMap: Record<string, string> = {
  haircut: '剪髮',
  perm: '燙髮',
  coloring: '染髮',
  washing: '洗髮',
  scalp_care: '頭皮保養',
  other: '其他'
}

const getServiceLabels = (services: string[]) => {
  if (!services || !services.length) return '未指定'
  return services.map(s => serviceMap[s] || s).join(', ')
}


const getStatusType = (b: BookingRecord) => {
  if (b.status === 'cancelled') return 'danger'
  if (dayjs(b.timeSlot).isBefore(dayjs())) return 'info'
  return 'success'
}

const getStatusLabel = (b: BookingRecord) => {
  if (b.status === 'cancelled') {
    return b.canceledBy === 'admin' ? '管理員刪除' : '已取消'
  }
  if (dayjs(b.timeSlot).isBefore(dayjs())) return '已過期'
  return '已預約'
}

const canCancel = (b: BookingRecord) => {
  if (b.status !== 'booked') return false
  const now = dayjs()
  const slotDate = dayjs(b.timeSlot)
  
  // Rule: 4 hours difference
  const diffHours = slotDate.diff(now, 'hour', true)
  if (diffHours < 4) return false
  
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
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // User clicked confirm
    const success = await bookingStore.cancelBooking(b.id, b.timeSlot, b.userId)
    if (success) {
      ElMessage.success('已取消預約')
      fetchBookings() // Refresh list
    } else {
      const errMsg = bookingStore.error || '取消失敗'
      let translatedMsg = errMsg

      // 如果 errMsg 已經是中文提示（來自 Store 的 throw），則直接使用
      if (errMsg.includes('上限') || errMsg.includes('4 小時') || errMsg.includes('權限')) {
        translatedMsg = errMsg
      } else if (errMsg.includes('Monthly cancellation limit')) {
        translatedMsg = '本月已達自行取消次數上限(1次)'
      } else if (errMsg.includes('Missing or insufficient permissions') || errMsg.includes('permissions')) {
        translatedMsg = '權限不足：您可能無法修改此紀錄，或系統規則限制操作'
      } else if (errMsg.includes('NotFound') || errMsg.includes('找不到')) {
        translatedMsg = '找不到該預約記錄，可能已被刪除'
      }
        
      ElMessage.error({
        message: translatedMsg,
        showClose: true,
        duration: 5000,
        grouping: true
      })
    }
  } catch (e) {
    // User cancelled the dialog (or error)
    // console.log('Cancellation aborted')
  }
}
</script>

<style scoped>
:deep(.el-table .el-table__cell) {
  box-sizing: border-box !important;
  height: 50px !important;
  max-height: 50px !important;
  padding: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  overflow: hidden;
}

:deep(.el-table .cell) {
  box-sizing: border-box !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: hidden;
  line-height: 1.3;
  padding: 0 8px;
  white-space: nowrap;
}

:deep(.el-table .cell > div) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 確保按鈕也在高度限制內 */
:deep(.el-button--small) {
  padding: 4px 12px;
  font-size: 12px;
}

/* 確保標籤也在高度限制內 */
:deep(.el-tag--small) {
  padding: 4px 10px;
  height: auto;
  line-height: 1.2;
  font-size: 10px;
}

/* 確保表格邊框可見 */
:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid var(--el-table-border-color);
}

:deep(.el-table--border) {
  border: 1px solid var(--el-table-border-color);
}
</style>
