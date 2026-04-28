export const config = { runtime: 'edge' };

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  if (!GEMINI_KEY) return { error: "API Key kosong" };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 200 }
      })
    });
    if (!res.ok) {
        const err = await res.json();
        return { error: `Gemini ${res.status}: ${err.error?.message || 'Unknown'}` };
    }
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { error: "Gemini ga bales JSON", raw: rawText };
  } catch (e) {
    return { error: `Server crash: ${e.message}` };
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const answer = searchParams.get('answer');
  const level = searchParams.get('level') || 1;

  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (action === 'welcome') {
    const j = await gemini('Kamu Kak Taksaka maskot Paskibra. WAJIB balas HANYA JSON format ini: {"text": "sapaan 1 kalimat semangat akhiri Merdeka!"}. Jangan ada teks lain.');
    return new Response(JSON.stringify(j), { headers });
  }

  if (action === 'mission') {
    const kataLvl = { 1: ['Merdeka', 'Disiplin'], 2: ['Pantang Menyerah', 'Gagah Berani'], 3: ['Jiwa Korsa'] };
    const list = kataLvl[Math.min(level, 3)];
    const random = list[Math.floor(Math.random() * list.length)];
    const j = await gemini(`Level ${level}. WAJIB balas HANYA JSON format ini: {"mission": "buat misi 1 kalimat: suruh buat yel-yel Paskibra pake kata '${random}'", "keyword": "${random}"}. Jangan ada teks lain.`);
    return new Response(JSON.stringify(j), { headers });
  }

  if (action === 'judge') {
    const j = await gemini(`Level ${level}. User jawab: "${answer}". Nilai 0-100. WAJIB balas HANYA JSON format ini: {"skor": angka, "komen": "komentar 1 kalimat gaya pembina Paskibra galak tapi sayang"}. Jangan ada teks lain.`);
    return new Response(JSON.stringify(j), { headers });
  }

  return new Response(JSON.stringify({ error: 'action salah' }), { headers, status: 400 });
}
