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
    <div class="space-y-3">
      <el-descriptions
        v-for="user in filteredUsers"
        :key="user.uid"
        direction="vertical"
        :column="2"
        border
        size="small"
        class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
      >
        <!-- User Info -->
        <el-descriptions-item label="客戶資訊">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-500">
              {{ user.displayName?.[0] || '?' }}
            </div>
            <div>
              <div class="font-medium text-amber-600 dark:text-amber-500">
                {{ user.displayName }}
                <span v-if="user.isBlocked" class="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">黑名單</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.phoneNumber || '無電話' }}</div>
            </div>
          </div>
        </el-descriptions-item>

        <!-- LINE ID -->
        <el-descriptions-item label="LINE ID">
          <div class="text-sm">{{ user.lineId || '--' }}</div>
        </el-descriptions-item>

        <!-- Total Bookings -->
        <el-descriptions-item label="總預約次數">
          <div class="text-amber-600 dark:text-amber-500 font-bold">{{ user.totalBookings || 0 }} 次</div>
        </el-descriptions-item>

        <!-- Last Booking -->
        <el-descriptions-item label="最近預約">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ user.lastBookingAt ? formatDate(user.lastBookingAt.toMillis()) : '無記錄' }}
          </div>
        </el-descriptions-item>

        <!-- Admin Note -->
        <el-descriptions-item label="管理員備註" :span="2">
          <input 
            v-model="user.tempNote"
            @change="updateNote(user)"
            type="text"
            placeholder="管理員備註..."
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-300 focus:outline-none focus:border-amber-500"
          >
        </el-descriptions-item>

        <!-- Actions -->
        <el-descriptions-item label="操作" :span="2">
          <div class="flex justify-end">
            <el-button 
              @click="toggleBlock(user)"
              :type="user.isBlocked ? 'info' : 'danger'"
              size="small"
            >
              {{ user.isBlocked ? '解除黑名單' : '設為黑名單' }}
            </el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getFirestore } from 'firebase/firestore'
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth']
})

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
