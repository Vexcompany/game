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
        generationConfig: { temperature: 0.5, maxOutputTokens: 200 }
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

  // SAPAAN TAHAP 1
  if (action === 'welcome1') {
    const text = await gemini('Kamu Kak Taksaka naga Paskibra. Sapa user baru 1 kalimat. Sebut "Ksatria", tanya "Siap jadi legenda Pagaska?". Maksimal 15 kata.');
    return new Response(JSON.stringify({ text }), { headers });
  }

  // SAPAAN TAHAP 2
  if (action === 'welcome2') {
    const text = await gemini('Kamu Kak Taksaka. Lanjutkan sapaan. 1 kalimat: Kasih tau ada 3 misi rahasia di website ini buat rehatkan pikiran. Gaya komandan. Maksimal 18 kata.');
    return new Response(JSON.stringify({ text }), { headers });
  }

  if (action === 'mission') {
    const kataLvl = { 1: ['Merdeka', 'Disiplin'], 2: ['Pantang Menyerah', 'Gagah Berani'], 3: ['Jiwa Korsa'] };
    const list = kataLvl[Math.min(level, 3)];
    const random = list[Math.floor(Math.random() * list.length)];
    const text = await gemini(`Misi Level ${level}. Buat 1 kalimat: suruh buat yel-yel Paskibra pake kata "${random}". Gaya menantang.`);
    return new Response(JSON.stringify({ mission: text, keyword: random }), { headers });
  }

  if (action === 'judge') {
    const text = await gemini(`User jawab yel-yel: "${answer}". Nilailah 0-100. Balas PERSIS: SKOR: [angka] | KOMEN: [komentar 1 kalimat gaya pembina galak].`);
    return new Response(JSON.stringify({ result: text }), { headers });
  }

  return new Response(JSON.stringify({ error: 'action salah' }), { headers, status: 400 });
}
