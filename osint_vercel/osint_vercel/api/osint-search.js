export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido. A API espera POST.' });
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return res.status(503).json({ error: 'SERPAPI_KEY não configurada nas variáveis de ambiente da Vercel.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const raw = String(body.query || '').trim().slice(0, 6000);
    const category = ['geral','pessoas_contexto','documentos','veiculos','locais'].includes(body.category) ? body.category : 'geral';
    if (!raw) return res.status(400).json({ error: 'Não foi possível extrair texto suficiente da foto. Tente uma imagem mais nítida ou acrescente palavras/contexto no campo opcional.' });

    const compact = raw.replace(/[.\s-]/g, '');
    if (/\b(?:CPF|RG|documento de identidade)\b\s*[:#-]?\s*\d/i.test(raw) || /^\d{11}$/.test(compact) || /^\d{7,12}$/.test(compact)) {
      return res.status(400).json({ error: 'Consultas por CPF/RG ou número de documento para reunir dados pessoais não são permitidas.' });
    }

    // Busca por texto/contexto em páginas públicas indexadas. Nunca compara rostos nem identifica pessoas pela aparência.
    const clean = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const terms = clean.split(/\s+/).filter(Boolean).slice(0, 32).join(' ');
    const queries = [];
    queries.push({label:'Web geral', q: terms});
    if (category === 'pessoas_contexto') {
      queries.push({label:'Páginas públicas e contexto', q: `${terms} (local OR evento OR notícia)`});
      queries.push({label:'Redes sociais públicas indexadas', q: `${terms} (site:instagram.com OR site:facebook.com OR site:x.com)`});
    } else if (category === 'documentos') {
      queries.push({label:'Texto/documento em fontes oficiais', q: `${terms} (site:gov.br OR site:jus.br OR site:policia.mg.gov.br)`});
      queries.push({label:'Notícias e páginas públicas', q: `${terms} (notícia OR comunicado OR publicação)`});
    } else if (category === 'veiculos') {
      queries.push({label:'Veículos e objetos', q: `${terms} (veículo OR modelo OR marca OR peça)`});
      queries.push({label:'Fontes oficiais', q: `${terms} (site:gov.br OR fabricante OR manual)`});
    } else if (category === 'locais') {
      queries.push({label:'Locais e estabelecimentos', q: `${terms} (endereço OR estabelecimento OR horário)`});
      queries.push({label:'Mapas e páginas públicas', q: `${terms} (site:maps.google.com OR site:tripadvisor.com OR site:gov.br)`});
    } else {
      queries.push({label:'Notícias e fontes oficiais', q: `${terms} (notícia OR comunicado OR site:gov.br)`});
      queries.push({label:'Páginas públicas indexadas', q: `${terms} (site:instagram.com OR site:facebook.com OR site:x.com)`});
    }

    const all = [];
    for (const item of queries.slice(0, 3)) {
      const params = new URLSearchParams({ engine: 'google', q: item.q.slice(0, 450), api_key: apiKey, num: '10', hl: 'pt-br', gl: 'br' });
      const upstream = await fetch('https://serpapi.com/search.json?' + params.toString(), { headers: { 'Accept': 'application/json' } });
      if (!upstream.ok) return res.status(502).json({ error: `O provedor de pesquisa falhou (HTTP ${upstream.status}). Confira a chave e a conta SerpApi.` });
      const data = await upstream.json();
      if (data.error) return res.status(502).json({ error: 'A SerpApi recusou a consulta. Confira a chave, o plano e o limite de pesquisas da conta.' });
      for (const x of (data.organic_results || [])) {
        if (!x.link || !x.link.startsWith('http')) continue;
        all.push({ title: x.title || '', link: x.link, snippet: x.snippet || '', source: x.displayed_link || '', searchGroup: item.label, searchQuery: item.q });
      }
    }
    const seen = new Set();
    const results = all.filter(x => { const k = x.link.split('#')[0].replace(/\/$/, ''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 20);
    return res.status(200).json({ query: terms, category, searchedAt: new Date().toISOString(), provider: 'SerpApi / Google organic results', coverage: 'Apenas páginas públicas indexadas; não representa toda a internet. Resultados exigem revisão humana.', notes: 'A análise usa OCR e contexto textual. Não faz reconhecimento facial, comparação de rostos nem confirmação de identidade.', results });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao processar a pesquisa.' });
  }
}
