PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;
-- ============================================================
-- REPARAÊ
-- Banco de dados inicial
--
-- Tipos de usuário:
--   cliente
--   profissional
--   admin
--
-- O banco começa sem usuários cadastrados.
-- Os usuários serão criados pela API, que ficará responsável
-- por gerar o hash bcrypt das senhas.
-- ============================================================
-- ============================================================
-- 1. USUÁRIOS
-- ============================================================
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL
        CHECK (
            tipo IN (
                'cliente',
                'profissional',
                'admin'
            )
        )
);
-- ============================================================
-- 2. PROFISSIONAIS
--
-- Um usuário do tipo profissional poderá possuir um único
-- cadastro profissional.
-- ============================================================
CREATE TABLE profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    especialidade TEXT NOT NULL,
    telefone TEXT NOT NULL,
    disponivel INTEGER NOT NULL DEFAULT 1
        CHECK (disponivel IN (0, 1)),
    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
-- ============================================================
-- 3. SERVIÇOS
--
-- O preço representa um preço inicial/base.
-- O valor final pode depender do serviço solicitado.
-- ============================================================
CREATE TABLE servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco REAL NOT NULL
        CHECK (preco >= 0)
);
-- ============================================================
-- 4. SOLICITAÇÕES
-- ============================================================
CREATE TABLE solicitacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    profissional_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente'
        CHECK (
            status IN (
                'Pendente',
                'Aceita',
                'Recusada',
                'Concluída',
                'Cancelada'
            )
        ),
    data TEXT NOT NULL,
    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (profissional_id)
        REFERENCES profissionais(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (servico_id)
        REFERENCES servicos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
-- ============================================================
-- 5. SERVIÇOS INICIAIS
--
-- Estes são os serviços-base do Reparaê.
-- Novos serviços poderão ser adicionados posteriormente
-- pelo administrador.
-- ============================================================
INSERT INTO servicos
    (nome, descricao, preco)
VALUES
    (
        'Eletricista',
        'Instalações, reparos e manutenção elétrica residencial.',
        100.00
    ),
    (
        'Pintor',
        'Pintura, preparação e acabamento de ambientes residenciais.',
        150.00
    ),
    (
        'Pedreiro',
        'Pequenos reparos, reformas e serviços de alvenaria.',
        200.00
    );
-- ============================================================
-- 6. ÍNDICES
-- ============================================================
CREATE INDEX idx_profissionais_usuario
    ON profissionais(usuario_id);
CREATE INDEX idx_solicitacoes_usuario
    ON solicitacoes(usuario_id);
CREATE INDEX idx_solicitacoes_profissional
    ON solicitacoes(profissional_id);
CREATE INDEX idx_solicitacoes_servico
    ON solicitacoes(servico_id);
COMMIT;