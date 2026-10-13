BI 4ª CIA PM Ind GER — Agente de Pesquisa OSINT

Estrutura esperada na raiz do repositório (Root Directory do Vercel = osint_vercel):
- index.html
- package.json
- api/osint-search.js

Melhorias desta versão:
- OCR de fotos no navegador (Tesseract.js, português + inglês).
- Texto complementar opcional.
- A API recebe o OCR separadamente, tenta destacar trechos que podem ser nomes escritos na imagem e constrói consultas com termos mais informativos.
- Deduplicação e ordenação heurística dos resultados por correspondência textual.
- A interface mostra o OCR extraído, possíveis nomes/trechos, razão da relevância e links de fontes públicas.
- A API não faz reconhecimento facial, comparação de rostos ou confirmação de identidade.
- Consultas por CPF/RG ou números de documentos para reunir dados pessoais são bloqueadas.

Configuração Vercel:
1. Root Directory: osint_vercel
2. Environment Variable: SERPAPI_KEY (valor secreto da conta SerpApi), ambiente Production
3. Fazer commit dos arquivos e aguardar novo deploy Ready.

Notas e limitações:
- Os nomes sugeridos são candidatos textuais extraídos por heurística do OCR, não identidade da pessoa na foto. Podem ser falsos positivos e precisam de conferência humana.
- A pontuação de relevância é heurística por sobreposição textual, não uma probabilidade estatística nem garantia de qualidade.
- A pesquisa consulta resultados públicos indexados pelo provedor, não toda a internet.
- A busca usa SerpApi/Google organic results. Não é busca reversa de imagem.
- Antes de uso operacional, proteja o endpoint com autenticação/autorização, limites de requisição, tratamento de logs e política de retenção adequados.
