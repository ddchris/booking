// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@element-plus/nuxt',
  ],
  css: ['@unocss/reset/tailwind.css'],
  compatibilityDate: '2024-04-03',
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; frame-src 'self' https: http:;"
      }
    }
  }
})
