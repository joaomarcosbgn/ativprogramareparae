# Reparaê API — Cadastro de Usuários

API em **FastAPI** para cadastro e gerenciamento de usuários do Reparaê, usando o banco SQLite existente.

## Estrutura

```
reparae_api/
├── main.py            # rotas da API
├── database.py         # conexão com o SQLite
├── models.py            # modelos SQLAlchemy (usuarios, profissionais, servicos, solicitacoes)
├── schemas.py            # validação de dados (Pydantic)
├── crud.py                # funções de criação/leitura/atualização/exclusão
├── security.py              # hash e verificação de senha (bcrypt)
├── migrar_senhas.py           # script único para converter senhas antigas em texto puro
├── reparae.db                   # banco SQLite (gerado a partir do Reparae.sql)
└── requirements.txt
```

## Como rodar

1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

2. **Se o banco já tiver usuários com senha em texto puro** (como no dump original,
   onde a senha `123456` está salva sem criptografia), rode a migração **uma única vez**:
   ```bash
   python3 migrar_senhas.py
   ```
   Isso converte todas as senhas existentes para hash bcrypt, sem alterar os outros dados.

3. Suba o servidor:
   ```bash
   uvicorn main:app --reload
   ```

4. Acesse a documentação interativa (Swagger) em:
   ```
   http://127.0.0.1:8000/docs
   ```

## Rotas disponíveis

| Método | Rota              | Descrição                          |
|--------|-------------------|-------------------------------------|
| POST   | `/usuarios`       | Cadastrar novo usuário              |
| GET    | `/usuarios`       | Listar todos os usuários            |
| GET    | `/usuarios/{id}`  | Buscar um usuário pelo ID           |
| PUT    | `/usuarios/{id}`  | Atualizar dados de um usuário       |
| DELETE | `/usuarios/{id}`  | Remover um usuário                  |
| POST   | `/login`          | Autenticar (email + senha)          |

### Exemplo — Cadastrar usuário

```bash
curl -X POST http://127.0.0.1:8000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Teste",
    "email": "maria@email.com",
    "senha": "senha123",
    "tipo": "cliente"
  }'
```

`tipo` aceita apenas `"cliente"` ou `"profissional"` (mesmos valores usados no banco original).

### Exemplo — Login

```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@email.com", "senha": "senha123"}'
```

## Observações importantes

- **Senhas nunca são devolvidas** nas respostas da API — o campo `senha` fica só no banco, sempre em hash bcrypt.
- O e-mail é único: o cadastro/atualização bloqueia e-mails já usados por outro usuário. **Atenção:** no dump original, os usuários "Pedro" (id 1) e "Pedro Silva" (id 2) já têm o mesmo e-mail (`pedro@email.com`) — vale corrigir isso manualmente no banco, já que a API vai impedir novos cadastros duplicados, mas não altera dados já existentes.
- As tabelas `profissionais`, `servicos` e `solicitacoes` já estão modeladas em `models.py`, prontas pra você pedir os endpoints delas quando quiser expandir a API.
