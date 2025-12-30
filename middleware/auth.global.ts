export default defineNuxtRouteMiddleware(async (to) => {
  // 排除預約規範頁與管理員相關路徑以外的檢查（如果有的話），
  // 主要是預防無限迴圈。
  if (to.path === '/booking-rules') return

  // 伺服器端先跳過跳轉，讓客戶端初始化 Firebase 後再決定
  // 這樣可以避免 SSR 時因為找不到 Firebase Session 而產生錯誤的跳轉
  if (import.meta.server) return

  const auth = useAuthStore()

  // 確保初始化完成 (Firebase 連線)
  if (!auth.isInitialized) {
    await auth.initAuth()
  }

  // 若未登入，強制跳轉至預約規範頁
  if (!auth.isAuthenticated) {
    console.log('[Middleware] 未登入，導向預約規範')
    return navigateTo('/booking-rules')
  }
})
