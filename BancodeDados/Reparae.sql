Reparae.sql — Banco de dados Reparaê

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;
-- =====================================================
-- 1. USUÁRIOS
-- Clientes, profissionais e administradores
-- =====================================================
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL
        CHECK (tipo IN ('cliente', 'profissional', 'admin'))
);
-- =====================================================
-- 2. PROFISSIONAIS
-- Dados complementares de usuários profissionais
-- =====================================================
CREATE TABLE profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    especialidade TEXT NOT NULL,
    telefone TEXT NOT NULL,
    disponivel INTEGER NOT NULL DEFAULT 1
        CHECK (disponivel IN (0, 1)),
    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
-- =====================================================
-- 3. CATEGORIAS
-- Agrupam os tipos de serviços oferecidos
-- =====================================================
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT
);
-- =====================================================
-- 4. SERVIÇOS
-- Cada serviço pertence a uma categoria
-- =====================================================
CREATE TABLE servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco REAL NOT NULL CHECK (preco >= 0),
    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
-- =====================================================
-- 5. SOLICITAÇÕES
-- Relacionam cliente, profissional e serviço
-- =====================================================
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
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (profissional_id)
        REFERENCES profissionais(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (servico_id)
        REFERENCES servicos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
-- =====================================================
-- 6. CATEGORIAS INICIAIS
-- =====================================================
INSERT INTO categorias (nome, descricao)
VALUES
    ('Elétrica', 'Instalações e reparos elétricos residenciais.'),
    ('Pintura', 'Pintura e acabamento de ambientes.'),
    ('Alvenaria', 'Reformas, construções e reparos em alvenaria.');
-- =====================================================
-- 7. SERVIÇOS INICIAIS
-- Preços são valores iniciais de referência.
-- =====================================================
INSERT INTO servicos
    (categoria_id, nome, descricao, preco)
VALUES
    (
        1,
        'Serviço de Eletricista',
        'Instalações, reparos e manutenção elétrica residencial.',
        100.00
    ),
    (
        2,
        'Serviço de Pintor',
        'Pintura, preparação e acabamento de paredes.',
        150.00
    ),
    (
        3,
        'Serviço de Pedreiro',
        'Pequenos reparos, reformas e serviços de alvenaria.',
        200.00
    );
-- =====================================================
-- 8. ÍNDICES
-- =====================================================
CREATE INDEX idx_profissionais_usuario
    ON profissionais(usuario_id);
CREATE INDEX idx_servicos_categoria
    ON servicos(categoria_id);
CREATE INDEX idx_solicitacoes_usuario
    ON solicitacoes(usuario_id);
CREATE INDEX idx_solicitacoes_profissional
    ON solicitacoes(profissional_id);
CREATE INDEX idx_solicitacoes_servico
    ON solicitacoes(servico_id);
COMMIT;