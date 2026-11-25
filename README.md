# Reparaê — Precisou? Reparaê.

Marketplace acadêmico de serviços. Front-end em HTML, CSS e JavaScript; API em FastAPI/SQLAlchemy; banco PostgreSQL (Neon) em produção e SQLite local.

## Executar localmente

1. Abra um terminal na pasta `API` e instale `python -m pip install -r requirements.txt`.
2. Configure a variável de ambiente `REPARAE_SECRET_KEY` com um valor aleatório forte e **permanente**. Não coloque o segredo no GitHub. No PowerShell, para a sessão atual: `$env:REPARAE_SECRET_KEY="<seu-segredo-aleatorio>"`. Em produção configure também `REPARAE_ENV=production`.
3. Inicie: `python -m uvicorn main:app --reload`. Documentação interativa: `http://127.0.0.1:8000/docs`.
4. Abra `front/index.html` usando Live Server no VS Code. Configure `front/scripts/config.js` para apontar para a API desejada.
5. O primeiro administrador é criado localmente com `python criar_admin.py`, **no mesmo banco usado pela API**. O cadastro público só cria clientes e profissionais. O login usa `POST /login` (não `/auth/login`).

## Segurança e permissões

- Senhas: bcrypt; sessão: JWT Bearer com expiração de 60 minutos. Logout remove o token do `sessionStorage` no navegador; JWT já emitido continua válido até expirar, portanto não equivale a revogação no servidor.
- `/usuarios` (lista), categorias e serviços (escrita) exigem administrador. Um usuário pode acessar/editar seus próprios dados; o administrador pode gerenciar outros usuários.
- Clientes criam solicitações; profissionais vinculados a elas podem aceitar, recusar e concluir; clientes podem cancelar solicitações pendentes. A API valida o token e o vínculo, independentemente do controle visual da página.
- A verificação visual por tipo de conta no navegador é apenas conveniência; autorização real fica no servidor.
- Não publique `API/reparae.db`, backups, `.env`, tokens ou a pasta `.venv` em repositórios públicos. O `.gitignore` evita novos arquivos, mas não remove arquivos já rastreados do Git.

## Banco e auditoria

- O banco local está em `API/reparae.db`. O SQLAlchemy cria tabelas ausentes, mas **não aplica alterações de schema a tabelas existentes**; faça backup antes de migrações.
- Execute `python verificar_integridade.py` na pasta `API` para auditar integridade, chaves estrangeiras e possíveis incompatibilidades entre especialidades e categorias. O script não altera dados.
- Para iniciar um banco novo, mova o banco antigo para um backup seguro fora do repositório e inicie a API; então cadastre categorias, serviços e usuários. Não substitua um banco existente sem backup.

## Chatbase

O front-end contém o widget Chatbase. A rota de identificação `/chatbase-token` não está implementada no snapshot atual; identificação autenticada não está validada.

## Testes e limitações

- `python -m compileall -q API` verifica sintaxe Python; `node --check front/scripts/app.js` verifica sintaxe JS (repita para os outros scripts).
- `python API/verificar_integridade.py` verifica o banco local sem alterá-lo.
- A validação HTTP de ponta a ponta requer instalar dependências, executar a API e cadastrar contas de teste. Testes de múltiplos profissionais e paginação exigem dados suficientes.
- Serviços de mensagens e pagamentos presentes no front-end podem ser protótipos; não trate como integrações de pagamento ou chat transacional sem validação específica.

## Organização

- `API/main.py`: rotas FastAPI e autorização; `API/models.py`: modelos; `API/schemas.py`: validação; `API/crud.py`: persistência.
- `front/`: páginas, estilos e scripts do navegador.
- `BancodeDados/`: SQL e dicionário de dados de referência; confirme divergências com o schema atual antes de usar scripts antigos.

## Atualização do catálogo e testes — 21/11/2026

A cópia de demonstração inclui cinco categorias, quinze serviços e trinta contas fictícias de profissionais, dois para cada serviço. Veja `RELATORIO_FINAL_REVISAO_2026-11-21.md` para resultados, limitações e procedimentos. O DER lógico atualizado está em `BancodeDados/DER_ATUALIZADO_2026-11-21.md`.

Para validar o banco: `cd API && python testar_catalogo.py`.
Para executar testes HTTP com as bibliotecas reais: `pip install -r requirements.txt -r requirements-test.txt` e `python testar_api_integrada.py` (cria contas fictícias em banco temporário, sem credenciais externas).

**Atenção:** os dados de profissionais são fictícios e não representam prestadores de serviço reais.

## Produção e recuperação do catálogo

- Front: https://reparae.vercel.app (Vercel, raiz `front`).
- API: https://reparae-api.onrender.com/docs (Render, raiz `API`, comando `uvicorn main:app --host 0.0.0.0 --port $PORT`).
- PostgreSQL: Neon, `DATABASE_URL` e `REPARAE_SECRET_KEY` somente no ambiente do servidor; configure `REPARAE_ENV=production`.
- Após backup do Neon, configure `DATABASE_URL` em terminal privado e execute `python importar_catalogo.py --origem CAMINHO_DO_SQLITE` para prévia. Só após revisar, repita com `--aplicar`. Não importa solicitações, contas reais ou senhas antigas. Contas fictícias novas recebem senhas aleatórias não divulgadas.
- Publique API antes do front-end, pois o seletor de serviços depende de `GET /profissionais/{id}/servicos`.
