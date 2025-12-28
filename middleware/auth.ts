export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuthStore()

  // 確保初始化完成 (Firebase 連線)
  if (!auth.isInitialized) {
    await auth.initAuth()
  }

  // 若未登入且不是去規範頁，則強制跳轉
  if (!auth.isAuthenticated) {
    if (to.path === '/booking-rules') return
    return navigateTo('/booking-rules')
  }
})
