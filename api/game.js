export const config = { runtime: 'edge' };

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function geminiJSON(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
        responseMimeType: "application/json" // PAKSA JSON
      }
    })
  });
  if (!res.ok) return { error: `Gemini error ${res.status}` };
  const data = await res.json();
  try {
    return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch {
    return { error: "Gemini balesannya ga valid" }
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const answer = searchParams.get('answer');
  const level = searchParams.get('level') || 1;

  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (action === 'welcome') {
    const j = await geminiJSON('Kamu Kak Taksaka maskot Paskibra. Balas JSON: {"text": "sapaan 1 kalimat semangat akhiri Merdeka!"}');
    return new Response(JSON.stringify(j), { headers });
  }

  if (action === 'mission') {
    const kataLvl = { 1: ['Merdeka', 'Disiplin'], 2: ['Pantang Menyerah', 'Gagah Berani'], 3: ['Jiwa Korsa'] };
    const list = kataLvl[Math.min(level, 3)];
    const random = list[Math.floor(Math.random() * list.length)];
    const j = await geminiJSON(`Level ${level}. Balas JSON: {"mission": "buat misi 1 kalimat: suruh buat yel-yel Paskibra pake kata '${random}'", "keyword": "${random}"}`);
    return new Response(JSON.stringify(j), { headers });
  }

  if (action === 'judge') {
    const j = await geminiJSON(`Level ${level}. User jawab: "${answer}". Nilai 0-100. Balas JSON: {"skor": angka, "komen": "komentar 1 kalimat gaya pembina Paskibra galak tapi sayang"}`);
    return new Response(JSON.stringify(j), { headers });
  }

  return new Response(JSON.stringify({ error: 'action salah' }), { headers, status: 400 });
}
