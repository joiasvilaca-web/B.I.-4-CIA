BI 4ª CIA PM Ind GER — Agente OSINT: Localização da Foto

Estrutura esperada na raiz do repositório (Root Directory da Vercel = osint_vercel):
- index.html
- package.json
- api/osint-search.js
- api/osint-vision.js

Foco desta versão:
- O módulo OSINT foi simplificado para estimar exclusivamente onde uma fotografia foi tirada.
- Análise visual por API de visão: arquitetura, fachadas, placas, monumentos, paisagem, sinalização, vegetação, relevo, texto geográfico e outras pistas do cenário.
- Lista de locais candidatos do mais específico ao mais amplo, com justificativa e confiança estimada quando houver evidência.
- OCR auxiliar no navegador para extrair placas e letreiros.
- Pesquisa web de termos geográficos e consultas sugeridas pela análise visual.
- Exibição de pistas, hipóteses, limitações e páginas públicas para verificação.
- A interface OSINT não exibe nem pesquisa nomes de pessoas ou atributos pessoais.

Configuração Vercel:
1. Root Directory: osint_vercel
2. Environment Variables em Production:
   - SERPAPI_KEY: chave da conta SerpApi para pesquisar páginas públicas.
   - OPENAI_API_KEY: chave da API OpenAI para analisar visualmente a foto.
3. Publique os arquivos e aguarde o deploy ficar Ready.

Limitações:
- A análise estima o local; não garante a localização exata, especialmente em fotos fechadas, genéricas ou sem referências geográficas.
- Os resultados de pesquisa são páginas públicas indexadas, não toda a internet nem busca reversa de imagem.
- A confiança descrita pelo modelo é uma estimativa qualitativa, não uma probabilidade estatística.
- A imagem é enviada ao endpoint /api/osint-vision para análise pela API de visão configurada. Use somente imagens cujo envio seja autorizado e aplique controles de acesso, limites e política de retenção adequados.
