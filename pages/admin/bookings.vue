<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2 pt-2 px-4">
      <h1 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">管理員預約總覽</h1>
      <NuxtLink to="/admin/customers" class="text-xs md:text-sm text-amber-500 hover:text-amber-400 whitespace-nowrap">
        查看客戶清單 →
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <!-- Date Filter -->
      <div class="flex items-center gap-2">
        <label class="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">日期:</label>
        <select 
          v-model="dateFilter"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block py-1 px-2 md:p-2 transition-colors duration-300 h-7 md:h-auto"
        >
          <option value="all">全部</option>
          <option value="today">今天</option>
          <option value="tomorrow">明天</option>
          <option value="this_month">本月</option>
          <option value="next_month">下月</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <label class="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">狀態:</label>
        <select 
          v-model="statusFilter"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block py-1 px-2 md:p-2 transition-colors duration-300 h-7 md:h-auto"
        >
          <option value="all">全部</option>
          <option value="upcoming">未過期</option>
          <option value="past">已過期</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <!-- User Name Search -->
      <div class="flex items-center gap-2">
        <label class="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">使用者:</label>
        <input 
          v-model="userNameFilter"
          type="text"
          placeholder="搜尋姓名..."
          class="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block py-1 px-2 md:p-2 transition-colors duration-300 w-32 md:w-40 h-7 md:h-auto"
        >
      </div>
    </div>

    <!-- Booking List -->
    <div class="space-y-3">
      <div v-if="paginatedBookings.length === 0" class="text-center py-10 text-gray-500">
        無符合條件的預約
      </div>

      <template v-else>
        <!-- Desktop: Table View (>= 768px) -->
        <div class="hidden md:block w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          <el-table 
            :data="paginatedBookings" 
            style="width: 100%" 
            border
          >
            <!-- Customer Info (Keep Left) -->
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

            <!-- Service Items (Keep Added) -->
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
                    v-if="row.status === 'booked'"
                    type="danger"
                    size="small"
                    @click="deleteBooking(row)"
                 >
                    刪除預約
                 </el-button>
               </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile: el-descriptions View (< 768px) -->
        <div class="md:hidden space-y-4">
          <el-descriptions
            v-for="booking in paginatedBookings"
            :key="booking.id"
            :column="6"
            direction="vertical"
            border
            size="small"
            class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <!-- Row 1: 3 Columns -->
            <el-descriptions-item label="預約時間" :span="2">
              <div class="font-bold font-mono text-sm whitespace-nowrap">
                {{ formatDate(booking.timeSlot) }} {{ formatTime(booking.timeSlot) }}
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="客戶資訊" :span="2">
              <div class="font-medium text-amber-600 dark:text-amber-500 text-sm whitespace-nowrap">
                {{ booking.userSnapshot?.displayName || '未知' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ booking.userSnapshot?.phone || '--' }}</div>
            </el-descriptions-item>

            <el-descriptions-item label="預約項目" :span="2">
              <div class="text-xs text-gray-700 dark:text-gray-300">
                {{ getServiceLabels(booking.services) }}
              </div>
            </el-descriptions-item>

            <!-- Row 2: 2 Columns -->
            <el-descriptions-item label="操作時間" :span="3">
              <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                <div v-if="booking.status === 'cancelled' && booking.canceledAt">
                  {{ dayjs(booking.canceledAt.toMillis()).format('YYYY/MM/DD HH:mm') }}
                  <span class="text-red-500 text-[10px] ml-1">(取消)</span>
                </div>
                <div v-else>
                  {{ booking.createdAt ? dayjs(booking.createdAt.toMillis()).format('YYYY/MM/DD HH:mm') : '-' }}
                  <span class="text-gray-500 text-[10px] ml-1">(建立)</span>
                </div>
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="狀態" :span="3">
              <div class="flex items-center justify-between gap-3">
                <el-tag :type="getStatusType(booking)" size="small">
                  {{ getStatusLabel(booking) }}
                </el-tag>
                <el-button 
                  v-if="booking.status === 'booked'"
                  type="danger"
                  size="small"
                  @click="deleteBooking(booking)"
                >
                  刪除預約
                </el-button>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="filteredBookings.length > 0" class="flex justify-center mt-6 p-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 8, 10, 20]"
        layout="total, sizes, prev, pager, next"
        :total="filteredBookings.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, getFirestore } from 'firebase/firestore'
