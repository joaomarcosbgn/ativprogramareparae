# Auditoria da revisão geral — 16/11/2026

## Corrigido no código

- Logout da navegação remove token e usuário da sessão do navegador.
- Telas internas verificam o tipo de usuário salvo antes de renderizar; a API continua responsável pela autorização real.
- Dashboard: `Aceitas (total)` conta Aceita + Concluída, enquanto `Em andamento` conta apenas Aceita.
- Solicitações: alteração de status por profissional verifica explicitamente que a solicitação pertence a ele.
- Solicitações: o profissional só recebe pedidos de serviços efetivamente vinculados a seu perfil. Profissionais antigos sem vínculo devem vincular serviços antes de receber novos pedidos.
- Chatbase: endpoint autenticado para identidade com segredo próprio; retorna 503 enquanto não configurado. Front-end envia Bearer JWT.
- Auditoria não destrutiva do SQLite (`API/verificar_integridade.py`), configuração exemplo de variáveis e README revisado.
- `.gitignore` ampliado para backups, SQLite e arquivos locais.

## Evidência e limitações

- Verificações de sintaxe Python e JavaScript: aprovadas.
- Banco SQLite do ZIP: `PRAGMA integrity_check = ok`; `PRAGMA foreign_key_check = []`; sete tabelas esperadas presentes.
- **Inconsistência de dados identificada, NÃO alterada automaticamente:** profissional id 2, especialidade `Automotivo`, vinculado ao serviço `Manutenção de Computador`, cuja categoria no banco é `string`. Conferir qual especialidade e categoria são corretas no painel antes de editar dados reais.
- **Testes HTTP completos não executados:** ambiente sem dependência `python-jose` e sem acesso à rede para instalação. Não é correto afirmar que login, permissões, integração Chatbase ou regressões passaram em execução real.
- **Não testado:** login do administrador com credenciais reais. HTTP 401 em `/login` significa credenciais inválidas ou conta ausente no banco utilizado. HTTP 403 em `/usuarios` para não-admin é o comportamento esperado; para admin autenticado precisa ser reproduzido.
- **Não testado:** fluxos no navegador com múltiplos profissionais, paginação e ordenação, pois dependem de ambiente e dados de teste.
- **Não alterado:** dados de produção ou hospedagem Render/Vercel; configurações e segredos devem ser definidos pelo responsável.
- **Pendente:** auditoria de toda a superfície de segurança, proteção contra XSS, documentação DER atualizado e integrações de mensagens/pagamentos se exigidas. Não considerar o projeto integralmente pronto para produção sem essas verificações.

## Aplicação

O ZIP contém código-fonte e documentação, mas não contém seu banco local, `.git`, `.venv` ou segredos. **Faça backup da pasta atual** e substitua apenas os arquivos correspondentes. Preserve `API/reparae.db` existente e configure variáveis de ambiente. Rode `python API/verificar_integridade.py` e testes no Swagger antes de publicar.

## Testes adicionais autorizados — 16/11/2026

O usuário autorizou contas e dados fictícios para testes. Foi adicionado `API/testar_banco_isolado.py`, que cria uma cópia temporária do banco usando a API de backup do SQLite e insere **15 profissionais fictícios, um cliente, uma categoria, um serviço e uma solicitação**, sem modificar o banco principal. **13/13 verificações SQLite passaram**: integridade inicial/final, chaves estrangeiras, inserções, vínculos, paginação 6/6/3/0, ausência de duplicações, ordenação descendente, filtros positivos e vazios, solicitação válida e rejeição de referência inexistente.

**Escopo:** esses testes verificam consultas SQL e restrições do banco, não substituem testes de endpoints FastAPI, JWT ou execução no navegador. Dependências `python-jose` e `bcrypt` não estavam instaladas no ambiente, portanto esses testes continuam pendentes. Dados fictícios do teste não são persistidos no banco principal nem publicados no ZIP.
