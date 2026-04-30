<svelte:head>
  <title>Dashboard | Skill Leap</title>
</svelte:head>

<script lang="ts">
  import { sidebar } from "$lib/state/sidebar.svelte";
  import AIChat from "$lib/components/AIChat.svelte";
  import { ChevronRight, BarChart, Award, Search, Plus, Star, TrendingUp, ExternalLink, Crown, Zap, Sprout, ArrowRight } from "lucide-svelte";
  import { SiGoogle } from "@icons-pack/svelte-simple-icons";
  import { fade, slide } from "svelte/transition";

  let { data } = $props();

  let showAllEvaluations = $state(false);

  const hasRoadmaps = $derived(
    data.roadmapProgress && data.roadmapProgress.length > 0,
  );
  const mainEvaluations = $derived(
    showAllEvaluations ? data.evaluations : data.evaluations.slice(0, 1),
  );

  const levelColor = $derived(
    data.level === 'Professional' ? 'from-emerald-500 to-emerald-700 shadow-emerald-200' :
    data.level === 'Intermediate' ? 'from-blue-500 to-blue-700 shadow-blue-200' :
    'from-amber-500 to-amber-600 shadow-amber-200'
  );

  const levelBadge = $derived(
    data.level === 'Professional' ? 'bg-emerald-100 text-emerald-700' :
    data.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
    'bg-amber-100 text-amber-700'
  );

  const levelBadgeText = $derived(
    data.level === 'Professional' ? 'PROFESSIONAL' :
    data.level === 'Intermediate' ? 'INTERMEDIATE' :
    'BEGINNER'
  );

  function parseFeedback(raw: string): string {
    try {
      const parsed = JSON.parse(raw);
      return parsed.feedback || parsed.strengths || Object.values(parsed).join(', ');
    } catch {
      return raw;
    }
  }
</script>

