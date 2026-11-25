"""Importa somente catálogo fictício do SQLite, sem copiar senhas ou solicitações.
Prévia por padrão; --aplicar confirma escrita. Execute fora do servidor público.
"""
import argparse, sqlite3, secrets
from pathlib import Path
from sqlalchemy import func
from database import SessionLocal, engine
from models import Usuario, Profissional, Categoria, Servico, ProfissionalServico, PerfilProfissionalExtra
from security import hash_senha

def importar(origem, aplicar=False):
    with sqlite3.connect(Path(origem).resolve().as_uri()+'?mode=ro',uri=True) as src, SessionLocal() as db:
        src.row_factory=sqlite3.Row
        if src.execute('pragma integrity_check').fetchone()[0]!='ok' or src.execute('pragma foreign_key_check').fetchall(): raise ValueError('Origem inconsistente')
        if engine.url.get_backend_name()=='sqlite' and Path(engine.url.database).resolve()==Path(origem).resolve(): raise ValueError('Origem e destino iguais')
        cats={}; servs={}; counts=dict(categorias=0,servicos=0,usuarios=0,profissionais=0,vinculos=0,perfis=0)
        for row in src.execute('select * from categorias'):
            obj=db.query(Categoria).filter(Categoria.nome==row['nome']).first()
            if not obj:
                obj=Categoria(nome=row['nome'],descricao=row['descricao']); db.add(obj); db.flush(); counts['categorias']+=1
            cats[row['id']]=obj.id
        for row in src.execute('select * from servicos'):
            cid=cats[row['categoria_id']]; obj=db.query(Servico).filter(Servico.categoria_id==cid,Servico.nome==row['nome']).first()
            if not obj:
                obj=Servico(categoria_id=cid,nome=row['nome'],descricao=row['descricao'],preco=row['preco']); db.add(obj); db.flush(); counts['servicos']+=1
            servs[row['id']]=obj.id
        for row in src.execute("select u.nome,u.email,p.* from usuarios u join profissionais p on p.usuario_id=u.id where u.tipo='profissional' and u.email like 'demo.prof%@reparae.example'"):
            obj=db.query(Usuario).filter(func.lower(Usuario.email)==row['email'].lower()).first()
            if obj:
                # Nunca alterar contas existentes; conflito precisa de revisão humana.
                if obj.tipo!='profissional': raise ValueError('Conflito de conta de demonstração')
            else:
                obj=Usuario(nome=row['nome'],email=row['email'],senha=hash_senha(secrets.token_urlsafe(32)),tipo='profissional'); db.add(obj); db.flush(); counts['usuarios']+=1
            p=db.query(Profissional).filter_by(usuario_id=obj.id).first()
            if not p:
                p=Profissional(usuario_id=obj.id,especialidade=row['especialidade'],telefone=row['telefone'],disponivel=row['disponivel']); db.add(p); db.flush(); counts['profissionais']+=1
            for link in src.execute('select servico_id from profissional_servicos where profissional_id=?',(row['id'],)):
                sid=servs[link[0]]
                if not db.get(ProfissionalServico,(p.id,sid)):
                    db.add(ProfissionalServico(profissional_id=p.id,servico_id=sid)); counts['vinculos']+=1
            extra=src.execute('select * from perfis_profissionais_extra where profissional_id=?',(row['id'],)).fetchone()
            if extra and not db.get(PerfilProfissionalExtra,p.id):
                db.add(PerfilProfissionalExtra(profissional_id=p.id,**{k:extra[k] for k in ('descricao','biografia','experiencia','regiao')})); counts['perfis']+=1
        db.flush()
        if aplicar: db.commit()
        else: db.rollback()
        print('APLICADO' if aplicar else 'PRÉVIA (rollback)',counts)
        return counts

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--origem',required=True); parser.add_argument('--aplicar',action='store_true'); args=parser.parse_args()
    importar(args.origem,args.aplicar)
