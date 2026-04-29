import asahotak from '../data/asahotak.json' assert { type: 'json' };
import family100 from '../data/family100.json' assert { type: 'json' };
import susunkata from '../data/susunkata.json' assert { type: 'json' };
import tebakgambar from '../data/tebakgambar.json' assert { type: 'json' };
import tebakkata from '../data/tebakkata.json' assert { type: 'json' };
import tebakbendera from '../data/tebakbendera.json' assert { type: 'json' };
import tebakkimia from '../data/tebakkimia.json' assert { type: 'json' };

export const config = { runtime: 'edge' };

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

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // ── GET SOAL BY LEVEL ──
  if (action === 'soal') {
    const level = searchParams.get('level') || 1;
    const { gameName, dataIndex, data, lvl } = getLevelInfo(level);
    return new Response(JSON.stringify({
      level: lvl,
      game: gameName,
      dataIndex,
      soal: data
    }), { headers });
  }

  // ── MASCOT GREETINGS ──
  if (action === 'welcome1') {
    const text = await callGemini(
      'Kamu adalah Kak Taksaka, maskot naga gagah dari Paskibra Pagaska. ' +
      'Sapa pemain baru dengan gaya komandan seperti di Clash of Clans: ' +
      'heroik, bersemangat, dramatis. Panggil mereka "Ksatria". Maksimal 18 kata. Bahasa Indonesia.'
    );
    return new Response(JSON.stringify({ text }), { headers });
  }

  if (action === 'welcome2') {
    const text = await callGemini(
      'Kamu Kak Taksaka maskot naga. Beritahu pemain ada 7 kategori game seru ' +
      'dengan 999 level yang menanti. Gaya perang, penuh semangat. Maksimal 20 kata. Bahasa Indonesia.'
    );
    return new Response(JSON.stringify({ text }), { headers });
  }

  // ── AI HINT ──
  if (action === 'hint') {
    const game = searchParams.get('game') || '';
    const soal = searchParams.get('soal') || '';
    const jawaban = searchParams.get('jawaban') || '';

    const prompts = {
      asahotak: `Soal teka-teki: "${soal}". Jawaban: "${jawaban}". Berikan 1 hint/petunjuk dalam bahasa Indonesia tanpa menyebutkan jawabannya langsung. Singkat, max 2 kalimat.`,
      tebakkata: `Daftar kata petunjuk: "${soal}". Jawaban: "${jawaban}". Berikan 1 clue tambahan dalam bahasa Indonesia tanpa menyebut jawabannya. Singkat.`,
      susunkata: `Huruf acak: "${soal}". Jawaban: "${jawaban}". Berikan 1 hint tentang arti kata tanpa menyebut jawabannya. Bahasa Indonesia, singkat.`,
      tebakbendera: `Bendera emoji: "${soal}". Jawaban negara: "${jawaban}". Berikan 1 hint tentang negara tsb (letak, ibu kota, atau fakta unik) tanpa menyebut namanya. Bahasa Indonesia.`,
      tebakkimia: `Nama unsur: "${soal}". Simbol kimia: "${jawaban}". Berikan 1 fakta menarik tentang unsur ini dalam bahasa Indonesia. Singkat.`,
      tebakgambar: `Soal tebak gambar. Deskripsi: "${soal}". Jawaban: "${jawaban}". Berikan 1 petunjuk tanpa menyebut jawabannya. Bahasa Indonesia.`,
      family100: `Soal survey Family 100: "${soal}". Beberapa jawaban populer tersembunyi. Berikan 1 petunjuk strategi menjawab. Bahasa Indonesia, singkat.`,
    };

    const prompt = prompts[game] || `Soal: "${soal}". Berikan 1 petunjuk dalam bahasa Indonesia.`;
    const text = await callGemini(prompt);
    return new Response(JSON.stringify({ text }), { headers });
  }

  // ── GENERIC GEMINI ──
  if (action === 'gemini') {
    const prompt = searchParams.get('prompt') || '';
    const text = await callGemini(prompt);
    return new Response(JSON.stringify({ text }), { headers });
  }

  // ── GET LEVEL INFO (for progress bar) ──
  if (action === 'levelinfo') {
    const result = [];
    for (let i = 1; i <= 999; i++) {
      const { gameName, lvl } = getLevelInfo(i);
      result.push({ level: lvl, game: gameName });
    }
    return new Response(JSON.stringify(result), { headers });
  }

  return new Response(JSON.stringify({ error: 'Action tidak dikenali' }), { headers, status: 400 });
}
