# Revisão de 24/11/2026

## Resultados executados
- 13/13 testes SQL em cópia temporária do SQLite; auditoria do catálogo aprovada.
- 7 verificações ORM reais de busca, filtros, ordenação e paginação em cópia SQLite; módulo de segurança substituído apenas para importar CRUD, sem testar autenticação.
- 4 verificações de importação em SQLite temporário: prévia, rollback, aplicação, repetição sem duplicatas e preservação de conta existente (hash simulado exclusivamente no teste).
- Sintaxe Python e JavaScript verificada.
- Teste HTTP real tentado, bloqueado por ausência de python-jose e bcrypt; psycopg também ausente. Instalação indisponível neste ambiente. Nenhum teste HTTP desta revisão foi aprovado ou contabilizado. Novo script cria contas próprias e banco temporário, remove DATABASE_URL do subprocesso e não depende de CSV.

## Correções
- Solicitação exige vínculo real; novo GET /profissionais/{id}/servicos; seletor usa apenas serviços do profissional. Profissionais antigos sem vínculos precisam cadastrá-los.
- Atualização condicional de status evita sobrescrever uma transição concorrente; conflito de vínculo retorna 409.
- Validação de tamanho bcrypt em bytes, tratamento de hash inválido e exigência de exp/sub no JWT.
- Escape de nomes de serviços/categorias no HTML, preservação de categoria selecionada e lista real de solicitações na home.
- Saída de usuário aceita e-mails históricos fictícios .example; cadastro/login continuam validando EmailStr. Contas fictícias não são contas de login para uso real.
- Importador preserva registros existentes, remapeia IDs, não importa solicitações ou hashes antigos; prévia por padrão. Requer tabelas existentes no destino e backup. Não executado no Neon.
- README atualizado para PostgreSQL; DER lógico anterior permanece compatível com as sete tabelas. Swagger documenta nova rota após deploy. Chatbase autenticado não implementado neste snapshot.

## Aplicação
1. Preserve o ZIP original com o SQLite. Não publique bancos, backups ou segredos.
2. Copie os arquivos do ZIP de atualização sobre o repositório existente, sem apagar .git. Revise diff e instale dependências: `cd API; python -m pip install -r requirements.txt -r requirements-test.txt; python testar_api_integrada.py`.
3. Só após aprovação dos testes, commit/push e deploy API antes do front. Valide produção com contas fictícias. Não houve push/deploy nesta revisão.
4. Faça backup do Neon e configure DATABASE_URL em terminal privado. Execute `python importar_catalogo.py --origem CAMINHO_DO_SQLITE` e revise a prévia. Repita com `--aplicar` somente após aprovação. A prévia PostgreSQL pode consumir números de sequência mesmo com rollback; não altera registros persistidos. Não execute em paralelo com outra importação.
5. Confirme catálogo e fluxo de solicitação em produção. Permissões completas, PostgreSQL, interface no navegador e revogação JWT não foram validados aqui. Logout permanece local, token expira em 60 min.
