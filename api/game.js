const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  if (!GEMINI_KEY) return 'Error kak, API Key belum dipasang di Vercel. Merdeka!';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text }] }],
        generationConfig: { temperature: 0.9 }
      })
    });
    if (!res.ok) return 'Error kak, Kak Taksaka lagi istirahat';
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Error kak, jaringan lelet';
  } catch (e) {
    return 'Error kak, server kena mental';
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { action, answer, level = 1 } = req.query;

  if (action === 'welcome') {
    const text = await gemini('Kamu Kak Taksaka, maskot naga Paskibra SMKN 5. Sapa user baru 1 kalimat semangat, gaya villager COC, akhiri dengan "Merdeka!". Pake bahasa gaul anak Paskibra.');
    return res.status(200).json({ text });
  }

  if (action === 'mission') {
    const kataLvl = {
      1: ['Merdeka', 'Disiplin', 'Tangguh'],
      2: ['Pantang Menyerah', 'Gagah Berani', 'Satu Komando'],
      3: ['Jiwa Korsa', 'Loyalty', 'Dedikasi Tanpa Batas']
    };
    const list = kataLvl[Math.min(level, 3)];
    const random = list[Math.floor(Math.random() * list.length)];
    const text = await gemini(`Level ${level}. Buat misi: suruh buat yel-yel Paskibra pake kata "${random}". 1 kalimat aja, gaya tegas tapi asik.`);
    return res.status(200).json({ mission: text, keyword: random });
  }

  if (action === 'judge') {
    const text = await gemini(`Level ${level}. User jawab: "${answer}". Nilailah yel-yel ini dari 1-100. Kasih komentar 1 kalimat gaya kakak pembina Paskibra galak tapi sayang. Format: SKOR: xx | KOMEN: xxx`);
    return res.status(200).json({ result: text });
  }

  res.status(400).json({ error: 'action salah, Ksatria!' });
}
