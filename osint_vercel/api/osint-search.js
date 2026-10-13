export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.SERPAPI_KEY) return res.status(503).json({ error: 'SERPAPI_KEY não configurada nas variáveis de ambiente da Vercel.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const query = String(body.query || '').trim().slice(0, 6000);
    if (!query) return res.status(400).json({ error: 'A foto foi recebida, mas não foi possível extrair texto suficiente para pesquisar. Tente uma imagem mais nítida ou acrescente palavras no campo opcional. A busca reversa pela imagem exige integração específica.' });
    const compact = query.replace(/[.\s-]/g, '');
    if (/\b(?:CPF|RG|documento de identidade)\b\s*[:#-]?\s*\d/i.test(query) || /^\d{11}$/.test(compact) || /^\d{7,12}$/.test(compact)) {
      return res.status(400).json({ error: 'Consultas por CPF/RG ou número de documento não são permitidas neste endpoint.' });
    }
    // Pesquisa somente páginas públicas indexadas. Não tenta identificar faces nem buscar em contas privadas.
    const terms = query.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(Boolean).slice(0, 35).join(' ');
    const params = new URLSearchParams({ engine: 'google', q: terms, api_key: process.env.SERPAPI_KEY, num: '10', hl: 'pt-br', gl: 'br' });
    const upstream = await fetch('https://serpapi.com/search.json?' + params.toString(), { headers: { 'Accept': 'application/json' } });
    if (!upstream.ok) return res.status(502).json({ error: 'O provedor de pesquisa não respondeu corretamente. Tente novamente mais tarde.' });
    const data = await upstream.json();
    if (data.error) return res.status(502).json({ error: 'O provedor informou uma falha na consulta.' });
    const results = (data.organic_results || []).slice(0, 10).map(x => ({ title: x.title || '', link: x.link || '', snippet: x.snippet || '', source: x.displayed_link || '' })).filter(x => x.link.startsWith('http'));
    return res.status(200).json({ query: terms, searchedAt: new Date().toISOString(), provider: 'SerpApi / Google organic results', coverage: 'Páginas públicas indexadas; não representa toda a internet.', results });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao processar a pesquisa.' });
  }
}
