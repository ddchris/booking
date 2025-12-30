<template>
  <el-dialog
    v-model="visible"
    title="登入"
    width="90%"
    class="login-dialog max-w-md rounded-2xl overflow-hidden"
    :show-close="true"
    append-to-body
    center
  >
    <div class="flex flex-col items-center py-4 px-2">
      <!-- In-App Browser Warning -->
      <template v-if="isInAppBrowser">
        <div class="mb-6 flex flex-col items-center text-center">
          <div class="i-carbon-warning-filled text-amber-500 w-16 h-16 mb-4" />
          <h3 class="text-lg font-bold mb-2 dark:text-white"> Google 登入不支援此應用程式內建瀏覽器 </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            請點擊下方按鈕以 Chrome 或 Safari 開啟，以確保登入功能正常運作。
          </p>
          
          <button 
            @click="handleOpenExternal"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <div class="i-carbon-launch w-5 h-5" />
            開啟外部瀏覽器
          </button>
          
          <button 
            @click="visible = false"
            class="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
          >
            返回
          </button>
        </div>
      </template>

      <!-- Standard Login Options -->
      <template v-else>
        <div class="w-full space-y-4">
          <!-- Google Login Button -->
          <button 
            @click="handleLogin('google')"
            class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-3 px-6 rounded-xl transition duration-200 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google" />
            使用 Google 登入
          </button>

          <!-- Facebook Placeholder -->
          <button 
            disabled
            class="w-full flex items-center justify-center gap-3 bg-[#1877F2] opacity-50 cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-sm"
          >
            <div class="i-carbon-logo-facebook w-5 h-5" />
            使用 Facebook 登入
          </button>

          <!-- LINE Placeholder -->
          <button 
            disabled
            class="w-full flex items-center justify-center gap-3 bg-[#06C755] opacity-50 cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-sm"
          >
            <div class="i-carbon-chat w-5 h-5" />
            使用 LINE 登入
          </button>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'login'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isInAppBrowser = ref(false)

const checkInAppBrowser = () => {
  if (!import.meta.client) return false
  const ua = navigator.userAgent
  
  // Detection regex for common in-app browsers
  const rules = [
    'Line',          // LINE
    'FBAN', 'FBAV',  // Facebook
    'Instagram',     // Instagram
    'Telegram',      // Telegram
    'WhatsApp',      // WhatsApp
    'MicroMessenger' // WeChat
  ]
  
  const regex = new RegExp(rules.join('|'), 'i')
  return regex.test(ua)
}

onMounted(() => {
  isInAppBrowser.value = checkInAppBrowser()
})

const handleLogin = (provider: string) => {
  if (provider === 'google') {
    emit('login')
    visible.value = false
  }
}

const handleOpenExternal = () => {
  const currentUrl = new URL(window.location.href)
  
  // Add a parameter to tell the external browser to open the login modal automatically
  currentUrl.searchParams.set('openLogin', 'true')

  // LINE specific: 'openExternalBrowser=1' forces LINE to open system browser
  if (/Line/i.test(navigator.userAgent)) {
    currentUrl.searchParams.set('openExternalBrowser', '1')
  }

  window.open(currentUrl.toString(), '_blank')
}
</script>

<style scoped>
:deep(.login-dialog) {
  border-radius: 1rem;
}
:deep(.login-dialog .el-dialog__header) {
  padding-top: 1.5rem;
  margin-right: 0;
}
:deep(.login-dialog .el-dialog__title) {
  font-weight: 800;
  font-size: 1.25rem;
}
</style>
