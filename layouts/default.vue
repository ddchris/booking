<template>
  <div class="h-[100dvh] w-[100vw] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300 overflow-hidden">
    <!-- Header -->
    <header class="flex-none border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-50 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-10 md:h-14 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5 md:gap-2">
          <!-- Logo Icon -->
          <div class="i-carbon-scis-transparent w-4 h-4 md:w-6 md:h-6" />
          <span>專注理髮預約</span>
        </NuxtLink>

        <!-- Use ClientOnly to avoid hydration mismatch on auth state -->
        <ClientOnly>
          <div class="flex items-center gap-1.5 sm:gap-4">
             <!-- Dark Mode Toggle -->
            <!-- Dark Mode Toggle -->
            <el-button 
              circle
              @click="toggleDark()" 
              title="切換主題"
              class="!p-1 md:!p-2 border-none transition-colors duration-300 !w-7 !h-7 md:!w-9 md:!h-9 mr-2"
              :class="isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-orange-100 hover:bg-orange-200'"
            >
              <div class="text-xs md:text-lg leading-none flex items-center justify-center">
                 <span v-if="isDark">🌙</span>
                 <span v-else>☀️</span>
              </div>
            </el-button>

            <!-- Auth Navigation Links (Stable layout) -->
            <NuxtLink v-if="auth.isAuthenticated" to="/" class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              立即預約
            </NuxtLink>

            <NuxtLink to="/booking-rules" class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              預約規範
            </NuxtLink>

            <NuxtLink v-if="auth.isAuthenticated" to="/my-bookings" class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              我的預約
            </NuxtLink>
            
            <NuxtLink v-if="auth.isAuthenticated && auth.isAdmin" to="/admin/bookings" class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              後台
            </NuxtLink>

            <div v-if="auth.isAuthenticated" class="h-3 md:h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5 md:mx-1 hidden sm:block transition-opacity duration-300"></div>

            <!-- Profile / Login Button Area (Client Side Only for stability) -->
            <ClientOnly>
              <div v-if="auth.isAuthenticated" class="flex items-center gap-1 md:gap-2">
                <div class="w-7 h-7 md:w-9 md:h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-[10px] md:text-sm ring-1 ring-white dark:ring-gray-800">
                   {{ auth.user?.displayName?.[0]?.toUpperCase() || 'U' }}
                </div>
                <button @click="handleLogout" class="text-xs md:text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition hidden sm:block">
                  登出
                </button>
              </div>
              <template v-else-if="!auth.loading">
                <button 
                  @click="handleLogin"
                  class="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2.5 py-0.5 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold hover:opacity-90 transition shadow-lg shadow-gray-500/20"
                >
                  登入
                </button>
              </template>
              <template #fallback>
                <div class="w-7 md:w-9 h-7 md:h-9"></div>
              </template>
            </ClientOnly>

            <!-- Hamburger Menu Button -->
            <button 
              class="sm:hidden p-1.5 ml-1 text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-gray-200 transition"
              @click="isMenuOpen = true"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <!-- Mobile Menu Drawer -->
          <el-drawer
            v-model="isMenuOpen"
            direction="rtl"
            size="75%"
            :with-header="false"
            class="mobile-menu-drawer"
            append-to-body
          >
            <div class="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <span class="text-lg font-bold">選單</span>
                <button @click="isMenuOpen = false" class="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  <div class="i-carbon-close w-6 h-6" />
                </button>
              </div>
              
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <template v-if="!auth.loading">
                  <!-- Always show Booking Rules on mobile -->
                  <NuxtLink 
                    to="/booking-rules" 
                    class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3"
                    active-class="text-amber-600 dark:text-amber-500 bg-orange-50 dark:bg-gray-800 font-bold"
                    @click="isMenuOpen = false"
                  >
                    <div class="i-carbon-document w-5 h-5" />
                    <span>預約規範</span>
                  </NuxtLink>

                  <template v-if="auth.isAuthenticated">
                    <NuxtLink 
                      to="/" 
                      class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3"
                      exact-active-class="text-amber-600 dark:text-amber-500 bg-orange-50 dark:bg-gray-800 font-bold"
                      @click="isMenuOpen = false"
                    >
                      <div class="i-carbon-calendar w-5 h-5" />
                      <span>立即預約</span>
                    </NuxtLink>

                    <NuxtLink 
                      to="/my-bookings" 
                      class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3"
                      active-class="text-amber-600 dark:text-amber-500 bg-orange-50 dark:bg-gray-800 font-bold"
                      @click="isMenuOpen = false"
                    >
                      <div class="i-carbon-user w-5 h-5" />
                      <span>我的預約</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      v-if="auth.isAdmin" 
                      to="/admin/bookings" 
                      class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3"
                      active-class="text-amber-600 dark:text-amber-500 bg-orange-50 dark:bg-gray-800 font-bold"
                      @click="isMenuOpen = false"
                    >
                      <div class="i-carbon-dashboard w-5 h-5" />
                      <span>後台管理</span>
                    </NuxtLink>

                    <div class="my-2 border-t border-gray-100 dark:border-gray-800"></div>

                    <button 
                      @click="handleLogout" 
                      class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 transition flex items-center gap-3"
                    >
                      <div class="i-carbon-logout w-5 h-5" />
                      <span>登出</span>
                    </button>
                  </template>
                  <template v-else>
                    <button 
                      @click="handleLogin"
                      class="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-bold hover:opacity-90 transition text-center"
                    >
                      登入
                    </button>
                  </template>
                </template>
              </div>
            </div>
          </el-drawer>
        </ClientOnly>
      </div>
    </header>

    <!-- Main Content (Scrolls internally) -->
    <main v-if="auth.isInitialized" class="flex-1 w-full max-w-7xl mx-auto overflow-y-auto relative md:px-8">
      <slot />
    </main>

    <!-- Initializing State -->
    <main v-else class="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
       <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">系統初始化中...</p>
       </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-gray-500 text-xs">
      <div class="max-w-7xl mx-auto px-4">
        &copy; {{ new Date().getFullYear() }} Focus Hair Design. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()

