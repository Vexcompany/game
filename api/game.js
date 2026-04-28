export const config = { runtime: 'edge' };
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  if (!GEMINI_KEY) return 'Error: GEMINI_API_KEY belum diset di environment variables';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      }
    );
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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // ── MASCOT GREETINGS (Clash of Clans style) ──
  if (action === 'welcome1') {
    const text = await gemini(
      'Kamu adalah Kak Taksaka, maskot naga perkasa dari Paskibra Pagaska. ' +
      'Sapa pemain baru dengan gaya seperti pemimpin di Clash of Clans: gagah, bersemangat, sedikit dramatis. ' +
      'Sebut "Ksatria" dan ajak mereka bergabung ke Arena Pagaska. Maksimal 20 kata. Bahasa Indonesia.'
    );
    return new Response(JSON.stringify({ text }), { headers });
  }

  if (action === 'welcome2') {
    const text = await gemini(
      'Kamu Kak Taksaka, maskot naga Paskibra. Lanjutkan sapaan dengan gaya komandan Clash of Clans. ' +
      'Beritahu ada 6 game epik yang menanti. Gaya heroik dan menantang. Maksimal 20 kata. Bahasa Indonesia.'
    );
    return new Response(JSON.stringify({ text }), { headers });
  }

  if (action === 'welcome3') {
    const text = await gemini(
      'Kamu Kak Taksaka. Tutup sapaan dengan kalimat battle cry Paskibra yang membara. ' +
      'Ajak mulai bermain sekarang. Gaya perang. Maksimal 15 kata. Bahasa Indonesia.'
    );
    return new Response(JSON.stringify({ text }), { headers });
  }

  // ── GENERIC GEMINI CALL (for all games) ──
  if (action === 'gemini') {
    const prompt = searchParams.get('prompt') || '';
    if (!prompt) return new Response(JSON.stringify({ error: 'prompt kosong' }), { headers, status: 400 });
    const text = await gemini(prompt);
    return new Response(JSON.stringify({ text }), { headers });
  }

  // ── LEGACY GAME ACTIONS (backward compat) ──
  if (action === 'mission') {
    const level = searchParams.get('level') || 1;
    const kataLvl = {
      1: ['Merdeka', 'Disiplin'],
      2: ['Pantang Menyerah', 'Gagah Berani'],
      3: ['Jiwa Korsa', 'Ksatria']
    };
    const list = kataLvl[Math.min(level, 3)];
    const random = list[Math.floor(Math.random() * list.length)];
    const text = await gemini(
      `Misi Level ${level}. Buat 1 kalimat: suruh buat yel-yel Paskibra pake kata "${random}". Gaya komandan. Bahasa Indonesia.`
    );
    return new Response(JSON.stringify({ mission: text, keyword: random }), { headers });
  }

  if (action === 'judge') {
    const answer = searchParams.get('answer') || '';
    const level = searchParams.get('level') || 1;
    const text = await gemini(
      `User jawab yel-yel Paskibra: "${answer}". Nilailah 0-100. ` +
      `Balas PERSIS format: SKOR: [angka] | KOMEN: [komentar 1 kalimat gaya pembina semangat]. Bahasa Indonesia.`
    );
    return new Response(JSON.stringify({ result: text }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Action tidak dikenali' }), { headers, status: 400 });
}
