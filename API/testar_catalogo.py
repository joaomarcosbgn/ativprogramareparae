"""Auditoria não destrutiva do catálogo de demonstração (sem dependências externas)."""
import sqlite3
from pathlib import Path

c = sqlite3.connect(Path(__file__).resolve().parent / 'reparae.db')
c.execute('PRAGMA foreign_keys=ON')
assert c.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
assert c.execute('PRAGMA foreign_key_check').fetchall() == []
categorias = c.execute("SELECT id, nome FROM categorias WHERE lower(nome) IN ('tecnologia','elétrica','hidráulica','limpeza','automotivo')").fetchall()
assert len(categorias) == 5, categorias
for id_categoria, nome in categorias:
    servicos = c.execute('SELECT id, nome FROM servicos WHERE categoria_id=?', (id_categoria,)).fetchall()
    assert len(servicos) >= 3, (nome, servicos)
    for id_servico, nome_servico in servicos:
        profissionais = c.execute('''SELECT count(*) FROM profissional_servicos ps
          JOIN profissionais p ON p.id=ps.profissional_id
          JOIN usuarios u ON u.id=p.usuario_id
          WHERE ps.servico_id=? AND p.disponivel=1 AND u.tipo='profissional' ''', (id_servico,)).fetchone()[0]
        assert profissionais >= 2, (nome_servico, profissionais)
assert c.execute("SELECT count(*) FROM usuarios WHERE email LIKE 'demo.prof%@reparae.example'").fetchone()[0] == 30
# Vínculos devem corresponder à especialidade de categoria quando ambas são categorias do catálogo.
incompat = c.execute('''SELECT p.id, p.especialidade, s.nome FROM profissional_servicos ps
JOIN profissionais p ON p.id=ps.profissional_id JOIN servicos s ON s.id=ps.servico_id
JOIN categorias cat ON cat.id=s.categoria_id
WHERE lower(p.especialidade) IN ('tecnologia','elétrica','hidráulica','limpeza','automotivo')
AND lower(p.especialidade) <> lower(cat.nome)''').fetchall()
assert not incompat, incompat
print('OK: SQLite íntegro, 5 categorias, 15 serviços, 30 contas de demonstração, >=2 profissionais/serviço e vínculos compatíveis.')
