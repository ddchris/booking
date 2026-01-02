// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: '專注理髮預約 | Focus Hair Design',
      meta: [
        { name: 'description', content: '台北內湖專業理髮服務，線上預約系統。專注剪髮、修容，為您打造完美造型。' },
        { property: 'og:title', content: '專注理髮預約 | Focus Hair Design' },
        { property: 'og:description', content: '台北內湖專業理髮服務，線上預約系統。專注剪髮、修容，為您打造完美造型。' },
        { property: 'og:image', content: 'https://anti-gravity-two.vercel.app/og-image.png' }, // Assuming this exists or will be provided
        { property: 'og:url', content: 'https://anti-gravity-two.vercel.app/' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Focus Hair Design' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@element-plus/nuxt',
  ],
  css: ['@unocss/reset/tailwind.css', 'element-plus/theme-chalk/dark/css-vars.css'],
  compatibilityDate: '2024-04-03',
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; frame-src 'self' https: http:;"
      }
    }
  },

  runtimeConfig: {
    public: {
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      }
    }
  }
})
