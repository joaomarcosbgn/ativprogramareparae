# Reparaê — revisão e testes da cópia de 21/11/2026

## Entregue nesta cópia

- Banco SQLite atualizado **na cópia**, sem sobrescrever o ZIP original.
- **5 categorias**: Tecnologia, Elétrica, Hidráulica, Limpeza, Automotivo.
- **15 serviços**: três em cada categoria, com preços demonstrativos (não são preços oficiais).
- **30 profissionais fictícios**, dois diferentes para cada serviço, com vínculo em `profissional_servicos`, perfis e regiões fictícias do Ceará.
- As contas de demonstração usam e-mails `@reparae.example`, hashes bcrypt e senhas aleatórias. As credenciais estão em arquivo **separado**, não incluído no ZIP.
- Corrigido o serviço antigo de manutenção de computador que estava na categoria provisória `string`, preservando as solicitações por atualização do ID; removido vínculo incompatível do profissional antigo Automotivo com informática. A conta antiga foi preservada e não recebeu automaticamente outro serviço.
- Busca de profissionais ampliada para encontrar **nomes de serviços** oferecidos, além do nome e especialidade do profissional.
- CORS ampliado para aceitar subdomínios HTTPS `*.vercel.app`, além dos endereços locais já previstos. Em produção, recomenda-se restringir aos domínios da aplicação.
- Comentário desatualizado da integração Chatbase corrigido. O endpoint de identidade já existe; depende do segredo `CHATBASE_IDENTITY_SECRET` no servidor.
- Script de população idempotente `API/popular_catalogo.py` e auditoria `API/testar_catalogo.py` adicionados.
- Script `API/testar_api_integrada.py` para reproduzir os 36 testes HTTP com dependências **reais**, usando uma cópia temporária do banco.

## Testes executados nesta sessão

| Verificação | Resultado |
| --- | --- |
| SQLite `integrity_check` | OK |
| SQLite `foreign_key_check` | 0 violações |
| 5 categorias / 3 serviços por categoria | OK |
| 2 profissionais vinculados a cada serviço | OK |
| 30 usuários fictícios | OK |
| Especialidades compatíveis com serviços vinculados | OK |
| Sintaxe Python (`compileall`) | OK |
| Sintaxe JS (`node --check`) | OK |
| HTTP TestClient: busca, filtros, ordenação, paginação, cadastro, login, JWT, autorização, CRUD administrativo, solicitações e Chatbase | **36/36 passaram com adaptadores de compatibilidade temporários** |

**Limitação importante:** o ambiente de auditoria não disponibiliza os pacotes `bcrypt` e `python-jose` e não permite instalá-los da internet. Por isso os 36 testes HTTP foram executados com adaptadores temporários para essas bibliotecas (`htpasswd`/PyJWT), **não** com as bibliotecas reais do projeto. O código entregue não contém esses adaptadores. O teste real reproduzível está em `API/testar_api_integrada.py`.

## Ainda depende de validação

1. Rodar `python testar_api_integrada.py` com `bcrypt` e `python-jose` reais instalados.
2. Testar no navegador o Front-End com os 30 profissionais (especialmente busca, paginação e ordenação).
3. Testar integração no **Render/Vercel publicados** e CORS no domínio definitivo.
4. Configurar `REPARAE_SECRET_KEY` permanente e `CHATBASE_IDENTITY_SECRET` no Render; não enviar os valores para o GitHub.
5. Validar a identificação do widget Chatbase com a conta real e a configuração da plataforma externa.
6. Revisar README/DER em relação às tabelas extras `profissional_servicos` e `perfis_profissionais_extra`, caso exigido pelo professor.
7. O projeto inclui páginas de mensagens e pagamentos, mas estas não foram certificadas ponta a ponta nesta auditoria.
8. A conta antiga Automotivo permanece sem serviços associados após a remoção do vínculo inconsistente. Definir quais serviços reais ela oferece.

## Como executar

1. Extraia o ZIP **em uma pasta nova**. Não substitua o banco do Render ou de outro integrante sem backup.
2. Na pasta `API`, instale `python -m pip install -r requirements.txt -r requirements-test.txt`.
3. Copie o arquivo de credenciais separado para `API/CREDENCIAIS_DEMONSTRACAO_PRIVADO.csv` **somente no computador local**, para testar os logins de demonstração.
4. Execute `python testar_catalogo.py` e `python testar_api_integrada.py`.
5. Execute `uvicorn main:app --reload` e abra o Front-End local para conferir as páginas.
6. Para popular outro banco compatível, execute `python popular_catalogo.py` uma única vez (o script pode ser repetido sem duplicar as contas).

**Aviso:** profissionais, nomes, telefones, regiões, preços e serviços cadastrados nesta revisão são dados fictícios para demonstração acadêmica. Não devem ser apresentados como profissionais reais ou disponibilizados publicamente para contratação.
