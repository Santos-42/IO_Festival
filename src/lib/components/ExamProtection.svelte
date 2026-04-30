<script lang="ts">
  import { Lock } from "lucide-svelte";
  import { fade } from "svelte/transition";

  let { children } = $props();
  let isBlurred = $state(false);

  $effect(() => {
    function handleVisibility() {
      isBlurred = document.hidden;
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  });
</script>

<div class="relative select-none" oncopy={(e) => e.preventDefault()} oncut={(e) => e.preventDefault()} oncontextmenu={(e) => e.preventDefault()}>
  {@render children()}

  {#if isBlurred}
    <div class="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex items-center justify-center" transition:fade>
      <div class="text-center space-y-4 p-10">
        <Lock size={48} class="text-gray-400 mx-auto" />
        <p class="text-xl font-black text-gray-600">Jangan berpindah tab</p>
        <p class="text-gray-400 text-sm">Kembali ke tab ini untuk melanjutkan pengerjaan</p>
      </div>
    </div>
  {/if}
</div>
