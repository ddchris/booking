<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2 pt-2 px-4">
      <h1 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">客戶清單管理</h1>
      <NuxtLink to="/admin/bookings" class="text-xs md:text-sm text-amber-500 hover:text-amber-400 whitespace-nowrap">
        ← 返回後台管理
      </NuxtLink>
    </div>

    <!-- Search Bar -->
    <div class="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <input 
        v-model="search"
        type="text" 
        placeholder="搜尋姓名或電話..." 
        class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block py-1 px-2 md:p-2 transition-colors duration-300 h-7 md:h-auto"
      >
    </div>

    <!-- Customer List -->
    <div class="space-y-3 px-2 md:px-0">
      <!-- Desktop: Table View (>= 1024px) -->
      <div class="hidden lg:block w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <el-table :data="filteredUsers" style="width: 100%" border size="small">
          <el-table-column label="客戶資訊" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-500 flex-shrink-0">
                  {{ row.displayName?.[0] || '?' }}
                </div>
                <div class="overflow-hidden">
                  <div class="font-medium text-amber-600 dark:text-amber-500 truncate">
                    {{ row.displayName }}
                    <span v-if="row.isBlocked" class="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">黑名單</span>
                  </div>
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">{{ row.phoneNumber || '無電話' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="LINE ID" prop="lineId" min-width="120">
            <template #default="{ row }">{{ row.lineId || '--' }}</template>
          </el-table-column>

          <el-table-column label="總預約" width="80" align="center">
            <template #default="{ row }">
              <span class="font-bold text-amber-600">{{ row.totalBookings || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="總取消" width="80" align="center">
            <template #default="{ row }">
              <span class="font-bold text-red-500">{{ row.totalCancellations || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="最近預約" min-width="110" align="center">
            <template #default="{ row }">
              <div class="text-[11px] text-gray-500 font-mono">
                {{ row.lastBookingAt ? formatDate(row.lastBookingAt.toMillis()) : '無' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="管理員備註" min-width="200">
            <template #default="{ row }">
              <input 
                v-model="row.tempNote"
                @change="updateNote(row)"
                type="text"
                placeholder="管理員備註..."
                class="w-full bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-300 focus:outline-none focus:border-amber-500"
              >
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                @click="toggleBlock(row)"
                :type="row.isBlocked ? 'info' : 'danger'"
                size="small"
                plain
              >
                {{ row.isBlocked ? '解除' : '封鎖' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile: Optimized Card View (< 1024px) -->
      <div class="lg:hidden space-y-3">
        <div 
          v-for="user in filteredUsers" 
          :key="user.uid"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 transition-colors duration-300"
        >
          <div class="flex items-start gap-3">
            <!-- Col 1: Basic Info (Left) -->
            <div class="flex-shrink-0 w-28">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-600 dark:text-amber-500">
                  {{ user.displayName?.[0] || '?' }}
                </div>
                <div class="font-bold text-amber-600 dark:text-amber-500 text-sm truncate w-16">{{ user.displayName }}</div>
              </div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400 break-all mb-1">{{ user.phoneNumber || '無電話' }}</div>
              
              <!-- Recent Booking moved here -->
              <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <div class="text-[9px] text-gray-400">最近預約</div>
                <div class="text-[10px] text-gray-500 font-mono">{{ user.lastBookingAt ? formatDate(user.lastBookingAt.toMillis()) : '無' }}</div>
              </div>

              <div v-if="user.isBlocked" class="mt-2 text-[9px] bg-red-500 text-white px-1 py-0.5 rounded w-fit italic">黑名單</div>
            </div>

            <!-- Col 2: Stats (Center) -->
            <div class="flex-grow border-l border-gray-100 dark:border-gray-700 pl-3">
              <div class="mb-3">
                <span class="text-[10px] text-gray-400 uppercase tracking-tighter">LINE:</span>
                <div class="text-[11px] font-mono truncate w-24">{{ user.lineId || '--' }}</div>
              </div>
              
              <!-- Stats displayed horizontally -->
              <div class="flex items-center gap-4">
                <div class="flex flex-col">
                  <span class="text-[9px] text-gray-400">總次數</span>
                  <span class="text-[11px] font-bold text-amber-500 text-center">{{ user.totalBookings || 0 }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] text-red-400">總取消</span>
                  <span class="text-[11px] font-bold text-red-500 text-center">{{ user.totalCancellations || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Col 3: Admin Actions (Right) -->
            <div class="flex-shrink-0 w-32 border-l border-gray-100 dark:border-gray-700 pl-3 flex flex-col gap-2">
              <div>
                 <div class="text-[9px] text-gray-400 mb-1">備註</div>
                 <input 
                  v-model="user.tempNote"
                  @change="updateNote(user)"
                  type="text"
                  placeholder="備註..."
                  class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-gray-300 focus:outline-none focus:border-amber-500 h-6"
                >
              </div>
              <el-button 
                @click="toggleBlock(user)"
                :type="user.isBlocked ? 'info' : 'danger'"
                size="small"
                class="!py-1 !h-6 !text-[10px] w-full"
                plain
              >
                {{ user.isBlocked ? '解除' : '封鎖' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getFirestore } from 'firebase/firestore'
import dayjs from 'dayjs'

const { $db } = useNuxtApp()
const auth = useAuthStore()

// Admin Guard
onMounted(() => {
  if (auth.isAuthenticated && !auth.isAdmin) {
    navigateTo('/')
  }
})

const users = ref<any[]>([])
const search = ref('')

onMounted(() => {
  const q = query(collection($db, 'users'), orderBy('lastBookingAt', 'desc'))
  onSnapshot(q, (snap) => {
    users.value = snap.docs.map(d => {
      const data = d.data()
      // Init tempNote with existing note if valid
      return { 
        uid: d.id, 
        ...data,
        tempNote: data.adminNote || '' 
      }
    })
  })
})

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const s = search.value.toLowerCase()
  return users.value.filter(u => 
    (u.displayName || '').toLowerCase().includes(s) ||
    (u.phoneNumber || '').includes(s)
  )
})

const formatDate = (ts: number) => dayjs(ts).format('YYYY/MM/DD')

const updateNote = async (user: any) => {
  const ref = doc($db, 'users', user.uid)
  await updateDoc(ref, { adminNote: user.tempNote })
}

const toggleBlock = async (user: any) => {
  const newStatus = !user.isBlocked
  const msg = newStatus 
    ? `確定要將 ${user.displayName} 加入黑名單嗎？\n(將無法進行新預約)` 
    : `確定要解除 ${user.displayName} 的黑名單嗎？`
    
  if (confirm(msg)) {
    const ref = doc($db, 'users', user.uid)
    await updateDoc(ref, { isBlocked: newStatus })
  }
}
</script>
