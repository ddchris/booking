// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: '專注理髮預約 | Focus Hair Design',
      meta: [
        { name: 'description', content: '台中專業理髮服務，線上預約系統。專注剪髮、修容，為您打造完美造型。' },
        { property: 'og:title', content: '專注理髮預約 | Focus Hair Design' },
        { property: 'og:description', content: '台中專業理髮服務，線上預約系統。專注剪髮、修容，為您打造完美造型。' },
        { property: 'og:image', content: 'https://anti-gravity-two.vercel.app/og-image.png' }, // Assuming this exists or will be provided
        { property: 'og:url', content: 'https://anti-gravity-two.vercel.app/' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Focus Hair Design' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

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
