
import sqlite3
from pathlib import Path

# Localiza o banco na pasta API
banco = Path(__file__).resolve().parent / "reparae.db"

conexao = sqlite3.connect(banco)

try:
    conexao.execute("PRAGMA foreign_keys = OFF")
    conexao.execute("BEGIN")

    # Cria a nova tabela com os relacionamentos corretos
    conexao.execute("""
        CREATE TABLE solicitacoes_nova (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            profissional_id INTEGER NOT NULL,
            servico_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendente',
            data TEXT NOT NULL,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON UPDATE CASCADE ON DELETE RESTRICT,

            FOREIGN KEY (profissional_id)
                REFERENCES profissionais(id)
                ON UPDATE CASCADE ON DELETE RESTRICT,

            FOREIGN KEY (servico_id)
                REFERENCES servicos(id)
                ON UPDATE CASCADE ON DELETE RESTRICT,

            CHECK (
                status IN (
                    'Pendente', 'Aceita', 'Recusada',
                    'Concluída', 'Cancelada'
                )
            )
        )
    """)

    # Preserva os registros existentes
    conexao.execute("""
        INSERT INTO solicitacoes_nova
        (id, usuario_id, profissional_id, servico_id, status, data)
        SELECT id, usuario_id, profissional_id, servico_id, status, data
        FROM solicitacoes
    """)

    conexao.execute("DROP TABLE solicitacoes")
    conexao.execute(
        "ALTER TABLE solicitacoes_nova RENAME TO solicitacoes"
    )

    conexao.commit()

    # Confere as chaves estrangeiras
    erros = conexao.execute("PRAGMA foreign_key_check").fetchall()

    if erros:
        print("Atenção: foram encontrados problemas:", erros)
    else:
        print("Correção concluída! Chaves estrangeiras verificadas.")

except Exception as erro:
    conexao.rollback()
    print("Erro na correção. Alterações desfeitas:", erro)

finally:
    conexao.execute("PRAGMA foreign_keys = ON")
    conexao.close()
