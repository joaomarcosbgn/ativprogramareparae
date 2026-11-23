# DER lógico atualizado — Reparaê

O banco de demonstração possui **sete tabelas de domínio**: `usuarios`, `profissionais`, `categorias`, `servicos`, `solicitacoes`, `profissional_servicos` e `perfis_profissionais_extra` (além da tabela interna `sqlite_sequence`).

```mermaid
erDiagram
    usuarios ||--o| profissionais : "possui perfil"
    usuarios ||--o{ solicitacoes : "solicita"
    profissionais ||--o{ solicitacoes : "recebe"
    categorias ||--o{ servicos : "contém"
    servicos ||--o{ solicitacoes : "solicitado"
    profissionais ||--o{ profissional_servicos : "oferece"
    servicos ||--o{ profissional_servicos : "é oferecido"
    profissionais ||--o| perfis_profissionais_extra : "complementa"
    usuarios {
        INTEGER id PK
        TEXT nome
        TEXT email UK
        TEXT senha
        TEXT tipo
    }
    profissionais {
        INTEGER id PK
        INTEGER usuario_id FK
        TEXT especialidade
        TEXT telefone
        INTEGER disponivel
    }
    categorias {
        INTEGER id PK
        TEXT nome UK
        TEXT descricao
    }
    servicos {
        INTEGER id PK
        INTEGER categoria_id FK
        TEXT nome
        TEXT descricao
        REAL preco
    }
    solicitacoes {
        INTEGER id PK
        INTEGER usuario_id FK
        INTEGER profissional_id FK
        INTEGER servico_id FK
        TEXT status
        TEXT data
    }
    profissional_servicos {
        INTEGER profissional_id PK,FK
        INTEGER servico_id PK,FK
    }
    perfis_profissionais_extra {
        INTEGER profissional_id PK,FK
        TEXT descricao
        TEXT biografia
        TEXT experiencia
        TEXT regiao
    }
```

## Regras principais

- `usuarios.tipo` aceita `cliente`, `profissional` e `admin`.
- `profissionais.usuario_id` é único: cada usuário profissional possui no máximo um perfil.
- `profissional_servicos` permite vincular muitos serviços a muitos profissionais, com chave primária composta.
- `solicitacoes` referencia cliente, profissional e serviço. A API valida que o profissional oferece o serviço solicitado.
- `solicitacoes.status` aceita `Pendente`, `Aceita`, `Recusada`, `Concluída` e `Cancelada`.
- A integridade referencial do SQLite é habilitada em cada conexão pelo `database.py`.

**Nota:** Este DER em Mermaid descreve a estrutura verificada no banco do ZIP; os PNGs antigos foram preservados como histórico e não foram regenerados.
