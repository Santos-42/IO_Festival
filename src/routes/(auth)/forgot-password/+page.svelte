<script lang="ts">
  import { MoveLeft, Mail, Lock, Eye, Loader2, AlertCircle } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import { fade } from "svelte/transition";

  let { form } = $props();
  let showPassword = $state(false);
  let showConfirm = $state(false);
  let isLoading = $state(false);
</script>

<svelte:head>
  <title>Forgot Password | Skill Leap</title>
</svelte:head>

<div
  class="grid grid-cols-1 md:grid-cols-2 h-screen bg-white overflow-hidden relative"
>
  <!-- Back Button -->
  <a
    href="/login"
    class="absolute top-6 left-6 md:top-8 md:left-8 p-2 text-gray-400 hover:text-gray-900 transition-all z-50 bg-white/50 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm"
  >
    <MoveLeft size={20} />
  </a>

  <!-- Left Column: Visual Content -->
  <div
    class="hidden md:flex flex-col justify-center items-center relative z-20 overflow-hidden"
  >
    <img src="/login.png" alt="Forgot Password" class="w-full h-full object-cover" />
  </div>

  <!-- Right Column: Form Area -->
  <div
    class="relative flex flex-col justify-center items-center bg-[#F4F7FA] p-4 md:p-8 lg:p-12 shadow-[inset_16px_0_32px_-16px_rgba(0,0,0,0.08)] overflow-y-auto"
  >
    <div
      class="w-full max-w-[440px] bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] border border-white my-auto"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-[28px] font-bold text-[#111827] mb-1 tracking-tight">
          Forgot Password
        </h2>
        <p class="text-[#9CA3AF] text-sm font-medium">
          Masukkan email dan password baru Anda
        </p>
      </div>

      <div class="h-[68px] mb-2 flex items-center">
        {#if form?.error}
          <div
            transition:fade
            class="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium"
          >
            <AlertCircle size={18} />
            {form.error}
          </div>
        {/if}
      </div>

      <!-- Form -->
      <form
        method="POST"
        use:enhance={() => {
          isLoading = true;
          return async ({ update }) => {
            isLoading = false;
            await update();
          };
        }}
        class="space-y-5"
      >
        <!-- Email Field -->
        <div class="space-y-1.5">
          <label for="email" class="block text-[13px] font-bold text-[#374151] ml-1"
            >Email</label
          >
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]"
            >
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              class="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#3D5AFE]/5 focus:border-[#3D5AFE]/50 transition-all text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
              placeholder="xxx@email.com"
              required
            />
          </div>
        </div>

        <!-- New Password Field -->
        <div class="space-y-1.5">
          <label
            for="password"
            class="block text-[13px] font-bold text-[#374151] ml-1">Password Baru</label
          >
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]"
            >
              <Lock size={20} strokeWidth={1.5} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              class="w-full pl-12 pr-12 py-3 bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#3D5AFE]/5 focus:border-[#3D5AFE]/50 transition-all text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <Eye size={20} strokeWidth={1.5} />
            </button>
          </div>
          <p class="text-[11px] text-[#9CA3AF] ml-1 mt-1">
            Minimal 6 karakter, 1 huruf besar, dan 1 huruf kecil
          </p>
        </div>

        <!-- Confirm Password Field -->
        <div class="space-y-1.5">
          <label
            for="confirm"
            class="block text-[13px] font-bold text-[#374151] ml-1"
            >Konfirmasi Password Baru</label
          >
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]"
            >
              <Lock size={20} strokeWidth={1.5} />
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              id="confirm"
              name="confirm"
              class="w-full pl-12 pr-12 py-3 bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#3D5AFE]/5 focus:border-[#3D5AFE]/50 transition-all text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onclick={() => (showConfirm = !showConfirm)}
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <Eye size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            class="w-full py-3.5 px-4 bg-[#3D5AFE] hover:bg-[#304FFE] text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg shadow-[#3D5AFE]/10 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {#if isLoading}
              <Loader2 size={20} class="animate-spin" />
              Processing...
            {:else}
              Reset Password
            {/if}
          </button>
        </div>
      </form>

      <!-- Footer -->
      <div class="mt-8 text-center text-[12px] font-medium text-[#6B7280]">
        Ingat password? <a
          href="/login"
          class="text-[#3D5AFE] hover:underline font-bold inline-flex items-center ml-1"
          >Log in <span class="ml-1 text-sm">→</span></a
        >
      </div>
    </div>
  </div>
</div>
