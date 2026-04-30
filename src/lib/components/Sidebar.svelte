<script lang="ts">
  import { fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import {
    LayoutDashboard,
    GitBranch,
    ClipboardList,
    MessageSquare,
    UserCircle,
    LogOut,
    ChevronLeft,
    ChevronRight,
  } from "lucide-svelte";
  import { sidebar } from "$lib/state/sidebar.svelte";

  let { user } = $props();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", restricted: false },
    { name: "Roadmap", icon: GitBranch, href: "/roadmap", restricted: false },
    { name: "Evaluation", icon: ClipboardList, href: "/evaluation", restricted: true },
    { name: "Interview", icon: MessageSquare, href: "/interview", restricted: true },
  ];

  function handleNav(e: MouseEvent, item: typeof menuItems[0]) {
    if (item.restricted && !user?.hasActiveRoadmap) {
      e.preventDefault();
      goto('/roadmap');
    }
  }

  let activePath = $derived($page.url.pathname);

  // Logic for display name (first 2 words)
  let displayName = $derived.by(() => {
    if (!user?.name) return "User";
    const words = user.name.trim().split(/\s+/);
    if (words.length <= 2) return user.name;
    return words.slice(0, 2).join(" ");
  });

  // Initials for collapsed state
  let initials = $derived.by(() => {
    if (!user?.name) return "U";
    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join("");
  });
</script>

<aside
  class="bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-300 relative {sidebar.isCollapsed ? 'w-24' : 'w-64'}"
>
  <!-- Toggle Button -->
  <button
    onclick={() => sidebar.isCollapsed = !sidebar.isCollapsed}
    class="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors z-50 cursor-pointer"
  >
    {#if sidebar.isCollapsed}
      <ChevronRight size={16} />
    {:else}
      <ChevronLeft size={16} />
    {/if}
  </button>

  <div class="p-6 flex items-center justify-center h-20 transition-all">
    {#if sidebar.isCollapsed}
      <img src="/SmallLogo.png" alt="Skill Leap" class="h-10 w-auto" in:fade={{ duration: 200, delay: 100 }} />
    {:else}
      <img src="/BigLogo.png" alt="Skill Leap" class="h-10 w-auto" in:fade={{ duration: 200, delay: 100 }} />
    {/if}
  </div>

  <nav class="flex-1 px-4 py-2 space-y-2 overflow-hidden">
    {#each menuItems as item}
      {@const Icon = item.icon}
      <a
        href={item.href}
        onclick={(e) => handleNav(e, item)}
        class="flex items-center py-3 rounded-2xl transition-all duration-200 {sidebar.isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} {activePath ===
        item.href
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
          : 'text-gray-500 hover:bg-gray-50'}"
        title={sidebar.isCollapsed ? item.name : ''}
      >
        <Icon size={20} class="shrink-0" />
        {#if !sidebar.isCollapsed}
          <span class="font-medium whitespace-nowrap" in:fade={{ duration: 200, delay: 100 }}>{item.name}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="p-4 border-t border-gray-50 space-y-2 overflow-hidden">
    <div class="flex items-center py-3 bg-blue-50 rounded-2xl transition-all {sidebar.isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'}">
      {#if sidebar.isCollapsed}
        <span class="font-bold text-blue-600 text-sm" in:fade={{ duration: 200, delay: 100 }}>{initials}</span>
      {:else}
        <UserCircle size={24} class="text-gray-400 shrink-0" />
        <span class="font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis" in:fade={{ duration: 200, delay: 100 }}>{displayName}</span>
      {/if}
    </div>
    
    <form method="POST" action="/logout" use:enhance class="w-full">
      <button
        type="submit"
        class="w-full flex items-center py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all {sidebar.isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'}"
        title={sidebar.isCollapsed ? "Log out" : ""}
      >
        <LogOut size={20} class="shrink-0" />
        {#if !sidebar.isCollapsed}
          <span class="font-medium whitespace-nowrap" in:fade={{ duration: 200, delay: 100 }}>Log out</span>
        {/if}
      </button>
    </form>
  </div>
</aside>
