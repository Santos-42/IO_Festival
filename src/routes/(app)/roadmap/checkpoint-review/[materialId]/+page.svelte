<svelte:head>
  <title>Checkpoint Review | {data.materialTitle} | Skill Leap</title>
</svelte:head>

<script lang="ts">
  import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";

  let { data } = $props();
</script>

<div class="max-w-3xl mx-auto space-y-8 pb-20">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <a
      href="/roadmap/{data.materialId}"
      class="flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-bold transition-colors group"
    >
      <ArrowLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
      <span>Kembali ke Materi</span>
    </a>
    <div class="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-wider">
      Checkpoint Review
    </div>
  </div>

  <!-- Material Title -->
  <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50" in:fade>
    <h2 class="text-xl font-black text-gray-800">{data.materialTitle}</h2>
    <p class="text-sm text-gray-500 mt-2">Riwayat Micro-Checkpoint</p>
  </div>

  <!-- Attempts List -->
  {#if data.attempts.length === 0}
    <div class="bg-gray-50 rounded-[2.5rem] p-12 text-center border border-dashed border-gray-200" in:fade>
      <p class="text-gray-400 font-bold">Belum ada riwayat checkpoint</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each data.attempts as attempt, i}
        <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 space-y-4" transition:fly={{ y: 20, delay: i * 50 }}>
          <!-- Status Badge -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-bold">
              {new Date(attempt.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div class="px-3 py-1 rounded-full text-xs font-black uppercase
              {attempt.status === 'passed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
              {attempt.status === 'passed' ? 'LULUS' : 'GAGAL'}
            </div>
          </div>

          <!-- Question -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pertanyaan</label>
            <p class="text-gray-700 font-bold leading-relaxed">{attempt.question}</p>
          </div>

          <!-- User Answer -->
          {#if attempt.userAnswer}
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jawaban Anda</label>
              <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p class="text-gray-600 font-medium leading-relaxed">{attempt.userAnswer}</p>
              </div>
            </div>
          {/if}

          <!-- Answer Key (only show for review context) -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kunci Jawaban</label>
            <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p class="text-blue-700 font-medium leading-relaxed">{attempt.answerKey}</p>
            </div>
          </div>

          <!-- Hint (if failed) -->
          {#if attempt.hint}
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div class="flex items-center space-x-2 text-amber-600 mb-1">
                <XCircle size={16} />
                <span class="text-xs font-black uppercase tracking-widest">Feedback</span>
              </div>
              <p class="text-amber-700 text-sm">{attempt.hint}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
