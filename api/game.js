export const config = { runtime: 'edge' };

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  if (!GEMINI_KEY) return 'Error kak, API Key kosong. Cek Vercel Env!';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
      })
    });
    if (!res.ok) {
        const err = await res.text();
        return `Error kak, Gemini nolak: ${res.status} ${err}`;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Error kak, jawaban Gemini kosong';
  } catch (e) {
    return `Error kak, server crash: ${e.message}`;
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const answer = searchParams.get('answer');
  const level = searchParams.get('level') || 1;

  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (action === 'welcome') {
    const text = await gemini('Kamu Kak Taksaka, maskot naga Paskibra SMKN 5. Sapa user baru 1 kalimat semangat, gaya villager COC, akhiri dengan "Merdeka!".');
    return new Response(JSON.stringify({ text }), { headers });
  }

  if (action === 'mission') {
    const kataLvl = { 1: ['Merdeka', 'Disiplin'], 2: ['Pantang Menyerah', 'Gagah Berani'] };
    const list = kataLvl[Math.min(level, 2)];
    const random = list[Math.floor(Math.random() * list.length)];
    const text = await gemini(`Level ${level}. Buat misi: suruh buat yel-yel Paskibra pake kata "${random}". 1 kalimat aja.`);
    return new Response(JSON.stringify({ mission: text, keyword: random }), { headers });
  }

  if (action === 'judge') {
    const text = await gemini(`Level ${level}. User jawab: "${answer}". Nilai 1-100. Komentar 1 kalimat gaya pembina Paskibra. Format: SKOR: xx | KOMEN: xxx`);
    return new Response(JSON.stringify({ result: text }), { headers });
  }

  return new Response(JSON.stringify({ error: 'action salah' }), { headers, status: 400 });
}
