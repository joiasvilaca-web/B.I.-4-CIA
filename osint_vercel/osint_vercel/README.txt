BI 4ª CIA PM IND GER — AGENTE OSINT (versão de busca contextual)

ARQUIVOS
- index.html: interface do agente, anexo de foto, OCR no navegador e texto complementar opcional.
- api/osint-search.js: endpoint serverless que consulta SerpApi/Google.
- package.json: configura o projeto como módulo ES.

PUBLICAÇÃO NO VERCEL
1. No GitHub, mantenha estes arquivos dentro da pasta osint_vercel.
2. No Vercel > Project Settings > Build and Deployment, configure Root Directory = osint_vercel.
3. Em Project Settings > Environment Variables, configure SERPAPI_KEY com sua chave SerpApi. Não publique a chave no GitHub.
4. Faça redeploy após qualquer mudança de variável ou código.
5. Testar a rota abrindo /api/osint-search pode retornar 405 em GET; isso é esperado porque o endpoint aceita POST.

FUNCIONAMENTO E LIMITES
- A imagem é processada no navegador por OCR (Tesseract.js) para extrair texto visível. O arquivo da imagem não é enviado à SerpApi.
- A categoria escolhida ajuda a formular até três pesquisas textuais no Google via SerpApi, incluindo fontes oficiais, notícias ou páginas públicas indexadas, conforme o caso.
- A opção de redes sociais consulta apenas páginas públicas indexadas por texto. Não pesquisa contas privadas.
- Não há reconhecimento facial, comparação de rostos nem identificação de pessoas pela aparência.
- Esta versão não faz análise visual semântica de objetos/placas nem busca reversa da própria imagem. Para isso, seria necessária uma integração separada, com avaliação de privacidade e autorização.
- Resultados são páginas públicas indexadas, podem ser incompletos ou incorretos e precisam de revisão humana. Não representa toda a internet.
- O endpoint de exemplo não inclui autenticação, controle de acesso nem limitação de requisições. Não o exponha para uso operacional sensível sem implementar essas proteções.
