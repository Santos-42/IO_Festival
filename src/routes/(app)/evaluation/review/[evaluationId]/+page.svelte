<script lang="ts">
  import { ArrowLeft, ClipboardList, CheckCircle2, XCircle } from "lucide-svelte";
  import { fade } from "svelte/transition";

  let { data } = $props();
</script>

<div class="max-w-4xl mx-auto space-y-8 pb-20">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <a
      href="/evaluation"
      class="flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-bold transition-colors group"
    >
      <ArrowLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
      <span>Kembali ke Evaluasi</span>
    </a>
    <div class="flex items-center space-x-3">
      <span class="text-sm text-gray-400 font-bold">
        {new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
    </div>
  </div>

  <!-- Case Study Card -->
  <div class="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden" in:fade>
    <div class="absolute top-4 right-4 opacity-10">
      <ClipboardList size={120} />
    </div>
    <div class="relative space-y-4">
      <div class="flex items-center space-x-2 text-blue-100 text-[10px] font-black uppercase tracking-widest">
        <ClipboardList size={14} />
        <span>Mini Case Study</span>
      </div>
      <h3 class="text-base font-black leading-relaxed whitespace-pre-wrap">{data.caseStudy}</h3>
    </div>
  </div>

  <!-- Question & Answer -->
  <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 space-y-6" in:fade>
    <div>
      <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pertanyaan</label>
      <p class="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-wrap">{data.question}</p>
    </div>

    <div>
      <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jawaban Anda</label>
      <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <p class="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{data.userAnswer}</p>
      </div>
    </div>
  </div>

  <!-- Score & Decision -->
  <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50" in:fade>
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 rounded-full border-4 border-gray-50 flex items-center justify-center">
          <span class="text-2xl font-black text-blue-600">{data.score}</span>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Skor</p>
          <div class="flex items-center space-x-2 mt-1">
            {#if data.decision === 'PASS'}
              <CheckCircle2 size={18} class="text-green-500" />
              <span class="font-black text-green-600">LULUS</span>
            {:else}
              <XCircle size={18} class="text-red-500" />
              <span class="font-black text-red-600">GAGAL</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Feedback -->
  {#if data.feedback}
    <div class="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100" in:fade>
      <h4 class="text-sm font-black text-gray-800 mb-3">Feedback</h4>
      <p class="text-gray-600 leading-relaxed italic">"{data.feedback}"</p>
    </div>
  {/if}

  <!-- Strengths & Improvements -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4" in:fade>
    <div class="bg-green-50 p-6 rounded-[2rem] border border-green-100">
      <div class="flex items-center space-x-2 text-green-600 mb-3">
        <CheckCircle2 size={18} />
        <span class="text-xs font-black uppercase tracking-widest">Kekuatan</span>
      </div>
      <p class="text-sm text-green-800 leading-relaxed font-medium">{data.strengths}</p>
    </div>
    <div class="bg-red-50 p-6 rounded-[2rem] border border-red-100">
      <div class="flex items-center space-x-2 text-red-600 mb-3">
        <XCircle size={18} />
        <span class="text-xs font-black uppercase tracking-widest">Perbaikan</span>
      </div>
      <p class="text-sm text-red-800 leading-relaxed font-medium">{data.improvements}</p>
    </div>
  </div>
</div>
