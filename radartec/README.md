# RadarTec — protótipo independente

O protótipo foi desenvolvido na branch `radartec-prototipo` e a interface foi copiada para a pasta isolada `radartec/` na branch main. Nenhum arquivo existente da aplicação BoraTec foi modificado. A publicação via GitHub Pages ainda precisa de verificação.

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
A pasta `radartec/` na branch main pode ser servida pelo GitHub Pages existente se a publicação estiver configurada para a raiz da branch main. Isso não altera as telas existentes do BoraTec. Um domínio/repositório próprio pode ser criado futuramente.
