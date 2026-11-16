"""Testes SQLite isolados: nunca altera reparae.db. Execute python testar_banco_isolado.py."""
import sqlite3, tempfile, shutil
from pathlib import Path

origem = Path(__file__).with_name('reparae.db')
if not origem.exists():
    raise SystemExit('Banco local ausente; não é possível criar a cópia de testes.')

with tempfile.TemporaryDirectory(prefix='reparae_testes_') as pasta:
    destino = Path(pasta) / 'teste.db'
    # SQLite backup API: cópia consistente mesmo com WAL
    with sqlite3.connect(origem) as base, sqlite3.connect(destino) as copia:
        base.backup(copia)
    con = sqlite3.connect(destino)
    con.execute('PRAGMA foreign_keys=ON')
    checks = []
    def testar(nome, condicao):
        assert condicao, f'FALHOU: {nome}'
        checks.append(nome)
        print('OK:', nome)
    try:
        testar('integridade inicial', con.execute('PRAGMA integrity_check').fetchone()[0] == 'ok')
        testar('chaves estrangeiras iniciais', not con.execute('PRAGMA foreign_key_check').fetchall())
        sufixo = '_teste_isolado_2026'
        cid = con.execute('INSERT INTO categorias (nome) VALUES (?)', ('Categoria'+sufixo,)).lastrowid
        sid = con.execute('INSERT INTO servicos (nome,categoria_id,preco) VALUES (?,?,?)', ('Servico'+sufixo,cid,75.0)).lastrowid
        profissionais = []
        for i in range(15):
            uid = con.execute('INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)',
                (f'Profissional Teste {i:02}',f'prof{i}{sufixo}@example.invalid','NAO_USAR_LOGIN','profissional')).lastrowid
            pid = con.execute('INSERT INTO profissionais (usuario_id,especialidade,telefone,disponivel) VALUES (?,?,?,?)',
                (uid,'Categoria'+sufixo,'00000000000',1)).lastrowid
            con.execute('INSERT INTO profissional_servicos (profissional_id,servico_id) VALUES (?,?)',(pid,sid))
            profissionais.append(pid)
        cliente = con.execute('INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)',
            ('Cliente Teste',f'cliente{sufixo}@example.invalid','NAO_USAR_LOGIN','cliente')).lastrowid
        testar('15 profissionais criados', len(profissionais)==15)
        testar('vínculos de serviços criados',con.execute('SELECT count(*) FROM profissional_servicos WHERE servico_id=?',(sid,)).fetchone()[0]==15)
        def pagina(numero, limite=6):
            return con.execute('''SELECT p.id FROM profissionais p JOIN usuarios u ON u.id=p.usuario_id
                WHERE u.email LIKE ? ORDER BY u.nome ASC LIMIT ? OFFSET ?''',('%'+sufixo+'@example.invalid',limite,(numero-1)*limite)).fetchall()
        p1,p2,p3,p4 = (pagina(n) for n in range(1,5))
        testar('paginação 6/6/3/0',list(map(len,(p1,p2,p3,p4)))==[6,6,3,0])
        testar('paginação sem duplicações',len({x[0] for pagina_atual in (p1,p2,p3) for x in pagina_atual})==15)
        ordem = [r[0] for r in con.execute('''SELECT u.nome FROM profissionais p JOIN usuarios u ON u.id=p.usuario_id
            WHERE u.email LIKE ? ORDER BY u.nome DESC''',('%'+sufixo+'@example.invalid',))]
        testar('ordenação descendente',ordem==sorted(ordem,reverse=True))
        testar('filtro por especialidade',con.execute('SELECT count(*) FROM profissionais WHERE especialidade=?',('Categoria'+sufixo,)).fetchone()[0]==15)
        testar('filtro sem correspondência',con.execute('SELECT count(*) FROM profissionais WHERE especialidade=?',('Categoria_Inexistente'+sufixo,)).fetchone()[0]==0)
        sol = con.execute('INSERT INTO solicitacoes (usuario_id,profissional_id,servico_id,status,data) VALUES (?,?,?,?,?)',
            (cliente,profissionais[0],sid,'Pendente','2026-11-16')).lastrowid
        testar('solicitação válida',bool(sol))
        try:
            con.execute('INSERT INTO solicitacoes (usuario_id,profissional_id,servico_id,status,data) VALUES (?,?,?,?,?)',
                (cliente,999999999,sid,'Pendente','2026-11-16'))
        except sqlite3.IntegrityError:
            testar('bloqueio de profissional inexistente',True)
        else:
            testar('bloqueio de profissional inexistente',False)
        testar('integridade após inserts',con.execute('PRAGMA integrity_check').fetchone()[0]=='ok')
        testar('chaves estrangeiras após inserts',not con.execute('PRAGMA foreign_key_check').fetchall())
        print(f'RESULTADO: {len(checks)}/{len(checks)} testes aprovados (banco temporário excluído automaticamente)')
    finally:
        con.close()