import dayjs from 'dayjs'
import { bookingService } from '~/services/booking.service'
import { ElMessage, ElMessageBox } from 'element-plus'


const { $db } = useNuxtApp()
const auth = useAuthStore()

// State
const bookings = ref<any[]>([])
const dateFilter = ref('all')
const statusFilter = ref('upcoming') // Default: Not expired
const userNameFilter = ref('') // User name search

// Pagination State
const currentPage = ref(1)
const pageSize = ref(8)

// Admin Check
onMounted(() => {
  if (auth.isAuthenticated && !auth.isAdmin) {
    navigateTo('/')
  }
})

// Fetch Data
const q = query(collection($db, 'bookings'), orderBy('timeSlot', 'desc'))

onMounted(() => {
  onSnapshot(q, (snap) => {
    bookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

// Filtering
const filteredBookings = computed(() => {
  let result = bookings.value
  const now = dayjs()

  // 1. Date Filter
  if (dateFilter.value === 'today') {
    result = result.filter(b => dayjs(b.timeSlot).isSame(now, 'day'))
  } else if (dateFilter.value === 'tomorrow') {
    result = result.filter(b => dayjs(b.timeSlot).isSame(now.add(1, 'day'), 'day'))
  } else if (dateFilter.value === 'this_month') {
    result = result.filter(b => dayjs(b.timeSlot).isSame(now, 'month'))
  } else if (dateFilter.value === 'next_month') {
    result = result.filter(b => dayjs(b.timeSlot).isSame(now.add(1, 'month'), 'month'))
  }

  // 2. Status Filter
  if (statusFilter.value === 'upcoming') {
    // Not Cancelled AND Future (Not Expired)
    result = result.filter(b => b.status !== 'cancelled' && dayjs(b.timeSlot).isAfter(now))
  } else if (statusFilter.value === 'past') {
    // Not Cancelled AND Past (Expired/Completed)
    result = result.filter(b => b.status !== 'cancelled' && dayjs(b.timeSlot).isBefore(now))
  } else if (statusFilter.value === 'cancelled') {
    result = result.filter(b => b.status === 'cancelled')
  }

  // 3. User Name Filter
  if (userNameFilter.value.trim()) {
    const searchTerm = userNameFilter.value.trim().toLowerCase()
    result = result.filter(b => {
      const displayName = b.userSnapshot?.displayName || ''
      return displayName.toLowerCase().includes(searchTerm)
    })
  }

  return result
})

// Pagination Logic
const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBookings.value.slice(start, end)
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const formatDate = (ts: number) => dayjs(ts).format('YYYY/MM/DD')
const formatTime = (ts: number) => dayjs(ts).format('HH:mm')

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


const getStatusType = (b: any) => {
  if (b.status === 'cancelled') return 'danger'
  if (dayjs(b.timeSlot).isBefore(dayjs())) return 'info'
  return 'success'
}

const getStatusLabel = (b: any) => {
  if (b.status === 'cancelled') {
    return b.canceledBy === 'admin' ? '管理員刪除' : '已取消'
  }
  if (dayjs(b.timeSlot).isBefore(dayjs())) return '已完成'
  return '已預約'
}

const deleteBooking = async (b: any) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除 ${b.userSnapshot?.displayName || '此用戶'} 的預約嗎？\n(此操作不會計入客戶取消次數)`,
      '刪除預約',
      {
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await bookingService.adminDeleteBooking(b.id, b.timeSlot, b.userId)
    ElMessage.success('已刪除')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '刪除失敗')
    }
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
```
