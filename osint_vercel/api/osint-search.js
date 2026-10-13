function normalize(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function words(s) { return normalize(s).match(/[a-z0-9]{3,}/g) || []; }
function cleanText(s) { return String(s || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').replace(/[|•▪◆■]+/g, ' ').trim(); }
function extractNameCandidates(text) {
  const lines = String(text || '').split(/\n+/).map(cleanText).filter(Boolean);
  const stop = /\b(whatsapp|instagram|facebook|google|matematica|matemática|portugues|português|sequencia|sequência|numero|número|worksheet|subscribe|view|likes|years|ago|www|http|com|br|cpf|rg|documento|identidade|telefone|endereco|endereço|data|nascimento|nome|placa|modelo|marca|rua|avenida|cidade|estado|bairro|cep)\b/i;
  const candidates = [];
  for (const line of lines) {
    if (line.length < 5 || line.length > 90 || stop.test(line)) continue;
    const matches = line.match(/\b(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,})(?:\s+(?:de|da|do|dos|das|e)\s+|\s+)(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,})(?:\s+(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,}))?/g) || [];
    for (const m of matches) {
      const v = cleanText(m);
      if (v.split(/\s+/).length >= 2 && !stop.test(v) && !candidates.includes(v)) candidates.push(v);
    }
  }
  return candidates.slice(0, 8);
}
function extractCandidatesFromResults(results) {
  const out = [];
  const stop = /\b(google|youtube|facebook|instagram|linkedin|pinterest|noticias|notícias|jornal|oficial|site|portal|matematica|matemática|worksheet|resultado|resultados|brasil|brasileiro|brasileira|prefeitura|governo|universidade|policia|polícia|policial|companhia|empresa|servicos|serviços|login|sign|home|about|contact|subscribe)\b/i;
  for (const r of results) {
    const text = cleanText(`${r.title || ''}. ${r.snippet || ''}`);
    const re = /\b(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,})(?:\s+(?:de|da|do|dos|das|e)\s+|\s+)(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,})(?:\s+(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç'-]{2,}))?/g;
    for (const m of text.matchAll(re)) {
      const name = cleanText(m[0]);
      if (name.split(/\s+/).length >= 2 && name.length <= 70 && !stop.test(name) && !out.some(x => normalize(x.text) === normalize(name))) {
        out.push({ text: name, source: 'Título/resumo de uma fonte pública', confidence: 'baixa; conferir a fonte original' });
      }
      if (out.length >= 8) return out;
    }
  }
  return out;
}
function informativeTerms(text) {
  const stop = new Set(('para com uma umas uns que por das dos dele dela este esta esse essa isso aquilo foto imagem texto visivel visível nome possivel possível pesquisa busca pessoa local evento noticia notícia fonte publica pública resultado encontrado documento documento').split(' '));
  const counts = new Map();
  for (const w of words(text)) if (!stop.has(w) && !/^\d+$/.test(w)) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts.entries()].sort((a,b) => b[1]-a[1] || b[0].length-a[0].length).map(x=>x[0]).slice(0, 12);
}
function relevance(result, queryTerms, candidates) {
  const blob = normalize([result.title, result.snippet, result.source, result.link].join(' '));
  const terms = [...new Set(queryTerms)];
  const matched = terms.filter(t => blob.includes(t));
  const candidateHits = candidates.filter(n => blob.includes(normalize(n)));
  const score = Math.min(100, Math.round((terms.length ? matched.length / Math.min(terms.length, 8) : 0) * 70 + (candidateHits.length ? 30 : 0)));
  return { ...result, relevanceScore: score, matchedTerms: matched.slice(0, 6), candidateMatches: candidateHits, relevanceReason: candidateHits.length ? 'Contém um dos nomes/trechos detectados no texto da imagem.' : matched.length ? `Coincide com ${matched.length} termo(s) da consulta.` : 'Correspondência fraca; confira a fonte antes de usar.' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido. A API espera POST.' });
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return res.status(503).json({ error: 'SERPAPI_KEY não configurada nas variáveis de ambiente da Vercel.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const raw = cleanText(body.query).slice(0, 6000);
    const category = ['geral','pessoas_contexto','documentos','veiculos','locais'].includes(body.category) ? body.category : 'geral';
    if (!raw) return res.status(400).json({ error: 'Não foi possível extrair texto suficiente da foto. Tente uma imagem mais nítida ou acrescente contexto no campo opcional.' });
    const compact = raw.replace(/[.\s-]/g, '');
    if (/\b(?:CPF|RG|documento de identidade)\b\s*[:#-]?\s*\d/i.test(raw) || /^\d{11}$/.test(compact) || /^\d{7,12}$/.test(compact)) return res.status(400).json({ error: 'Consultas por CPF/RG ou número de documento para reunir dados pessoais não são permitidas.' });

    const candidates = extractNameCandidates(body.ocrText || raw);
    const terms = informativeTerms(raw);
    const base = terms.slice(0, 8).join(' ');
    const queries = [];
    // Search first using high-information terms, not the entire noisy OCR dump.
    if (candidates.length) queries.push({ label: 'Trechos que podem ser nomes no texto', q: `"${candidates[0]}" ${base}`.slice(0, 450) });
    if (base) queries.push({ label: 'Web por termos relevantes', q: base.slice(0, 450) });
    if (category === 'documentos') queries.push({ label: 'Fontes oficiais públicas', q: `${base} (site:gov.br OR site:jus.br)` .slice(0,450) });
    else if (category === 'veiculos') queries.push({ label: 'Veículos e objetos', q: `${base} (marca OR modelo OR manual OR fabricante)` .slice(0,450) });
    else if (category === 'locais') queries.push({ label: 'Locais e estabelecimentos', q: `${base} (estabelecimento OR endereço OR local)` .slice(0,450) });
    else if (category === 'pessoas_contexto') {
      queries.push({ label: 'Páginas públicas e contexto', q: `${base} (notícia OR evento OR organização)` .slice(0,450) });
      // Pesquisa apenas por texto/contexto fornecido ou extraído por OCR; não compara rostos.
      queries.push({ label: 'Perfis públicos indexados — LinkedIn', q: `${base} site:linkedin.com/in` .slice(0,450) });
      queries.push({ label: 'Páginas públicas indexadas — Instagram/Facebook', q: `${base} (site:instagram.com OR site:facebook.com)` .slice(0,450) });
    }
    else queries.push({ label: 'Notícias e fontes oficiais', q: `${base} (notícia OR comunicado OR site:gov.br)` .slice(0,450) });
    const usableQueries = queries.filter(x=>x.q.trim()).slice(0,4);
    if (!usableQueries.length) return res.status(400).json({ error: 'O texto extraído contém poucos termos úteis. Tente uma foto mais nítida ou acrescente contexto.' });

    const all = [];
    for (const item of usableQueries) {
      const params = new URLSearchParams({ engine:'google', q:item.q, api_key:apiKey, num:'10', hl:'pt-br', gl:'br' });
      const upstream = await fetch('https://serpapi.com/search.json?' + params.toString(), { headers:{Accept:'application/json'} });
      if (!upstream.ok) return res.status(502).json({ error:`O provedor de pesquisa falhou (HTTP ${upstream.status}). Confira a chave e o limite da conta SerpApi.` });
      const data = await upstream.json();
      if (data.error) return res.status(502).json({ error:'A SerpApi recusou a consulta. Confira a chave, o plano e o limite de pesquisas da conta.' });
      for (const x of (data.organic_results || [])) if (x.link && /^https?:\/\//i.test(x.link)) all.push({title:x.title||'',link:x.link,snippet:x.snippet||'',source:x.displayed_link||x.source||'',searchGroup:item.label,searchQuery:item.q});
    }
    const seen = new Set();
    const unique = all.filter(x=>{let k=x.link.split('#')[0].replace(/\/$/,'');if(seen.has(k))return false;seen.add(k);return true;});
    const results = unique.map(x=>relevance(x,terms,candidates)).sort((a,b)=>b.relevanceScore-a.relevanceScore).slice(0,20);
    const ocrNames = candidates.map(name=>({text:name,source:'Texto detectado na imagem (OCR)',confidence:'baixa a moderada; confira a imagem original'}));
    const sourceNames = extractCandidatesFromResults(results).filter(x=>!ocrNames.some(n=>normalize(n.text)===normalize(x.text)));
    const nameCandidates = [...ocrNames, ...sourceNames].slice(0,12);
    const analysisSummary = nameCandidates.length
      ? `Foram encontrados ${nameCandidates.length} nomes ou trechos que merecem conferência: alguns vêm do OCR e outros aparecem em títulos/resumos de páginas públicas. Isso não demonstra que qualquer nome corresponda à pessoa fotografada.`
      : 'Não foi possível separar nomes próprios com segurança do texto extraído ou dos resultados. Os links abaixo foram ordenados por correspondência textual; confira as fontes originais.';
    return res.status(200).json({query:base,category,searchedAt:new Date().toISOString(),provider:'SerpApi / Google organic results',ocrText:cleanText(body.ocrText || '' ).slice(0,3000),nameCandidates,analysisSummary,notes:'Os nomes são extraídos somente de texto OCR ou de títulos/resumos de fontes públicas; não são identificações da pessoa na foto. Não há reconhecimento facial nem confirmação de identidade.',results});
  } catch (e) {
    return res.status(500).json({ error:'Erro interno ao processar a pesquisa.' });
  }
}
