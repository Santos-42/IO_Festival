<script>
  import Sidebar from "$lib/components/Sidebar.svelte";
  import "../../app.css";

  let { data } = $props();
</script>

<div class="flex min-h-screen bg-[#F4F7FA] font-sans">
  <Sidebar user={data.user} />

  <main class="flex-1 p-10 overflow-y-auto">
    <slot />
  </main>
</div>
