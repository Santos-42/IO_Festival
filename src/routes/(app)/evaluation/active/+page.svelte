<svelte:head>
  <title>Evaluasi | Skill Leap</title>
</svelte:head>

<script lang="ts">
  import { ArrowLeft, ClipboardList, Send, Loader2, CheckCircle2, XCircle, RotateCcw, AlertCircle, Sparkles, Clock } from "lucide-svelte";
  import { fade, slide } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import ExamProtection from "$lib/components/ExamProtection.svelte";

  type State = "loading" | "active" | "evaluating" | "result" | "error" | "cooldown";
  let currentState = $state<State>("loading");

  let caseStudy = $state("");
  let question = $state("");
  let userAnswer = $state("");
  let evaluationResult = $state<any>(null);
  let errorMsg = $state("");
  let evaluationCooldown = $state(0);

  let cooldownInterval: ReturnType<typeof setInterval>;

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function startCooldown(seconds: number) {
    evaluationCooldown = seconds;
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
      evaluationCooldown--;
      if (evaluationCooldown <= 0) {
        clearInterval(cooldownInterval);
        evaluationCooldown = 0;
        currentState = "active";
        initEvaluation();
      }
    }, 1000);
  }

  async function initEvaluation() {
    currentState = "loading";
    errorMsg = "";

    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "generate"
        })
      });

      if (res.status === 429) {
        const errData = await res.json();
        errorMsg = "Evaluasi sedang cooldown";
        startCooldown(errData.cooldown_remaining || 120);
        currentState = "cooldown";
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Gagal mengambil soal dari AI");
      }

      const data = await res.json();
      caseStudy = data.caseStudy || "";
      question = data.question || "";
      currentState = "active";
    } catch (err: any) {
      errorMsg = err.message;
      currentState = "error";
    }
  }

  async function submitEvaluation() {
    if (!userAnswer.trim()) return;

    currentState = "evaluating";
    errorMsg = "";

    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "evaluate",
          caseStudy,
          question,
          answer: userAnswer
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal melakukan evaluasi");
      }

      evaluationResult = await res.json();
      currentState = "result";
    } catch (err: any) {
      errorMsg = err.message;
      currentState = "active";
    }
  }

  function goBack() {
    if (cooldownInterval) clearInterval(cooldownInterval);
    goto('/evaluation');
  }

  onMount(() => {
    initEvaluation();
    return () => {
      if (cooldownInterval) clearInterval(cooldownInterval);
    };
  });
</script>

