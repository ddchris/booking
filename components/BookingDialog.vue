<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>
    
    <!-- Dialog -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
      <!-- Close Button -->
      <button 
        @click="close"
        class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
      >
        <div class="i-carbon-close text-xl"></div>
      </button>

      <h3 class="text-xl font-bold text-white mb-1">確認預約</h3>
      <p class="text-red-600 dark:text-red-500 text-sm font-bold mb-4">
        {{ formattedTime }}
      </p>

      <form @submit.prevent="submit" class="space-y-3">
        <!-- Service Type (Checkboxes for Multi-select) -->
        <div>
          <label class="block text-xs text-gray-500 mb-2">服務項目 (可複選)</label>
          <div class="grid grid-cols-2 gap-2">
            <label 
              v-for="opt in serviceOptions" 
              :key="opt.value" 
              class="flex items-center gap-2 bg-gray-900 border rounded-lg px-3 py-2 cursor-pointer transition-all duration-200" 
              :class="form.serviceTypes.includes(opt.value) 
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                : 'border-gray-700 opacity-60 hover:opacity-100 hover:bg-gray-700 hover:border-gray-500'"
            >
              <input 
                type="checkbox" 
                :value="opt.value" 
                v-model="form.serviceTypes"
                class="accent-emerald-500 w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/40"
              >
              <span class="text-sm font-bold" :class="form.serviceTypes.includes(opt.value) ? 'text-emerald-500' : 'text-gray-300'">{{ opt.label }}</span>
            </label>

          </div>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">姓名</label>
          <input 
            v-model="form.displayName"
            type="text" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600 text-sm"
            placeholder="請輸入姓名"
          >
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">電話</label>
          <input 
            v-model="form.phone"
            type="tel" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600 text-sm"
            placeholder="09xx-xxx-xxx"
          >
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">LINE ID</label>
          <input 
            v-model="form.lineId"
            type="text" 
            required
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 placeholder-gray-600 text-sm"
            placeholder="LINE ID"
          >
        </div>

        <div v-if="validationError || bookingStore.error" class="text-red-400 text-xs text-center py-2">
          {{ validationError || bookingStore.error }}
        </div>

        <div class="flex items-center gap-2 pt-1">
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

        <div class="flex gap-3 pt-2">
          <button 
            type="button" 
            @click="close"
            class="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition"
          >
            取消
          </button>
          <button 
            type="submit"
            :disabled="bookingStore.loading || form.serviceTypes.length === 0"
            class="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

const serviceOptions = [
  { label: '剪髮', value: 'haircut' },
  { label: '燙髮', value: 'perm' },
  { label: '染髮', value: 'coloring' },
  { label: '洗髮', value: 'washing' },
  { label: '頭皮保養', value: 'scalp_care' },
  { label: '其他', value: 'other' }
]

const form = reactive({
  serviceTypes: ['haircut'] as string[],
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
    
    // Reset form
    form.serviceTypes = ['haircut']
    form.displayName = ''
    form.phone = ''
    form.lineId = ''
    saveAsDefault.value = false
    
    // Get user-specific localStorage key
    const userId = auth.user?.uid
    const storageKey = userId ? `focus_hair_form_${userId}` : 'focus_hair_form'
    
    // Only auto-fill if user has explicitly saved default data
    const cached = localStorage.getItem(storageKey)
    if (cached) {
      const data = JSON.parse(cached)
      form.displayName = data.displayName || ''
      form.phone = data.phone || '' 
      form.lineId = data.lineId || ''
      saveAsDefault.value = !!data.saveAsDefault
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

  // Save form data to user-specific localStorage if "Save as Default" is checked
  if (saveAsDefault.value) {
    const userId = auth.user?.uid
    const storageKey = userId ? `focus_hair_form_${userId}` : 'focus_hair_form'
    
    localStorage.setItem(storageKey, JSON.stringify({ 
      displayName: form.displayName,
      phone: form.phone,
      lineId: form.lineId,
      saveAsDefault: true 
    }))
  }


  // Call Store Action
  // We pass contactInfo to handle "Profile not loaded" case or Profile Update case.
  const success = await bookingStore.createBooking(props.timeSlot, form.serviceTypes, contactInfo, saveAsDefault.value)
  
  if (success) {
    emit('success')
    close()
  }
}
</script>
