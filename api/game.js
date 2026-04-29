import { readFileSync } from 'fs';
import { join } from 'path';

// Load JSON pakai fs — compatible dengan Vercel Node.js runtime
const dataDir = join(process.cwd(), 'data');
const asahotak     = JSON.parse(readFileSync(join(dataDir, 'asahotak.json'),     'utf-8'));
const family100    = JSON.parse(readFileSync(join(dataDir, 'family100.json'),    'utf-8'));
const susunkata    = JSON.parse(readFileSync(join(dataDir, 'susunkata.json'),    'utf-8'));
const tebakgambar  = JSON.parse(readFileSync(join(dataDir, 'tebakgambar.json'), 'utf-8'));
const tebakkata    = JSON.parse(readFileSync(join(dataDir, 'tebakkata.json'),    'utf-8'));
const tebakbendera = JSON.parse(readFileSync(join(dataDir, 'tebakbendera.json'),'utf-8'));
const tebakkimia   = JSON.parse(readFileSync(join(dataDir, 'tebakkimia.json'),  'utf-8'));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt) {
  if (!GEMINI_KEY) return 'Error: GEMINI_API_KEY belum diset';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      }
    );
    if (!res.ok) {
      const err = await res.json();
      return `Error: ${err.error?.message || res.status}`;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada jawaban';
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// ── LEVEL SYSTEM ──
// 999 levels dibagi rata ke semua game secara berurutan
// Setiap game mendapat blok level berurutan
// Level 1-999 → index 0-998 → dibagi ke game berdasarkan urutan

const GAME_ORDER = [
  'asahotak',    // Game 1
  'tebakkata',   // Game 2
  'susunkata',   // Game 3
  'tebakbendera',// Game 4
  'tebakkimia',  // Game 5
  'tebakgambar', // Game 6
  'family100',   // Game 7
];

const GAME_DATA = {
  asahotak,
  tebakkata,
  susunkata,
  tebakbendera,
  tebakkimia,
  tebakgambar,
  family100,
};

// Build level map: level 1-999 → { game, dataIndex }
// Distribusi: setiap game mendapat bagian level secara berurutan
// Total: 999 levels → ~142-143 per game
function getLevelInfo(level) {
  const lvl = Math.max(1, Math.min(999, parseInt(level) || 1));
  const idx = lvl - 1; // 0-998

  // Distribusikan: game berputar setiap soal
  // Level 1 → game[0] soal ke-0, Level 2 → game[1] soal ke-0, ...
  // Level 8 → game[0] soal ke-1, dst.
  const totalGames = GAME_ORDER.length;
  const gameIdx = idx % totalGames;
  const dataRound = Math.floor(idx / totalGames);
  const gameName = GAME_ORDER[gameIdx];
  const data = GAME_DATA[gameName];
  const dataIndex = dataRound % data.length;

  return { gameName, dataIndex, data: data[dataIndex], lvl };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action, level, game, soal, jawaban, prompt } = req.query;

  // ── GET SOAL BY LEVEL ──
  if (action === 'soal') {
    const { gameName, dataIndex, data, lvl } = getLevelInfo(level);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json({ level: lvl, game: gameName, dataIndex, soal: data });
  }

  // ── MASCOT GREETINGS ──
  if (action === 'welcome1') {
    const text = await callGemini(
      'Kamu adalah Kak Taksaka, maskot naga gagah dari Paskibra Pagaska. ' +
      'Sapa pemain baru dengan gaya komandan seperti di Clash of Clans: heroik, bersemangat, dramatis. ' +
      'Panggil mereka "Ksatria". Maksimal 18 kata. Bahasa Indonesia.'
    );
    return res.json({ text });
  }

  if (action === 'welcome2') {
    const text = await callGemini(
      'Kamu Kak Taksaka maskot naga. Beritahu pemain ada 7 kategori game seru ' +
      'dengan 999 level yang menanti. Gaya perang, penuh semangat. Maksimal 20 kata. Bahasa Indonesia.'
    );
    return res.json({ text });
  }

  // ── AI HINT ──
  if (action === 'hint') {
    const prompts = {
      asahotak:     `Soal teka-teki: "${soal}". Jawaban: "${jawaban}". Berikan 1 hint dalam bahasa Indonesia tanpa menyebut jawabannya. Max 2 kalimat.`,
      tebakkata:    `Kata petunjuk: "${soal}". Jawaban: "${jawaban}". Berikan 1 clue tambahan tanpa menyebut jawabannya. Bahasa Indonesia, singkat.`,
      susunkata:    `Huruf acak: "${soal}". Jawaban: "${jawaban}". Hint tentang arti kata tanpa menyebut jawabannya. Bahasa Indonesia.`,
      tebakbendera: `Bendera: "${soal}". Negara: "${jawaban}". Hint tentang negara (letak/ibu kota/fakta unik) tanpa menyebut namanya. Bahasa Indonesia.`,
      tebakkimia:   `Unsur: "${soal}". Simbol: "${jawaban}". 1 fakta menarik tentang unsur ini. Bahasa Indonesia, singkat.`,
      tebakgambar:  `Deskripsi gambar: "${soal}". Jawaban: "${jawaban}". 1 petunjuk tanpa menyebut jawabannya. Bahasa Indonesia.`,
      family100:    `Soal Family 100: "${soal}". Berikan 1 petunjuk strategi menjawab. Bahasa Indonesia, singkat.`,
    };
    const p = prompts[game] || `Soal: "${soal}". Petunjuk dalam bahasa Indonesia.`;
    const text = await callGemini(p);
    return res.json({ text });
  }

  // ── GENERIC GEMINI ──
  if (action === 'gemini') {
    const text = await callGemini(prompt || '');
    return res.json({ text });
  }

  return res.status(400).json({ error: 'Action tidak dikenali' });
}
