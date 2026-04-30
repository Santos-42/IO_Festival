import { env } from '$env/dynamic/private';

export interface JobRecommendation {
	title: string;
	googleLink: string;
	linkedinLink: string;
}

const cache = new Map<string, JobRecommendation[]>();

const GENERIC_RECOMMENDATIONS: Record<string, JobRecommendation[]> = {
	Beginner: [
		{ title: 'Internship / Magang', googleLink: 'https://www.google.com/search?q=internship+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Internship' },
		{ title: 'Junior Level', googleLink: 'https://www.google.com/search?q=junior+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Junior' },
		{ title: 'Associate', googleLink: 'https://www.google.com/search?q=associate+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Associate' }
	],
	Intermediate: [
		{ title: 'Mid-Level', googleLink: 'https://www.google.com/search?q=mid+level+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Mid+Level' },
		{ title: 'Senior-in-Training', googleLink: 'https://www.google.com/search?q=senior+in+training+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Senior' },
		{ title: 'Team Lead (small)', googleLink: 'https://www.google.com/search?q=team+lead+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Team+Lead' }
	],
	Professional: [
		{ title: 'Senior Level', googleLink: 'https://www.google.com/search?q=senior+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Senior' },
		{ title: 'Lead / Architect', googleLink: 'https://www.google.com/search?q=lead+architect+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Lead+Architect' },
		{ title: 'Engineering Manager', googleLink: 'https://www.google.com/search?q=engineering+manager+job&ibp=htl;jobs', linkedinLink: 'https://www.linkedin.com/jobs/search?keywords=Engineering+Manager' }
	]
};

function getGenericRecommendations(level: string): JobRecommendation[] {
	return GENERIC_RECOMMENDATIONS[level] || GENERIC_RECOMMENDATIONS['Beginner'];
}

export async function generateJobRecommendations(
	roleName: string,
	level: string
): Promise<JobRecommendation[]> {
	const cacheKey = `${roleName}:${level}`;
	const cached = cache.get(cacheKey);
	if (cached) return cached;

	const apiKey = env.Deepseek_Evaluator;
	if (!apiKey) {
		console.warn('DeepSeek API key not configured, using generic recommendations');
		return getGenericRecommendations(level);
	}

	const prompt = `Anda adalah career advisor profesional. Berikan 3 rekomendasi posisi pekerjaan yang cocok untuk role "${roleName}" dengan level kemampuan "${level}".
Untuk setiap posisi, berikan:
- title: nama posisi pekerjaan (misal: "Junior Data Analyst", "Senior Web Developer")
- googleLink: URL pencarian Google Jobs untuk posisi tersebut (format: https://www.google.com/search?q={posisi}+job&ibp=htl;jobs, ganti spasi dengan +)
- linkedinLink: URL pencarian LinkedIn Jobs untuk posisi tersebut (format: https://www.linkedin.com/jobs/search?keywords={posisi}, ganti spasi dengan %20)

PENTING: Pastikan googleLink dan linkedinLink adalah URL yang benar-benar valid dan bisa diklik langsung.
Balas HANYA JSON array tanpa teks lain. Format:
[
  { "title": "...", "googleLink": "https://...", "linkedinLink": "https://..." },
  ...
]`;

	let retryCount = 0;
	const maxRetries = 2;

	while (retryCount <= maxRetries) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);

			const response = await fetch('https://api.deepseek.com/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'deepseek-v4-flash',
					messages: [{ role: 'user', content: prompt }],
					response_format: { type: 'json_object' }
				}),
				signal: controller.signal
			});

			clearTimeout(timeout);

			const data = await response.json();
			if (!data.choices?.[0]?.message?.content) {
				throw new Error('Respons AI tidak valid');
			}

			const parsed = JSON.parse(data.choices[0].message.content);

			// Extract array whether wrapped in object or direct array
			const recommendations: JobRecommendation[] = Array.isArray(parsed)
				? parsed
				: parsed.recommendations || parsed.jobs || [];

			if (recommendations.length === 0) {
				throw new Error('Array rekomendasi kosong');
			}

			const valid = recommendations.filter((r) => r.title && r.googleLink && r.linkedinLink);
			if (valid.length === 0) {
				throw new Error('Format rekomendasi tidak sesuai');
			}

			cache.set(cacheKey, valid);
			return valid;
		} catch (err: any) {
			retryCount++;
			if (retryCount > maxRetries) {
				console.error(`DeepSeek job recommendations failed for ${roleName}/${level}:`, err.message);
				const fallback = getGenericRecommendations(level);
				cache.set(cacheKey, fallback);
				return fallback;
			}
			await new Promise((r) => setTimeout(r, 1000));
		}
	}

	return getGenericRecommendations(level);
}
