export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const { messages = [], lang = 'bn' } = req.body || {};
  const system = lang === 'bn'
    ? 'You are J.A.R.V.I.S., a calm, witty personal AI assistant. Reply in Bengali (বাংলা) unless the user writes in English. Keep answers short and speakable; no markdown.'
    : 'You are J.A.R.V.I.S., a calm, witty personal AI assistant. Reply in English unless the user writes in Bengali. Keep answers short and speakable; no markdown.';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.slice(-20).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 4000) }] })),
      }),
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: d.error?.message || 'Gemini error' });
    const reply = d.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '…';
    res.status(200).json({ reply });
  } catch (e) { res.status(500).json({ error: e.message }); }
      }
