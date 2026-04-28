export const config = { runtime: 'edge' };

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  if (!GEMINI_KEY) return 'Error: API Key kosong';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 200 } // NAIKIN JADI 200
      })
    });
    if (!res.ok) {
        const err = await res.json();
        return `Error: ${err.error?.message || res.status}`;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: Jawaban kosong';
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const answer = searchParams.get('answer');
  const level = searchParams.get('level') || 1;

  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (action === 'welcome') {
  const text = await gemini('Kamu Kak Taksaka maskot Paskibra SMKN 5. Sapa user 1 kalimat semangat maksimal 15 kata, akhiri "Merdeka!".');
  return new Response(JSON.stringify({ text }), { headers });
}

if (action === 'mission') {
  const kataLvl = { 1: ['Merdeka', 'Disiplin'], 2: ['Pantang Menyerah', 'Gagah Berani'], 3: ['Jiwa Korsa'] };
  const list = kataLvl[Math.min(level, 3)];
  const random = list[Math.floor(Math.random() * list.length)];
  const text = await gemini(`Buat misi 1 kalimat maksimal 15 kata: suruh buat yel-yel Paskibra pake kata "${random}".`);
  return new Response(JSON.stringify({ mission: text, keyword: random }), { headers });
}

if (action === 'judge') {
  const text = await gemini(`User jawab yel-yel: "${answer}". Nilailah 0-100. Balas PERSIS format: SKOR: [angka] | KOMEN: [komentar maksimal 12 kata gaya pembina Paskibra]. Jangan tambah teks lain.`);
  return new Response(JSON.stringify({ result: text }), { headers });
}

  return new Response(JSON.stringify({ error: 'action salah' }), { headers, status: 400 });
}