// Dark mode handling
const isDark = useDark() 
const toggleDark = useToggle(isDark)

// Initialize Auth as early as possible on client side
if (process.client) {
  auth.initAuth()
}

const handleLogin = async () => {
  try {
    await auth.login()
    navigateTo('/')
  } catch (e) {
    // alert('登入失敗') - let auth store handle errors or show accessible toast usually
    console.error(e)
  }
}

const handleLogout = async () => {
  isMenuOpen.value = false
  await auth.logout()
  ElMessage.success('登出成功')
  navigateTo('/booking-rules')
}

const isMenuOpen = ref(false)
</script>

<style>
body {
  @apply bg-white dark:bg-gray-900;
}

/* Global Transition for Theme Switch */
*, *::before, *::after {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* Element Plus Table Dark Mode Overrides matches Tailwind gray-900/800 */
/* Premium Dark Mode Table Styling */
html.dark .el-table {
  --el-table-bg-color: #111827; /* Gray 900 */
  --el-table-tr-bg-color: #111827;
  --el-table-header-bg-color: #1f2937; /* Gray 800 */
  --el-table-row-hover-bg-color: #1f2937;
  --el-table-border-color: #374151; /* Gray 700 */
  --el-table-text-color: #e5e7eb; /* Gray 200 */
  --el-table-header-text-color: #9ca3af; /* Gray 400 */
  --el-fill-color-lighter: #1f2937; 
}

/* Table Spacing & Aesthetics */
html.dark .el-table th.el-table__cell {
  background-color: #1f2937 !important;
  font-weight: 600;
  padding: 2px 0 !important; /* Larger Header Spacing */
}
html.dark .el-table--border .el-table__inner-wrapper::after,
html.dark .el-table--border::after,
html.dark .el-table--border .el-table__inner-wrapper::before,
html.dark .el-table__inner-wrapper::before {
  background-color: #374151 !important;
}

/* Status Badges (Tag) Refinements */
.el-tag {
  border: none !important;
  padding: 6px 12px !important;
  font-weight: 600;
}

.mobile-menu-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
