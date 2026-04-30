<svelte:head>
  <title>Quiz Review | Skill Leap</title>
</svelte:head>

<script lang="ts">
  import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";

  let { data } = $props();

  const optionLabels = ['A', 'B', 'C', 'D'];
</script>

<div class="max-w-3xl mx-auto space-y-8 pb-20">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <a
      href="/roadmap"
      class="flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-bold transition-colors group"
    >
      <ArrowLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
      <span>Kembali ke Roadmap</span>
    </a>
    <div class="flex items-center space-x-3">
      <span class="text-sm text-gray-400 font-bold">Attempt #{data.currentAttemptIndex} dari {data.totalAttempts}</span>
      <div class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider
        {data.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
        {data.passed ? 'LULUS' : 'GAGAL'}
      </div>
    </div>
  </div>

  <!-- Prev/Next Navigation -->
  <div class="flex items-center justify-between gap-4">
    {#if data.prevAttempt}
      <a
        href="/roadmap/{data.moduleId}/quiz/review/{data.prevAttempt.id}"
        class="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all"
      >
        <ArrowLeft size={18} />
        <div>
          <p class="text-[10px] uppercase tracking-widest opacity-50">Sebelumnya</p>
          <p class="text-sm">Attempt #{data.prevAttempt.attemptNumber} {data.prevAttempt.passed ? '✅' : '❌'}</p>
        </div>
      </a>
    {:else}
      <div></div>
    {/if}

    {#if data.nextAttempt}
      <a
        href="/roadmap/{data.moduleId}/quiz/review/{data.nextAttempt.id}"
        class="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all"
      >
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-widest opacity-50">Selanjutnya</p>
          <p class="text-sm">Attempt #{data.nextAttempt.attemptNumber} {data.nextAttempt.passed ? '✅' : '❌'}</p>
        </div>
        <ArrowRight size={18} />
      </a>
    {:else}
      <div></div>
    {/if}
  </div>

  <!-- Score Card -->
  <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50" in:fade>
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-gray-800">Review Quiz</h2>
        <p class="text-sm text-gray-500">
          {new Date(data.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div class="text-center">
        <p class="text-sm text-gray-400">Skor</p>
        <p class="text-4xl font-black {data.passed ? 'text-green-600' : 'text-red-500'}">{data.score}/100</p>
        <p class="text-xs text-gray-400">{data.correctCount} dari {data.totalQuestions} benar</p>
      </div>
    </div>
  </div>

  <!-- Questions List -->
  <div class="space-y-6">
    {#each data.questions as q, i}
      <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 space-y-6" transition:fly={{ y: 20, delay: i * 50 }}>
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0
            {q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}">
            {#if q.isCorrect}
              <CheckCircle2 size={20} />
            {:else}
              <XCircle size={20} />
            {/if}
          </div>
          <div>
            <span class="text-xs text-gray-400 font-bold">Soal {i + 1}</span>
            <h3 class="text-lg font-bold text-gray-800 leading-relaxed">{q.question}</h3>
          </div>
        </div>

        <div class="space-y-3 pl-13">
          {#each q.options as opt, j}
            <div class="p-4 rounded-2xl border-2 font-bold text-sm
              {j === q.correctIndex
                ? 'border-green-500 bg-green-50 text-green-700'
                : j === q.userAnswer && !q.isCorrect
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500'}
            ">
              <div class="flex items-center justify-between">
                <span>{opt}</span>
                {#if j === q.correctIndex}
                  <CheckCircle2 size={16} class="text-green-500" />
                {:else if j === q.userAnswer && !q.isCorrect}
                  <XCircle size={16} class="text-red-500" />
                {/if}
              </div>
            </div>
          {/each}

          {#if !q.isCorrect}
            <div class="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <p class="text-blue-700 text-sm font-bold">
                Jawaban benar: {optionLabels[q.correctIndex]}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
