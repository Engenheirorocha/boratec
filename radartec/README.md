# RadarTec — protótipo independente

Esta pasta foi criada na branch `radartec-prototipo` do repositório BoraTec, **sem alterar a branch main nem a aplicação publicada**. A infraestrutura de produção atual do BoraTec não foi modificada.

## Funcionalidades da interface
- PWA instalável, responsiva, com service worker e manifest.
- Feed de oportunidades, busca, filtros por UF e segmento, classificação e ordenação, paginação e link oficial.
- Mensagens claras de ausência de dados; nunca inventa editais.
- Sanitização de textos vindos do coletor e links limitados a fontes oficiais.

## Integração
A interface aceita uma URL da função Supabase por `?api=https://SEU-PROJETO.supabase.co/functions/v1/radartec-feed`. O endpoint deve retornar JSON: `{updated_at: string, items: [{title,category,uf,city,agency,value,deadline,published_at,url}]}`.

O coletor está em `supabase/functions/radartec-feed/index.ts`. **Ainda não implantado:** precisamos de um projeto Supabase independente para preservar o BoraTec. Não usar service role no navegador.

## Limites atuais
- Sem feed real até implantar e testar o coletor.
- Sem notificações push, autenticação, favoritos sincronizados ou pagamentos.
- O PNCP não tem busca garantida por termos em todos os endpoints: é necessária classificação no backend.
- Testar cobertura, paginação, datas, rate limits, situações de licitações e editais originais antes da produção.

## Publicação
Esta branch não altera o GitHub Pages existente. Para publicar de modo independente será necessário um repositório/site próprio ou um pipeline de publicação isolado, após revisão.
