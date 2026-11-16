"""Auditoria não destrutiva do SQLite do Reparaê.
Execute: python verificar_integridade.py (dentro de API/).
"""
import sqlite3
from pathlib import Path

banco = Path(__file__).with_name('reparae.db')
if not banco.exists():
    raise SystemExit('Banco não encontrado. Inicie a API para criar as tabelas.')
con = sqlite3.connect(f'file:{banco.as_posix()}?mode=ro', uri=True)
try:
    integridade = con.execute('PRAGMA integrity_check').fetchone()[0]
    referencias = con.execute('PRAGMA foreign_key_check').fetchall()
    print('Integridade:', integridade)
    print('Chaves estrangeiras inválidas:', len(referencias))
    for item in referencias[:20]:
        print('  ', item)
    tabelas = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    esperadas = {'usuarios','profissionais','categorias','servicos','solicitacoes','profissional_servicos','perfis_profissionais_extra'}
    faltantes = esperadas - tabelas
    print('Tabelas ausentes:', ', '.join(sorted(faltantes)) or 'nenhuma')
    if not faltantes:
        inconsistencias = con.execute('''SELECT p.id, p.especialidade, s.nome, c.nome
            FROM profissional_servicos ps
            JOIN profissionais p ON p.id = ps.profissional_id
            JOIN servicos s ON s.id = ps.servico_id
            JOIN categorias c ON c.id = s.categoria_id
            WHERE lower(trim(p.especialidade)) <> lower(trim(c.nome))''').fetchall()
        print('Vínculos com especialidade diferente da categoria (revisar manualmente):', len(inconsistencias))
        for linha in inconsistencias: print('  Profissional %s: %s; serviço %s, categoria %s' % linha)
    if integridade != 'ok' or referencias or faltantes:
        raise SystemExit(1)
finally:
    con.close()
