// Análise visual contextual: não identifica pessoas nem compara rostos.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido. A API espera POST.' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Falta configurar OPENAI_API_KEY na Vercel para ativar a análise visual da foto.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const image = String(body.image || '');
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(image)) return res.status(400).json({ error: 'Imagem inválida. Envie JPG, PNG ou WEBP.' });
    if (image.length > 5_500_000) return res.status(413).json({ error: 'Imagem comprimida acima do limite. Tente uma foto menor.' });
    const prompt = `Seu objetivo exclusivo é estimar ONDE a foto foi tirada. Não descreva nem analise pessoas. Examine pistas geográficas e do ambiente: arquitetura, fachadas, placas de rua, nomes de estabelecimentos, monumentos, paisagem, relevo, vegetação, costa, estradas, sinalização, idioma, transporte público, mobiliário urbano, clima/iluminação apenas quando útil, e qualquer texto que indique endereço ou local. Extraia texto visível relevante para geolocalização. Gere hipóteses de local do mais específico ao mais amplo (estabelecimento/ponto de referência, rua/bairro, cidade/região, país), mas nunca invente coordenadas ou alegue certeza sem evidência. Explique quais pistas sustentam cada hipótese e quais informações faltam. Sugira consultas web curtas e específicas usando as pistas visuais. Se não houver pistas suficientes, diga isso claramente e peça uma imagem mais ampla ou de maior resolução. Responda em português, JSON válido com chaves: resumo_local, pistas_geograficas (array de strings), texto_relevante (array de strings), locais_candidatos (array de objetos com local, nivel, justificativa, confianca), consultas_busca (array de strings), limitacoes.`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 650,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image, detail: 'high' } }
        ] }]
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'O provedor de análise visual não respondeu. Verifique OPENAI_API_KEY e o acesso ao modelo.' });
    const content = data.choices?.[0]?.message?.content || '{}';
    let analysis;
    try { analysis = JSON.parse(content); } catch { analysis = { resumo_local: content, pistas_geograficas: [], texto_relevante: [], locais_candidatos: [], consultas_busca: [], limitacoes: 'A resposta não veio em formato estruturado.' }; }
    return res.status(200).json({ analysis, model: 'gpt-4o-mini', note: 'Análise contextual; não identifica nem compara rostos.' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha na análise visual: ' + String(e.message || e).slice(0, 220) });
  }
}
