<template>
  <div class="h-full flex flex-col pt-2 overflow-hidden">
    <div class="flex-none flex items-center justify-between px-4 md:px-0 mb-2 md:max-w-5xl md:mx-auto w-full">
      <h1 class="text-sm font-bold text-gray-100 pl-4"></h1>
    </div>

    <ClientOnly>
      <Calendar :key="auth.user?.uid" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">

const auth = useAuthStore()

// Page meta
useHead({
  title: '預約時段 | 專注理髮設計'
})
</script>
