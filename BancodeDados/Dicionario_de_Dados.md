# DICIONÁRIO DE DADOS - REPARAÊ

## 1. Objetivo

Documentar a estrutura do banco de dados do sistema Reparaê,
apresentando as tabelas, campos, tipos de dados, chaves
primárias, chaves estrangeiras e relacionamentos.

O banco de dados é composto por cinco tabelas principais:
usuarios, profissionais, categorias, servicos e solicitacoes.

---

## 2. Tabela: usuarios

Armazena os dados dos usuários do sistema.

| Campo | Tipo | Chave / Restrição | Descrição |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | Identificador único |
| nome | TEXT | NOT NULL | Nome do usuário |
| email | TEXT | NOT NULL, UNIQUE | E-mail exclusivo |
| senha | TEXT | NOT NULL | Senha do usuário |
| tipo | TEXT | NOT NULL, CHECK | Cliente, profissional ou admin |

---

## 3. Tabela: profissionais

Armazena informações complementares dos profissionais.

| Campo | Tipo | Chave / Restrição | Descrição |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | Identificador do profissional |
| usuario_id | INTEGER | NOT NULL, UNIQUE, FK | Referência ao usuário |
| especialidade | TEXT | NOT NULL | Especialidade profissional |
| telefone | TEXT | NOT NULL | Telefone de contato |
| disponivel | INTEGER | NOT NULL, DEFAULT 1, CHECK (0,1) | Disponibilidade do profissional |

---

## 4. Tabela: categorias

Armazena as categorias dos serviços oferecidos.

| Campo | Tipo | Chave / Restrição | Descrição |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | Identificador da categoria |
| nome | TEXT | NOT NULL, UNIQUE | Nome da categoria |
| descricao | TEXT | Opcional | Descrição da categoria |

---

## 5. Tabela: servicos

Armazena os serviços disponíveis no sistema.

| Campo | Tipo | Chave / Restrição | Descrição |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | Identificador do serviço |
| categoria_id | INTEGER | NOT NULL, FK | Categoria do serviço |
| nome | TEXT | NOT NULL | Nome do serviço |
| descricao | TEXT | Opcional | Descrição do serviço |
| preco | REAL | NOT NULL, CHECK (preco >= 0) | Preço do serviço |

---

## 6. Tabela: solicitacoes

Armazena as solicitações realizadas pelos usuários.

| Campo | Tipo | Chave / Restrição | Descrição |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | Identificador da solicitação |
| usuario_id | INTEGER | NOT NULL, FK | Usuário solicitante |
| profissional_id | INTEGER | NOT NULL, FK | Profissional associado |
| servico_id | INTEGER | NOT NULL, FK | Serviço solicitado |
| status | TEXT | NOT NULL, DEFAULT 'Pendente', CHECK | Situação da solicitação |
| data | TEXT | NOT NULL | Data da solicitação |

Os status permitidos são:
- Pendente
- Aceita
- Recusada
- Concluída
- Cancelada

---

## 7. Relacionamentos e Cardinalidades

- usuarios e profissionais: relacionamento 1 para 0 ou 1.
- usuarios e solicitacoes: relacionamento 1 para N.
- profissionais e solicitacoes: relacionamento 1 para N.
- categorias e servicos: relacionamento 1 para N.
- servicos e solicitacoes: relacionamento 1 para N.

---

## 8. Regras de Integridade

- Cada usuário possui um identificador único.
- O e-mail dos usuários não pode se repetir.
- Cada profissional está associado a um usuário.
- Cada serviço pertence a uma categoria.
- O preço dos serviços não pode ser negativo.
- Cada solicitação está associada a um usuário,
  um profissional e um serviço.
- A disponibilidade do profissional aceita somente
  os valores 0 ou 1.
- O status da solicitação deve respeitar os valores permitidos.
- As chaves estrangeiras utilizam ON UPDATE CASCADE
  e ON DELETE RESTRICT.

---

## 9. Legenda

PK: Chave Primária.
FK: Chave Estrangeira.
NOT NULL: Campo obrigatório.
UNIQUE: Valor exclusivo, não repetido.
CHECK: Restrição de validação.
DEFAULT: Valor padrão.
AUTOINCREMENT: Numeração automática.

---

## 10. Arquivos do Planejamento do Banco de Dados

- Reparae.sql: Script de criação e estrutura do banco.
- diagramas/DER.png: Diagrama Entidade-Relacionamento.
- Dicionario_de_Dados.md: Documentação das tabelas,
  campos, tipos de dados e relacionamentos.

---

## 11. Conclusão

O planejamento do banco de dados do sistema Reparaê
documenta a estrutura necessária para armazenar e
organizar as informações dos usuários, profissionais,
categorias, serviços e solicitações.

A documentação auxilia no desenvolvimento,
na manutenção e na evolução do sistema.