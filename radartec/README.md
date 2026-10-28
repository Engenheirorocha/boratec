# RadarTec — portal de oportunidades para técnicos de refrigeração

**Projeto independente do BoraTec.** Esta cópia está temporariamente isolada na branch `radartec-prototipo` de um repositório existente, porque o conector GitHub não permite criar um repositório novo. **Não foi alterada a aplicação BoraTec em produção.**

## Para publicar como projeto realmente independente
1. Crie um novo repositório `radartec` em https://github.com/new.
2. Transfira **o conteúdo desta pasta** para a raiz do novo repositório. O pacote ZIP completo preparado para publicação inclui uma versão mais extensa do site e coletor.
3. No novo repositório: Settings > Pages > Deploy from a branch > main > / (root).
4. No menu Actions execute `Atualizar oportunidades RadarTec` (workflow_dispatch).
5. Se necessário habilite permissões de escrita em Settings > Actions > General > Workflow permissions.
6. Confira o arquivo `data/licitacoes.json` e os logs do workflow.

Este é um beta gratuito, sem cobrança e sem login. Os dados devem vir da API do Portal Nacional de Contratações Públicas (PNCP), podem sofrer bloqueios e conter resultados incompletos ou desatualizados. Confira sempre a situação e requisitos no edital oficial. O valor estimado não demonstra elegibilidade de MEI.

**Atenção:** workflows agendados normalmente executam na branch padrão. Enquanto a cópia estiver somente na branch `radartec-prototipo` dentro do repositório BoraTec, a automação do novo projeto **não estará ativada**. Não altere a branch padrão do BoraTec para tentar ativá-la.
