<template>
  <div class="space-y-4 md:space-y-6 animate-fade-in-up h-full flex flex-col pt-4 sm:pt-6 overflow-y-auto">
    <!-- Header Section -->
    <div class="text-center py-2 md:py-4 border-b border-gray-200 dark:border-gray-800 relative max-w-2xl mx-auto flex-none">
       <h1 class="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-700 dark:from-amber-200 dark:to-amber-500 mb-2 tracking-wide">
         📜 預約制度與規範 ✨
       </h1>
       <p class="px-4 text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed">
         為了維護每位顧客的服務品質，請您詳閱以下預約說明。<br class="hidden sm:block"/>
         期待為您打造專屬的完美造型 💇‍♀️
       </p>
       <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-amber-500 rounded-t-full"></div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto px-4 flex-1 items-start pb-8">
      
      <!-- 1. Booking Policy -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <div class="flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
          <div class="flex-none p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl text-2xl md:text-3xl ring-1 ring-blue-100 dark:ring-blue-500/20">
             📅
          </div>
          <div>
            <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col lg:flex-row items-center gap-2">
              預約須知
              <span class="hidden lg:inline-block text-[10px] font-normal px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10">Booking Policy</span>
            </h2>

            <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed list-none lg:list-disc lg:pl-4">
              <li>☝️ 每個帳號同時僅能保留 <span class="text-red-500 dark:text-red-400 font-bold">1 筆</span> 未來的有效預約。</li>
              <li>🗓️ 開放預約時段為 <span class="text-red-500 dark:text-red-400 font-bold">明日起至未來 30 天</span> 內的時段。</li>
              <li>🔒 系統採實名制預約，<span class="text-red-500 dark:text-red-400 font-bold">其他人不會看到您的個人資料</span>。</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 2. Time & Breaks -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <div class="flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
          <div class="flex-none p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-xl text-2xl md:text-3xl ring-1 ring-amber-100 dark:ring-amber-500/20">
             ⏰
          </div>
          <div>
            <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col lg:flex-row items-center gap-2">
              服務時間與休息
              <span class="hidden lg:inline-block text-[10px] font-normal px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">Business Hours</span>
            </h2>

            <div class="space-y-3 text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed w-full">
              <div class="flex justify-center lg:justify-start gap-4">
                 <span class="text-gray-500 dark:text-gray-400">🕒 營業時間</span>
                 <span class="font-mono text-gray-900 dark:text-white font-medium">10:30 - 21:30</span>
              </div>
              <div class="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-200/80 text-xs text-left">
                 <div class="flex items-center gap-2 mb-1 font-bold text-amber-600 dark:text-amber-500 justify-center lg:justify-start">
                    <span class="text-lg">🍱</span>
                    <span>休息時段不提供預約</span>
                 </div>
                 <ul class="space-y-1 pl-4 list-disc marker:text-amber-400">
                   <li>🍜 中午休息：<span class="font-mono">12:30 - 13:30</span></li>
                   <li>🍗 晚餐休息：<span class="font-mono">18:30 - 19:30</span></li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Cancellation Policy -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <div class="flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
          <div class="flex-none p-3 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl text-2xl md:text-3xl ring-1 ring-red-100 dark:ring-red-500/20">
             🙅
          </div>
          <div>
            <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col lg:flex-row items-center gap-2">
              取消與變更
              <span class="hidden lg:inline-block text-[10px] font-normal px-2 py-0.5 rounded border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10">Cancellation</span>
            </h2>

            <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed list-none lg:list-disc lg:pl-4 mb-3">
              <li>
                1️⃣ 每月僅限 <span class="text-red-500 dark:text-red-400 font-bold">1 次</span> 自行取消額度。
              </li>
              <li>
                ⏳ 距離預約 <span class="text-red-500 dark:text-red-400 font-bold">少於 4 小時</span> 無法取消。
              </li>
              <li>🚨 注意：多次無故未到將暫停預約權限。</li>
              <li class="text-gray-900 dark:text-white">💬 若會晚<span class="text-red-600 dark:text-red-500 font-bold">超過十分鐘</span>到請 LINE 通知店長，謝謝 !</li>

            </ul>
            
            <div class="flex justify-center lg:justify-start">
               <NuxtLink to="/my-bookings" class="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg transition border border-red-200 dark:border-red-500/30 shadow-sm">
                 查看我的預約 📅
               </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
