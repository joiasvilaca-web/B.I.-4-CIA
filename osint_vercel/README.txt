BI 4ª Cia PM Ind GER — Pesquisa OSINT na Vercel

ARQUIVOS
- index.html: interface do BI com agente de pesquisa na aba Fontes OSINT.
- api/osint-search.js: função serverless que consulta resultados públicos indexados via SerpApi.
- package.json: configura o projeto como módulo ES.

IMPLANTAÇÃO
1. Substitua o index.html do projeto pela versão entregue.
2. Copie api/osint-search.js para a pasta api/ do mesmo projeto Vercel.
3. Na SerpApi, crie uma chave e configure SERPAPI_KEY nas Environment Variables da Vercel (Production/Preview conforme necessário). Nunca coloque a chave no HTML.
4. Faça redeploy.
5. Teste primeiro com termos públicos não sensíveis.

O QUE O PROTÓTIPO FAZ
- Extrai texto de TXT/CSV/MD, texto embutido em PDF e DOCX no navegador; para imagens tenta OCR local no navegador.
- Envia somente o texto extraído/contexto para o endpoint de busca. A imagem original não é enviada à SerpApi.
- Retorna até 10 resultados orgânicos do Google via SerpApi dentro da aba OSINT.
- Permite exportar JSON dos resultados.

LIMITES
- A pesquisa alcança páginas públicas indexadas pelo provedor, não todas as páginas da internet, intranets, bases fechadas ou conteúdo privado.
- OCR pode errar; revise o texto extraído antes de pesquisar.
- CPF/RG e números de documentos são bloqueados nesta implementação. Não há reconhecimento facial nem identificação de pessoa a partir de foto.
- Antes de uso operacional, implemente autenticação/autorização do endpoint, limites de taxa e política de retenção/logs adequada à instituição. O endpoint de exemplo ainda não exige autenticação; não o exponha para uso sensível sem essa proteção.
- Bibliotecas de PDF/DOCX/OCR são carregadas por CDN quando necessárias; para ambiente isolado/offline, hospede-as localmente e revise a política de segurança de conteúdo (CSP).
