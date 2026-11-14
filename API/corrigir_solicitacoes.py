"""Corrige FK antiga de solicitacoes. Execute com a API parada: python corrigir_solicitacoes.py"""
import sqlite3
from datetime import datetime
from pathlib import Path

banco = Path(__file__).resolve().parent / "reparae.db"
if not banco.is_file():
    raise SystemExit("Banco nao encontrado: " + str(banco))

con = sqlite3.connect(str(banco), timeout=5)
try:
    con.execute("PRAGMA busy_timeout=5000")
    fk = con.execute("PRAGMA foreign_key_list(solicitacoes)").fetchall()
    servico_fk = [r for r in fk if r[3] == "servico_id"]
    if servico_fk and servico_fk[0][2] == "servicos":
        print("A tabela solicitacoes ja aponta para servicos. Nenhuma alteracao necessaria.")
    elif not servico_fk:
        raise RuntimeError("Estrutura inesperada: FK servico_id ausente")
    else:
        inconsistentes = con.execute("""SELECT s.id FROM solicitacoes s
            LEFT JOIN usuarios u ON u.id=s.usuario_id
            LEFT JOIN profissionais p ON p.id=s.profissional_id
            LEFT JOIN servicos v ON v.id=s.servico_id
            WHERE u.id IS NULL OR p.id IS NULL OR v.id IS NULL""").fetchall()
        if inconsistentes:
            raise RuntimeError("Solicitacoes com referencias invalidas: " + str(inconsistentes[:10]))
        backup = banco.with_name("reparae_backup_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".db")
        with sqlite3.connect(str(backup)) as destino:
            con.backup(destino)
        print("Backup criado:", backup)
        con.execute("PRAGMA foreign_keys=OFF")
        con.execute("BEGIN IMMEDIATE")
        try:
            con.execute("""CREATE TABLE solicitacoes_nova (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                profissional_id INTEGER NOT NULL REFERENCES profissionais(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                servico_id INTEGER NOT NULL REFERENCES servicos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                status TEXT NOT NULL DEFAULT 'Pendente' CHECK(status IN ('Pendente','Aceita','Recusada','Concluída','Cancelada')),
                data TEXT NOT NULL)""")
            con.execute("""INSERT INTO solicitacoes_nova(id,usuario_id,profissional_id,servico_id,status,data)
                SELECT id,usuario_id,profissional_id,servico_id,status,data FROM solicitacoes""")
            con.execute("DROP TABLE solicitacoes")
            con.execute("ALTER TABLE solicitacoes_nova RENAME TO solicitacoes")
            problemas = con.execute("PRAGMA foreign_key_check").fetchall()
            if problemas:
                raise RuntimeError("Chaves estrangeiras invalidas: " + str(problemas))
            con.commit()
            print("Correcao concluida. Registros preservados.")
        except Exception:
            con.rollback()
            raise
finally:
    con.close()
