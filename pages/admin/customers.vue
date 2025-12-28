<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-white">客戶清單管理</h1>

    <!-- Toolbar -->
    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4">
      <input 
        v-model="search"
        type="text" 
        placeholder="搜尋姓名或電話..." 
        class="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
      >
    </div>

    <!-- List -->
    <div class="space-y-4">
      <div v-for="user in filteredUsers" :key="user.uid" class="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-amber-500">
               {{ user.displayName?.[0] || '?' }}
             </div>
             <div>
               <div class="font-bold text-white flex items-center gap-2">
                 {{ user.displayName }}
                 <span v-if="user.isBlocked" class="text-xs bg-red-500 text-white px-1.5 rounded">黑名單</span>
               </div>
               <div class="text-sm text-gray-400">
                 {{ user.phoneNumber || '無電話' }} | LINE: {{ user.lineId || '--' }}
               </div>
             </div>
          </div>
          
          <div class="text-right text-xs text-gray-500 space-y-1">
             <div>總預約: <span class="text-amber-500 font-bold text-sm">{{ user.totalBookings || 0 }}</span> 次</div>
             <div v-if="user.lastBookingAt">
               最近: {{ formatDate(user.lastBookingAt.toMillis()) }}
             </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-4 pt-4 border-t border-gray-700/50 flex flex-col gap-3">
           <!-- Note -->
           <div class="flex gap-2">
             <input 
               v-model="user.tempNote"
               @change="updateNote(user)"
               type="text"
               placeholder="管理員備註..."
               class="flex-1 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500"
             >
           </div>
           
           <!-- Buttons -->
           <div class="flex justify-end gap-2">
             <button 
               @click="toggleBlock(user)"
               class="text-xs px-3 py-1.5 rounded border transition"
               :class="user.isBlocked ? 'border-gray-500 text-gray-400 hover:bg-gray-700' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'"
             >
               {{ user.isBlocked ? '解除黑名單' : '設為黑名單' }}
             </button>
           </div>
        </div>
      </div>
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
