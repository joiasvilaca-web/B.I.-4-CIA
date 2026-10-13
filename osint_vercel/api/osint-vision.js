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
    const prompt = `Analise a imagem somente para descrever pistas visuais não biométricas úteis para pesquisa pública contextual. NÃO identifique a pessoa, não estime nome, não compare rosto, não infira identidade, idade exata, etnia, saúde, religião ou outros atributos sensíveis. Não tente localizar perfis pessoais por aparência. Descreva apenas: (1) texto legível em placas, roupas, crachás ou letreiros; (2) objetos, uniforme ou acessórios não sensíveis; (3) ambiente, cenário, evento ou estabelecimento se houver indícios visuais claros; (4) veículos, logotipos e outros elementos verificáveis; (5) termos curtos de pesquisa sugeridos a partir dessas pistas. Diferencie claramente observação de hipótese e não invente dados. Responda em português, JSON válido com chaves: descricao_cena, texto_visivel, pistas_visuais (array de strings), termos_busca (array de strings), ressalvas.`;
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
    try { analysis = JSON.parse(content); } catch { analysis = { descricao_cena: content, texto_visivel: '', pistas_visuais: [], termos_busca: [], ressalvas: 'A resposta não veio em formato estruturado.' }; }
    return res.status(200).json({ analysis, model: 'gpt-4o-mini', note: 'Análise contextual; não identifica nem compara rostos.' });
  } catch (e) {
    return res.status(500).json({ error: 'Falha na análise visual: ' + String(e.message || e).slice(0, 220) });
  }
}
