<script lang="ts">
  import { Lock, CheckCircle, AlertTriangle, Loader2, Clock } from "lucide-svelte";
  import { fade } from "svelte/transition";

  let { materialId, onPass } = $props<{ materialId: string; onPass: () => void }>();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let checkpointId = $state<string | null>(null);
  let question = $state<string | null>(null);
  let hint = $state<string | null>(null);
  let passed = $state(false);
  let cooldown = $state(0);
  let answer = $state('');
  let verifying = $state(false);
  let resultMessage = $state<string | null>(null);

  let cooldownInterval: ReturnType<typeof setInterval>;

  async function initCheckpoint() {
    loading = true;
    error = null;

    try {
      const res = await fetch('/api/checkpoint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId })
      });

      const data = await res.json();

      if (data.alreadyPassed) {
        passed = true;
        loading = false;
        onPass();
        return;
      }

      if (!res.ok) {
        if (res.status === 429) {
          cooldown = data.cooldown_remaining || 60;
          hint = data.hint || null;
          startCooldown();
          loading = false;
          return;
        }
        error = data.error || 'Gagal memuat checkpoint';
        loading = false;
        return;
      }

      checkpointId = data.checkpointId;
      question = data.question;
      hint = data.hint;
      answer = '';
      loading = false;
    } catch {
      error = 'Gagal menghubungkan server';
      loading = false;
    }
  }

  function startCooldown() {
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
      cooldown--;
      if (cooldown <= 0) {
        clearInterval(cooldownInterval);
        cooldown = 0;
        initCheckpoint();
      }
    }, 1000);
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function verifyAnswer() {
    if (!checkpointId || !answer.trim() || verifying) return;

    verifying = true;
    resultMessage = null;

    try {
      const res = await fetch('/api/checkpoint/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId, answer: answer.trim() })
      });

      const data = await res.json();

      if (data.passed) {
        passed = true;
        resultMessage = data.reason || 'Jawaban benar!';
        onPass();
      } else {
        cooldown = data.cooldownRemaining || 60;
        hint = data.reason || null;
        resultMessage = data.reason;
        startCooldown();
      }

      verifying = false;
    } catch {
      error = 'Gagal memverifikasi jawaban';
      verifying = false;
    }
  }

  $effect(() => {
    initCheckpoint();

    return () => {
      if (cooldownInterval) clearInterval(cooldownInterval);
    };
  });
</script>

<div class="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 space-y-6" in:fade>
  <div class="flex items-center space-x-3">
    <div class="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
      <Lock size={20} class="text-orange-500" />
    </div>
    <div>
      <h3 class="font-black text-gray-800">Micro-Checkpoint</h3>
      <p class="text-sm text-gray-500">Jawab pertanyaan ini untuk melanjutkan ke materi berikutnya</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
      <Loader2 size={20} class="text-blue-500 animate-spin" />
      <span class="text-gray-500 font-bold">Mempersiapkan pertanyaan...</span>
    </div>
  {:else if error}
    <div class="flex items-center space-x-3 p-4 bg-red-50 rounded-2xl">
      <AlertTriangle size={20} class="text-red-500" />
      <span class="text-red-600 font-bold">{error}</span>
      <button onclick={initCheckpoint} class="ml-auto text-red-600 font-bold hover:underline">
        Coba Lagi
      </button>
    </div>
  {:else if passed}
    <div class="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
      <div class="flex items-center space-x-3">
        <CheckCircle size={20} class="text-green-500" />
        <div>
          <span class="text-green-600 font-bold">Checkpoint Lulus!</span>
          {#if resultMessage}
            <p class="text-green-500 text-sm mt-1">{resultMessage}</p>
          {/if}
        </div>
      </div>
      <a href="/roadmap/checkpoint-review/{materialId}" class="text-green-600 text-xs font-bold hover:underline shrink-0">
        Lihat Riwayat
      </a>
    </div>
  {:else if cooldown > 0}
    <div class="space-y-4">
      <div class="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
        <Clock size={20} class="text-amber-600" />
        <div>
          <p class="text-amber-700 font-bold">Cooldown: {formatTime(cooldown)}</p>
          {#if hint}
            <p class="text-amber-600 text-sm mt-1">Hint: {hint}</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      {#if hint}
        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p class="text-blue-700 text-sm font-medium">Hint: {hint}</p>
        </div>
      {/if}

      {#if question}
        <div class="space-y-4">
          <p class="text-gray-700 font-bold leading-relaxed">{question}</p>

          <div class="space-y-3">
            <textarea
              bind:value={answer}
              disabled={verifying}
              rows="3"
              class="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all resize-none font-medium text-gray-700 placeholder-gray-400 outline-none"
              placeholder="Tulis jawaban Anda di sini..."
            ></textarea>

            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">{answer.length} karakter</p>
              <button
                onclick={verifyAnswer}
                disabled={verifying || !answer.trim()}
                class="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold transition-all hover:bg-orange-600
                  disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {#if verifying}
                  <Loader2 size={16} class="animate-spin" />
                  <span>Memeriksa...</span>
                {:else}
                  <span>Verifikasi Jawaban</span>
                {/if}
              </button>
            </div>

            {#if resultMessage}
              <div class="flex items-center space-x-2 p-3 bg-red-50 rounded-2xl">
                <AlertTriangle size={16} class="text-red-500 shrink-0" />
                <span class="text-red-600 text-sm">{resultMessage}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