<div class="max-w-4xl mx-auto space-y-8 pb-20">
  {#if currentState === "loading"}
    <!-- Loading State -->
    <div class="flex flex-col items-center justify-center py-32 space-y-6" in:fade>
      <div class="relative">
        <div class="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center text-blue-600">
          <Sparkles size={32} class="animate-pulse" />
        </div>
      </div>
      <div class="text-center">
        <h3 class="text-2xl font-black text-gray-800">Menyiapkan Skenario</h3>
        <p class="text-gray-400 font-medium">AI sedang menyusun tantangan untuk Anda...</p>
      </div>
    </div>

  {:else if currentState === "error"}
    <div class="flex flex-col items-center justify-center py-20 space-y-6" in:fade>
      <AlertCircle size={48} class="text-red-400" />
      <p class="text-red-600 font-bold">{errorMsg}</p>
      <button onclick={goBack} class="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">
        Kembali ke Evaluasi
      </button>
    </div>

  {:else if currentState === "cooldown"}
    <div class="flex flex-col items-center justify-center py-32 space-y-6" in:fade>
      <Clock size={48} class="text-amber-500" />
      <div class="text-center">
        <p class="text-2xl font-black text-gray-800">Evaluasi Sedang Cooldown</p>
        <p class="text-gray-500 mt-2">Silakan tunggu sebelum bisa mengambil evaluasi lagi</p>
        <p class="text-5xl font-black text-amber-600 mt-4">{formatTime(evaluationCooldown)}</p>
      </div>
      <button onclick={goBack} class="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all mt-4">
        Kembali ke Evaluasi
      </button>
    </div>

  {:else if currentState === "active"}
    <ExamProtection>
      <div class="space-y-8">
        <!-- Header -->
        <div class="flex items-center justify-between">
        <button
          onclick={goBack}
          class="text-gray-500 hover:text-blue-600 font-bold transition-colors group p-2"
        >
          <ArrowLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div class="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider">
          Evaluasi
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
          <h3 class="text-base font-black leading-relaxed whitespace-pre-wrap">{caseStudy}</h3>
        </div>
      </div>

      <!-- Question & Answer -->
      <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 space-y-6" in:fade>
        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pertanyaan</label>
          <p class="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-wrap">{question}</p>
        </div>

        <div class="space-y-2">
          <label for="answer" class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jawaban Anda</label>
          <textarea
            id="answer"
            bind:value={userAnswer}
            placeholder="Tuliskan solusi atau penjelasan Anda di sini..."
            class="w-full h-64 bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 text-gray-700 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
          ></textarea>
          <div class="flex justify-end">
            <span class="text-xs font-bold text-gray-400">{userAnswer.length} karakter</span>
          </div>
        </div>

        <button
          onclick={submitEvaluation}
          disabled={!userAnswer.trim()}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center space-x-3 group"
        >
          <Send size={20} class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          <span>Submit Jawaban</span>
        </button>

        {#if errorMsg}
          <p class="text-red-500 text-sm font-bold text-center" transition:slide>{errorMsg}</p>
        {/if}
      </div>
      </div>
    </ExamProtection>

  {:else if currentState === "evaluating"}
    <!-- Evaluating State -->
    <div class="flex flex-col items-center justify-center py-32 space-y-6" in:fade>
      <div class="relative">
        <div class="w-24 h-24 border-4 border-gray-100 border-t-green-500 rounded-full animate-spin"></div>
      </div>
      <div class="text-center">
        <h3 class="text-2xl font-black text-gray-800">Mengevaluasi Jawaban</h3>
        <p class="text-gray-400 font-medium">AI sedang menganalisis solusi Anda...</p>
      </div>
    </div>

  {:else if currentState === "result"}
    <!-- Result State -->
    <div class="max-w-4xl mx-auto space-y-8" in:fade>
      <div class="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-blue-50/50 flex flex-col items-center text-center space-y-6">
        <div class="relative">
          <div class="w-24 h-24 rounded-full border-4 border-gray-50 flex items-center justify-center">
            <span class="text-3xl font-black text-blue-600">{evaluationResult.score}</span>
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md
            {evaluationResult.decision === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
            {evaluationResult.decision}
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-base font-black text-gray-800">Evaluasi Selesai!</h3>
          <p class="text-sm text-gray-500 italic max-w-lg">"{evaluationResult.feedback}"</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div class="bg-green-50 p-6 rounded-[2rem] border border-green-100 text-left">
            <div class="flex items-center space-x-2 text-green-600 mb-3">
              <CheckCircle2 size={18} />
              <span class="text-xs font-black uppercase tracking-widest">Kekuatan</span>
            </div>
            <p class="text-sm text-green-800 leading-relaxed font-medium">{evaluationResult.strengths}</p>
          </div>
          <div class="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-left">
            <div class="flex items-center space-x-2 text-red-600 mb-3">
              <XCircle size={18} />
              <span class="text-xs font-black uppercase tracking-widest">Perbaikan</span>
            </div>
            <p class="text-sm text-red-800 leading-relaxed font-medium">{evaluationResult.improvements}</p>
          </div>
        </div>

        <button
          onclick={goBack}
          class="flex items-center space-x-2 text-gray-400 hover:text-blue-600 font-bold transition-colors"
        >
          <RotateCcw size={18} />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>
    </div>
  {/if}
</div>
