<script lang="ts">
  import AIChat from "$lib/components/AIChat.svelte";
  import { onMount } from "svelte";
  import { Sparkles, ArrowRight, BookOpen, Compass } from "lucide-svelte";
  import { fade, slide, scale } from "svelte/transition";

  let { data } = $props();
  let chatOpen = $state(false);

  onMount(() => {
    if (!data.hasRole) {
      // Auto open chat if user has no role
      setTimeout(() => {
        chatOpen = true;
      }, 1000);
    }
  });
</script>

<div class="space-y-8">
  <h2 class="text-4xl font-bold text-blue-600">Roadmap</h2>

  {#if !data.hasRole}
    <!-- Invitation State -->
    <div
      transition:fade
      class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-50/50 flex flex-col items-center justify-center text-center w-full min-h-[calc(100vh-12rem)] mt-2 relative overflow-hidden"
    >
      <!-- Decorative Background Elements -->
      <div
        class="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50"
      ></div>
      <div
        class="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50"
      ></div>

      <div
        class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200 rotate-3"
      >
        <Compass class="text-white" size={32} />
      </div>

      <h3 class="text-2xl font-bold text-gray-800 mb-3 leading-tight">
        Mulai Perjalanan <span class="text-blue-600">Skill Leap</span> Anda!
      </h3>

      <p class="text-gray-500 text-base max-w-md mb-6 leading-relaxed">
        Pilih skill yang ingin kamu pelajari. Diskusikan dengan AI Assistant
        kami untuk menemukan roadmap yang tepat dan terpersonalisasi untukmu.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
        <div
          class="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col items-center"
        >
          <div
            class="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm"
          >
            <Sparkles class="text-blue-500" size={30} />
          </div>
          <span class="font-bold text-gray-800 text-s">AI Powered</span>
        </div>
        <div
          class="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col items-center"
        >
          <div
            class="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm"
          >
            <BookOpen class="text-blue-500" size={30} />
          </div>
          <span class="font-bold text-gray-800 text-s">Structured</span>
        </div>
        <div
          class="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col items-center"
        >
          <div
            class="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm"
          >
            <ArrowRight class="text-blue-500" size={30} />
          </div>
          <span class="font-bold text-gray-800 text-s">Fast Growth</span>
        </div>
      </div>

      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-base transition-all shadow-xl shadow-blue-200 flex items-center space-x-2 transform hover:scale-105 active:scale-95"
        onclick={() => (chatOpen = true)}
      >
        <Sparkles size={20} />
        <span>Diskusi dengan AI Mentor</span>
      </button>

      <p
        class="mt-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest"
      >
        AI Mentor akan membantu menentukan kurikulum terbaik untukmu
      </p>
    </div>
  {:else}
    <!-- Roadmap Content -->
    <div
      class="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 min-h-[500px] flex flex-col items-center justify-center p-10"
    >
      <div
        class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6"
      >
        <BookOpen class="text-blue-600" size={32} />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 mb-2">Roadmap Aktif</h3>
      <p class="text-gray-400 max-w-md text-center">
        Konten roadmap detail sedang dikembangkan. Gunakan AI Chat untuk
        sementara untuk panduan belajar.
      </p>
    </div>
  {/if}
</div>

<AIChat bind:isOpen={chatOpen} />
