<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>
    
    <!-- Dialog -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
      <!-- Close Button -->
      <button 
        @click="close"
        class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
      >
        <div class="i-carbon-close text-xl"></div>
      </button>

      <h3 class="text-xl font-bold text-white mb-1">確認預約</h3>
      <p class="text-gray-400 text-sm mb-6">
        {{ formattedTime }}
      </p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">姓名</label>
          <input 
            v-model="form.displayName"
            type="text" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600"
            placeholder="請輸入姓名"
          >
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">電話</label>
          <input 
            v-model="form.phone"
            type="tel" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600"
            placeholder="09xx-xxx-xxx"
          >
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">LINE ID</label>
          <input 
            v-model="form.lineId"
            type="text" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600"
            placeholder="LINE ID"
          >
        </div>

        <div v-if="validationError || bookingStore.error" class="text-red-400 text-xs text-center py-2">
          {{ validationError || bookingStore.error }}
        </div>

        <div class="flex items-center gap-2 mb-4">
          <input 
            id="save-default"
            v-model="saveAsDefault"
            type="checkbox"
            class="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-800"
          >
          <label for="save-default" class="text-xs text-gray-400 select-none cursor-pointer">
            儲存為預設聯絡資料 (下次自動帶入)
          </label>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            type="button" 
            @click="close"
            class="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition"
          >
            取消
          </button>
          <button 
            type="submit"
            :disabled="bookingStore.loading"
            class="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ bookingStore.loading ? '處理中...' : '確認預約' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth.store'
import { useBookingStore } from '~/stores/booking.store'

const props = defineProps<{
  modelValue: boolean
  timeSlot: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
}>()

const auth = useAuthStore()
const bookingStore = useBookingStore()

const form = reactive({
  displayName: '',
  phone: '',
  lineId: ''
})

const saveAsDefault = ref(false)
const validationError = ref('')

const formattedTime = computed(() => {
  if (!props.timeSlot) return ''
  const d = dayjs(props.timeSlot)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const dayName = days[d.day()]
  return `${d.format('YYYY/MM/DD')} (${dayName}) ${d.format('HH:mm')}`
})

// Auto-fill
watch(() => props.modelValue, (val) => {
  if (val) {
    validationError.value = ''
    bookingStore.clearError()
    
    // 1. Try LocalStorage
    const cached = localStorage.getItem('focus_hair_form')
    if (cached) {
      const data = JSON.parse(cached)
      form.displayName = data.displayName || ''
      form.phone = data.phone || '' 
      form.lineId = data.lineId || ''
      saveAsDefault.value = !!data.saveAsDefault
    } 
    // 2. If User Profile exists and fields are empty (or valid), prefer User Profile?
    // Requirement says "Save as default... automatic fill next time".
    // If we have profile data, we should probably start with that.
    if (auth.userProfile) {
        if (!form.displayName) form.displayName = auth.userProfile.displayName || ''
        if (!form.phone) form.phone = auth.userProfile.phoneNumber || ''
        if (!form.lineId) form.lineId = auth.userProfile.lineId || ''
    }
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const submit = async () => {
  if (!props.timeSlot) return
  validationError.value = ''
  
  // Validation
  if (!/^09\d{8}$/.test(form.phone)) {
    validationError.value = '請輸入有效的10碼手機號碼 (09開頭)'
    return
  }
  
  const contactInfo = {
    name: form.displayName,
    phone: form.phone,
    lineId: form.lineId
  }

  // Cache form data locally if "Save as Default" is checked OR always?
  // User asked for "Save as Default". 
  // Let's cache if saved.
  if (saveAsDefault.value) {
     localStorage.setItem('focus_hair_form', JSON.stringify({ 
         displayName: form.displayName, // Fix: use displayName key
         phone: form.phone,
         lineId: form.lineId,
         saveAsDefault: true 
     }))
  }

  // Call Store Action
  // We pass contactInfo to handle "Profile not loaded" case or Profile Update case.
  const success = await bookingStore.createBooking(props.timeSlot, contactInfo, saveAsDefault.value)
  
  if (success) {
    emit('success')
    close()
  }
}
</script>
