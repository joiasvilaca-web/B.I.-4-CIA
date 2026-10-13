BI 4ª CIA PM Ind GER — Agente de Pesquisa OSINT

ESTRUTURA
- index.html
- api/osint-search.js
- package.json

COMO PUBLICAR
1. Envie o conteúdo desta pasta para a raiz do repositório GitHub, preservando a pasta api.
2. Conecte/importe o repositório no Vercel.
3. No Vercel, abra Settings > Environment Variables e configure SERPAPI_KEY com sua chave SerpApi.
4. Faça um novo deploy.
5. Teste a pesquisa com termos públicos não sensíveis.

A interface aceita fotos (JPG/PNG/WEBP) e um campo de texto complementar opcional. O texto visível na foto é extraído localmente por OCR; a imagem original não é enviada à API de busca. Não há reconhecimento facial.

Se aparecer aviso de API não configurada, confira se api/osint-search.js está na raiz do projeto dentro de api/, se SERPAPI_KEY está definida no Vercel e se o projeto foi redeployado. Apenas enviar os arquivos ao GitHub não ativa a API.

A busca retorna páginas públicas indexadas pelo provedor, não todas as páginas da internet. Resultados exigem revisão humana. Antes de uso operacional, configure autenticação/autorização, limites de requisição e políticas adequadas de retenção e registro.
