export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()
  // If not authenticated and not loading (auth init done)
  // Ideally, auth init should adhere to middleware flow
  // But defineStore is reactive.
  // We assume auth.initAuth() is called in default layout.
  // We check auth.isAuthenticated.

  // Note: On deep link refresh, auth.user might be null initially.
  // A robust app waits for auth init.
  // For this scope: 
  if (!auth.isAuthenticated && !auth.loading) {
    return navigateTo('/booking-rules')
  }
  // If loading, we might show a loader? 
  // For now simple check.
})
