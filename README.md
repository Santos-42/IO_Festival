# SkillLeap: Generative Outcome Engine

🚀 [Coba Aplikasi SkillLeap Secara Langsung di Sini](https://skill-leap.pages.dev)

[cite_start]SkillLeap adalah platform akselerasi karir teknologi berbasis AI yang dirancang untuk memutus siklus _Tutorial Hell_ dan praktik kecurangan dalam pembelajaran digital[cite: 1099, 1108]. [cite_start]Platform ini mengandalkan _Generative Outcome Engine_ untuk memvalidasi kompetensi secara otentik, memandu pengguna dari pembelajaran teori hingga simulasi wawancara teknis[cite: 1104, 1146].

[cite_start]Proyek ini dikembangkan oleh **Tim Apa Aja Jadi** untuk kompetisi IO Festival.

## 👥 Tim Pengembang

- [cite_start]**Rio Santoso** (riosantoso6090@gmail.com) [cite: 1066, 1068]
- [cite_start]**Muhammad Raffi Suryadi** (m.raffi.suryadi@gmail.com) [cite: 1071, 1073]
- [cite_start]**Vincent Benedict Alimin** (vincba098@gmail.com) [cite: 1076, 1078]

---

## 🎯 Latar Belakang & Masalah

- [cite_start]**Krisis Kesiapan Kerja:** Terdapat kesenjangan (skill gap) jutaan talenta digital di Indonesia yang kesulitan memenuhi standar industri[cite: 1090].
- [cite_start]**Tutorial Hell:** Mayoritas platform pendidikan hanya menyajikan video pasif yang membuat pengguna merasa bisa, namun gagal saat wawancara teknis[cite: 1099, 1101].
- [cite_start]**Rentan Kecurangan:** Penggunaan bank soal statis memungkinkan pengguna mencari kunci jawaban di internet tanpa pemahaman logika dasar[cite: 1094, 1095].

## 💡 Solusi Kami

[cite_start]SkillLeap membuang paradigma bank soal mati[cite: 1104]. [cite_start]Setiap rintangan soal, kuis, dan studi kasus dirakit secara dinamis (_real-time_) oleh AI[cite: 1123]. [cite_start]Pengguna dipaksa untuk benar-benar memahami materi melalui sistem penalti waktu (_cooldown_) dan diuji melalui simulasi teknis layaknya di perusahaan nyata[cite: 1125, 1126, 1133].

---

## 🚀 Fitur Utama

1. **Generative Roadmap 4 Minggu**
   [cite_start]Jalur pembelajaran terstruktur yang disesuaikan dengan profesi (seperti Data Analyst, Software Engineer)[cite: 1201, 1238]. [cite_start]Tidak ada lompatan kurikulum; setiap materi dikunci secara sekuensial[cite: 1233].
2. **Adaptive Question & Sistem Cooldown**
   [cite_start]Pengguna wajib menjawab soal rintangan buatan AI untuk berpindah materi[cite: 1207]. [cite_start]Jawaban salah akan memicu penalti _cooldown_ selama 1 menit untuk memaksa evaluasi ulang materi (mencegah tebak-tebakan)[cite: 1208].
3. **Automated Evaluation Engine**
   [cite_start]Pengguna wajib menyelesaikan keseluruhan roadmap yang telah dibuat untuk mendapatkan penilaian berbasis _Mini Case Study_ yang mereplikasi masalah industri nyata[cite: 1213]. [cite_start]AI memberikan skor (0 hingga 100) dan umpan balik teknis mendetail[cite: 1213].
4. **AI Interview Simulator**
   [cite_start]Fasilitas latihan simulasi wawancara teknis interaktif bersama agen AI[cite: 1217]. [cite_start]Dilengkapi fitur unduhan transkrip sebagai cermin evaluasi mandiri (_self-reflection_) sebelum menghadapi HRD nyata[cite: 1217, 1349].
5. **Live Assistance & Dashboard**
   [cite_start]Asisten _chatbot_ siaga di seluruh halaman untuk diskusi teknis dan dasbor utama untuk memantau kemajuan serta skor evaluasi pengguna[cite: 1196, 1198].

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

Sistem ini dibangun dengan arsitektur _Full-Stack Serverless Edge_ untuk latensi minimal dan performa maksimal:

- **Kerangka Kerja (Framework):** SvelteKit (Svelte 5)
- **Bahasa Pemrograman:** TypeScript
- **Styling UI:** Tailwind CSS v4, Lucide Svelte, Svelte Simple Icons
- **Pangkalan Data (Database):** Cloudflare D1 (Serverless SQLite)
- **Infrastruktur / Peladen:** Cloudflare Pages & Cloudflare Edge Workers
- **Integrasi AI:**
  - Model Evaluasi: API DeepSeek
  - Model Chatbot: Google Gemini API (`@google/genai`)
  - Model Wawancara Suara: Gemini Live API (WebSocket)

---

## ⚙️ Panduan Instalasi Lokal

Ikuti langkah langkah berikut untuk menjalankan proyek ini di mesin lokal Anda:

### 1. Kloning Repositori

```bash
git clone <URL_REPOSITORI>
cd skill-leap
```

### 2. Instalasi Dependensi

```bash
npm install
```

### 3. Konfigurasi Lingkungan (Environment Variables)

Buat fail .dev.vars di direktori utama dan isi dengan kunci API Anda:

```bash
GEMINI_API_KEY="kunci_api_gemini_anda"
DEEPSEEK_API_KEY="kunci_api_deepseek_anda"
```

### 4. Persiapan Pangkalan Data (Cloudflare D1)

Jalankan skrip SQL untuk membangun tabel lokal dan memasukkan data tiruan (dummy):

```bash
npx wrangler d1 execute DB --local --file=Database/database.sql
npx wrangler d1 execute DB --local --file=Database/data.sql
```

### 5. Jalankan Peladen Pengembangan

```bash
npm run dev
```
