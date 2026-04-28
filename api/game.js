const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function gemini(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 200 }
    })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Error kak';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { action, answer } = req.query;

  if (action === 'welcome') {
    const text = await gemini('Kamu adalah Kak Taksaka, maskot Paskibra yang ramah dan semangat. Sapa user baru dengan 1 kalimat pendek, semangat, akhiri dengan ajakan main. Gaya kayak villager COC.');
    return res.json({ text });
  }

  if (action === 'mission') {
    const kata = ['Merdeka', 'Disiplin', 'Tangguh', 'Pantang Menyerah', 'Gagah'];
    const random = kata[Math.floor(Math.random() * kata.length)];
    const text = await gemini(`Buat misi untuk calon paskibra: suruh buat yel-yel semangat pake kata "${random}". Jelaskan misinya dalam 1 kalimat aja, gaya militer tapi fun.`);
    return res.json({ mission: text, keyword: random });
  }

  if (action === 'judge') {
    const text = await gemini(`User jawab: "${answer}". Nilailah yel-yel ini dari 1-100. Kasih komentar singkat 1 kalimat gaya kakak pembina paskibra. Kalau bagus kasih semangat, kalau jelek kasih motivasi. Format: SKOR: xx | KOMEN: xxx`);
    return res.json({ result: text });
  }

  res.json({ error: 'action salah' });
}
