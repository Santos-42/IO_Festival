<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import {
    ClipboardList,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Lock,
    BarChart,
    ArrowRight,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";

  let { data } = $props();

  // Pagination
  const ITEMS_PER_PAGE = 5;
  let currentPage = $state(1);
  const totalPages = $derived(
    Math.max(
      1,
      Math.ceil((data.pastEvaluations?.length || 0) / ITEMS_PER_PAGE),
    ),
  );
  const paginatedEvaluations = $derived(
    (data.pastEvaluations || []).slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    ),
  );
</script>

<svelte:head>
  <title>Evaluation | Skill Leap</title>
</svelte:head>

<div class="space-y-8 pb-20 mx-3">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-base font-black text-blue-600">Evaluation</h2>
      <p class="text-gray-500 text-sm mt-1">
        Uji pemahaman Anda dengan studi kasus nyata berbasis AI
      </p>
    </div>
  </div>

  {#if data.activeRole && !data.roadmapCompleted}
    <!-- Incomplete Roadmap Message -->
    <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-amber-50/50 flex flex-col items-center text-center space-y-6" in:fade>
      <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
        <Lock size={36} class="text-amber-500" />
      </div>
      <div class="space-y-3">
        <h3 class="text-2xl font-black text-gray-800">Roadmap Belum Selesai</h3>
        <p class="text-gray-500 max-w-md leading-relaxed">
          Evaluasi hanya bisa diakses setelah kamu menyelesaikan seluruh materi dan kuis di roadmap 
          <span class="text-blue-600 font-bold">{data.activeRole.role_name}</span> hingga <strong>100%</strong>.
        </p>
      </div>

      {#if data.progress}
        <div class="w-full max-w-md space-y-3">
          <div class="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Progress Saat Ini</span>
            <span>{data.progress.percentage}%</span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-600 rounded-full transition-all duration-700"
              style="width: {data.progress.percentage}%"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-400">
            <span>{data.progress.completedCheckpoints + data.progress.completedQuizzes} dari {data.progress.totalMaterials + data.progress.totalQuizzes} selesai</span>
            <span class="text-blue-600 font-bold">{data.progress.totalMaterials + data.progress.totalQuizzes - data.progress.completedCheckpoints - data.progress.completedQuizzes} tersisa</span>
          </div>
        </div>
      {/if}

      <a
        href="/roadmap"
        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-blue-200 flex items-center space-x-2"
      >
        <BarChart size={20} />
        <span>Lanjutkan Roadmap</span>
      </a>
    </div>

    <!-- Past Evaluations (tetap tampil jika ada) -->
    {#if data.pastEvaluations.length > 0}
      <div class="space-y-4 mt-8">
        <h4 class="text-sm font-black text-gray-800 ml-2">Riwayat Evaluasi Sebelumnya</h4>
        <div class="grid grid-cols-1 gap-4">
          {#each paginatedEvaluations as eval_item}
            <a href="/evaluation/review/{eval_item.id}" class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
                  {eval_item.score >= 70 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                  {eval_item.score}
                </div>
                <div>
                  <p class="font-bold text-gray-800">{eval_item.questions}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {new Date(eval_item.created_at).toLocaleDateString()} • {eval_item.feedback_json.decision}
                  </p>
                </div>
              </div>
              <span class="text-blue-600 text-xs font-bold hover:underline shrink-0 flex items-center gap-1">Review <ArrowRight size={12} /></span>
            </a>
          {/each}
        </div>

        {#if totalPages > 1}
          <div class="flex items-center justify-center gap-1.5 mt-6">
            <button
              onclick={() => currentPage = Math.max(1, currentPage - 1)}
              disabled={currentPage === 1}
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                {currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}"
            >
              ←
            </button>
            {#each Array(totalPages) as _, i}
              <button
                onclick={() => currentPage = i + 1}
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                  {currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}"
              >
                {i + 1}
              </button>
            {/each}
            <button
              onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
              disabled={currentPage === totalPages}
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                {currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}"
            >
              →
            </button>
          </div>
        {/if}
      </div>
    {/if}

  {:else}
    <!-- Idle State -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-2 space-y-6">
        <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 relative overflow-hidden" in:fade>
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          
          <div class="relative space-y-6">
            <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ClipboardList class="text-white" size={32} />
            </div>
            
            <div>
              <h3 class="text-base font-black text-gray-800 mb-2">Siap untuk diuji?</h3>
              <p class="text-gray-500 text-sm leading-relaxed">
                Kami akan menyiapkan sebuah <strong>Mini Case Study</strong> yang dirancang khusus untuk posisi 
                <span class="text-blue-600 font-bold">{data.activeRole?.role_name || "???"}</span> 
                berdasarkan materi yang telah Anda pelajari.
              </p>
            </div>

            {#if data.activeRole}
              <button 
                onclick={() => goto('/evaluation/active')}
                class="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-blue-100 flex items-center justify-center space-x-3 group"
              >
                <Sparkles size={20} />
                <span>Mulai Evaluasi Sekarang</span>
              </button>
            {:else}
              <div class="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                <AlertCircle size={20} />
                <p class="text-sm font-bold">Pilih roadmap aktif terlebih dahulu di halaman Roadmap.</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- History Section -->
        <div class="space-y-4">
          <h4 class="text-sm font-black text-gray-800 ml-2">Riwayat Evaluasi</h4>
          {#if data.pastEvaluations.length === 0}
            <div class="bg-gray-50 rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
              <p class="text-gray-400 font-bold italic">Belum ada riwayat evaluasi.</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 gap-4">
              {#each paginatedEvaluations as eval_item}
                <a href="/evaluation/review/{eval_item.id}" class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
                      {eval_item.score >= 70 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                      {eval_item.score}
                    </div>
                    <div>
                      <p class="font-bold text-gray-800">{eval_item.questions}</p>
                      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {new Date(eval_item.created_at).toLocaleDateString()} • {eval_item.feedback_json.decision}
                      </p>
                    </div>
                  </div>
                  <span class="text-blue-600 text-xs font-bold hover:underline shrink-0 flex items-center gap-1">Review <ArrowRight size={12} /></span>
                </a>
              {/each}
            </div>

            {#if totalPages > 1}
              <div class="flex items-center justify-center gap-1.5 mt-6">
                <button
                  onclick={() => currentPage = Math.max(1, currentPage - 1)}
                  disabled={currentPage === 1}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                    {currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}"
                >
                  ←
                </button>
                {#each Array(totalPages) as _, i}
                  <button
                    onclick={() => currentPage = i + 1}
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                      {currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}"
                  >
                    {i + 1}
                  </button>
                {/each}
                <button
                  onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                    {currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}"
                >
                  →
                </button>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <div class="md:col-span-1">
        <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 sticky top-8">
          <h4 class="text-sm font-black mb-4">Tips Evaluasi</h4>
          <ul class="space-y-4 text-sm opacity-90">
            <li class="flex items-start space-x-3">
              <div class="mt-1"><CheckCircle2 size={16} /></div>
              <p>Bacalah skenario dengan teliti sebelum menjawab.</p>
            </li>
            <li class="flex items-start space-x-3">
              <div class="mt-1"><CheckCircle2 size={16} /></div>
              <p>Fokus pada solusi praktis dan efisien.</p>
            </li>
            <li class="flex items-start space-x-3">
              <div class="mt-1"><CheckCircle2 size={16} /></div>
              <p>Gunakan istilah teknis yang sesuai dengan role Anda.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>