<div class="space-y-10">
  <!-- Welcome Header -->
  <div class="flex justify-between items-end">
    <div>
      <h2 class="text-4xl font-bold text-blue-600">Dashboard</h2>
      <p class="text-gray-500 mt-2">
        Selamat datang kembali, <span class="text-blue-600 font-semibold"
          >{data.user?.name}</span
        >. Mari lanjutkan Skill Leap Anda!
      </p>
    </div>
  </div>

  {#if !hasRoadmaps}
    <!-- Empty State (No Roadmap) -->
    <div
      transition:fade
      class="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 min-h-[400px] flex flex-col items-center justify-center p-10 text-center"
    >
      <div
        class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6"
      >
        <Search class="text-blue-600" size={32} />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 mb-3">
        Your Skill Leap is Quiet...
      </h3>
      <p class="text-gray-500 max-w-md mb-8">
        Anda belum memiliki roadmap aktif. Mulailah perjalanan belajar Anda
        dengan membuat roadmap pertama bersama AI Mentor kami.
      </p>

      <a
        href="/roadmap"
        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
      >
        <Plus size={20} />
        <span>Create First Course</span>
      </a>
    </div>
  {:else}
    <!-- Content State (Has Roadmap) -->
    <div
      class="flex flex-col gap-8"
    >
      <!-- Top Row: Roadmap Progress + Level (side by side) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Roadmap Progress Section -->
        <section
          class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col h-full"
        >
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart size={24} />
              </div>
              <h3 class="text-xl font-bold text-gray-800">Roadmap Progress</h3>
            </div>
            <span
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full"
              >{data.roadmapProgress.length} Roadmap Aktif</span
            >
          </div>

          <div class="space-y-6 flex-1">
            {#each data.roadmapProgress as roadmap}
              {@const total = roadmap.total_materials + roadmap.total_quizzes}
              {@const completed =
                (roadmap.completed_checkpoints || 0) +
                (roadmap.completed_quizzes || 0)}
              {@const pct =
                total > 0
                  ? Math.min(100, Math.round((completed / total) * 100))
                  : 0}
              <div
                class="group bg-gray-50/50 hover:bg-blue-50/30 p-6 rounded-[2rem] border border-transparent hover:border-blue-100 transition-all duration-300"
              >
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h4
                      class="font-bold text-gray-800 group-hover:text-blue-600 transition-colors"
                    >
                      {roadmap.role_name}
                    </h4>
                    <p class="text-xs text-gray-500 mt-1">
                      Sedang di: <span class="font-semibold text-gray-700"
                        >{roadmap.current_module || "Memulai..."}</span
                      >
                    </p>
                  </div>
                  <a
                    href="/roadmap"
                    class="p-2 bg-white rounded-full text-gray-400 group-hover:text-blue-600 group-hover:shadow-md transition-all"
                  >
                    <ChevronRight size={20} />
                  </a>
                </div>

                <div class="space-y-2">
                  <div
                    class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400"
                  >
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div class="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                    <div
                      class="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      style="width: {pct}%"
                    ></div>
                  </div>
                  <div class="flex justify-between text-[10px] text-gray-400">
                    <span>{completed} dari {total} selesai (materi + kuis)</span>
                    <span
                      class="font-bold {roadmap.status === 'active'
                        ? 'text-blue-600'
                        : 'text-green-600'}">{roadmap.status.toUpperCase()}</span
                    >
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Level Section -->
        <section
          class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col h-full"
        >
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Star size={24} />
              </div>
              <h3 class="text-xl font-bold text-gray-800">Level Kamu</h3>
            </div>
            {#if data.level}
              <span
                class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full {levelBadge}"
              >
                {levelBadgeText}
              </span>
            {/if}
          </div>

          {#if !data.averageScore}
            <!-- No evaluations yet -->
            <div
              class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200"
            >
              <div
                class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm opacity-50"
              >
                <TrendingUp class="text-gray-300" size={32} />
              </div>
              <div class="text-2xl font-bold text-gray-300 mb-2">N/A</div>
              <p class="text-gray-400 text-sm mb-4">
                Belum ada data evaluasi. Selesaikan evaluasi untuk melihat level Anda.
              </p>
              <a
                href="/evaluation"
                class="text-blue-600 text-sm font-bold hover:underline"
              >
                Mulai Evaluasi →
              </a>
            </div>
          {:else}
            <!-- Score & Level -->
            <div class="space-y-6 flex-1">
              <div class="flex flex-col items-center">
                <div class="text-5xl font-black text-gray-800 mb-1">
                  {data.averageScore}
                </div>
                <div class="text-sm text-gray-400 font-bold">Rata-rata Skor</div>
              </div>

              <!-- Mini progress bar -->
              <div class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Progress Level</span>
                  <span>{data.averageScore}/100</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                  <div
                    class="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)] bg-gradient-to-r {levelColor}"
                    style="width: {data.averageScore}%"
                  ></div>
                </div>
                <div class="flex justify-between text-[9px] text-gray-400">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Professional</span>
                </div>
              </div>

              <!-- Level Badge Big -->
              <div
                class="flex items-center justify-center space-x-2 py-3 px-4 rounded-[1.5rem] {levelBadge}"
              >
                {#if data.level === 'Professional'}
                  <Crown size={20} />
                {:else if data.level === 'Intermediate'}
                  <Zap size={20} />
                {:else}
                  <Sprout size={20} />
                {/if}
                <span class="font-black text-sm">{levelBadgeText}</span>
              </div>

              <!-- Job Recommendations -->
              {#if data.jobRecommendations.length > 0}
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <TrendingUp size={14} class="text-gray-400" />
                    <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Rekomendasi Karir
                    </h4>
                  </div>
                  <div class="space-y-2">
                    {#each data.jobRecommendations as job}
                      <div
                        class="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group"
                      >
                        <div class="flex items-center space-x-3 min-w-0">
                          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                            <Star size={14} class="text-blue-500" />
                          </div>
                          <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate">{job.title}</span>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0">
                          <a
                            href={job.googleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                            title="Cari di Google Jobs"
                          >
                            <SiGoogle size={14} />
                          </a>
                          <a
                            href={job.linkedinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                            title="Cari di LinkedIn"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </section>
      </div>

      <!-- Evaluation Score Section (full width) -->
      <section
        class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col h-full"
      >
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Award size={24} />
            </div>
            <h3 class="text-xl font-bold text-gray-800">Evaluation Score</h3>
          </div>
        </div>

        {#if data.evaluations.length === 0}
          <div
            class="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200"
          >
            <div
              class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm opacity-50"
            >
              <Award class="text-gray-300" size={32} />
            </div>
            <div class="text-2xl font-bold text-gray-300 mb-2">N/A</div>
            <p class="text-gray-400 text-sm">
              Belum ada evaluasi yang dilakukan.
            </p>
          </div>
        {:else}
          <div class="space-y-6 flex-1">
            {#each mainEvaluations as evaluation}
              <div
                transition:slide
                class="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group"
              >
                <div
                  class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform"
                ></div>

                <div
                  class="flex justify-between items-center mb-4 relative z-10"
                >
                  <div>
                    <h4 class="font-bold text-gray-800">
                      {evaluation.module_name}
                    </h4>
                    <p class="text-xs text-gray-500 font-medium">
                      {evaluation.role_name}
                    </p>
                  </div>
                  <div class="flex flex-col items-end">
                    <div class="text-3xl font-black text-blue-600 leading-none">
                      {evaluation.ai_score}
                    </div>
                    <div
                      class="mt-1 text-[10px] font-black px-3 py-1 rounded-full {evaluation.ai_decision ===
                      'PASS'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'}"
                    >
                      {evaluation.ai_decision}
                    </div>
                  </div>
                </div>

                <div
                  class="bg-gray-50 rounded-2xl p-4 text-xs italic text-gray-600 leading-relaxed relative z-10 border border-gray-100"
                >
                  "{parseFeedback(evaluation.ai_feedback)}"
                </div>

                <div
                  class="mt-4 flex items-center justify-between"
                >
                  <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    Divalidasi pada {new Date(
                      evaluation.created_at,
                    ).toLocaleDateString()}
                  </div>
                  <a
                    href="/evaluation/review/{evaluation.id}"
                    class="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline"
                  >
                    Review <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            {/each}

            {#if data.evaluations.length > 1}
              <button
                class="w-full py-4 text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-[2rem] transition-all border-2 border-blue-100 border-dashed"
                onclick={() => (showAllEvaluations = !showAllEvaluations)}
              >
                {showAllEvaluations
                  ? "Tampilkan Lebih Sedikit"
                  : `Lihat Semua (${data.evaluations.length})`}
              </button>
            {/if}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</div>

<AIChat hasActiveRoadmap={hasRoadmaps} />
