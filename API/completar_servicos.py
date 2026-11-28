"""Complementa ofertas existentes por especialidade, sem excluir registros."""
from sqlalchemy import func, text
from database import SessionLocal
from models import Profissional, Categoria, Servico, ProfissionalServico


def completar(db):
    adicionados = 0
    for p in db.query(Profissional).order_by(Profissional.id).all():
        candidatos = db.query(Servico).join(Categoria).filter(
            func.lower(Categoria.nome) == p.especialidade.strip().lower()
        ).order_by(Servico.id).all()
        existentes = {x.servico_id for x in db.query(ProfissionalServico).filter_by(profissional_id=p.id)}
        total = sum(s.id in existentes for s in candidatos)
        for s in candidatos:
            if total >= 2:
                break
            if s.id not in existentes:
                db.add(ProfissionalServico(profissional_id=p.id, servico_id=s.id))
                total += 1
                adicionados += 1
    db.commit()
    return adicionados


def migrar_uma_vez(db):
    db.execute(text("CREATE TABLE IF NOT EXISTS reparae_migracoes (nome VARCHAR(100) PRIMARY KEY)"))
    r = db.execute(text("INSERT INTO reparae_migracoes (nome) VALUES (:nome) ON CONFLICT (nome) DO NOTHING"), {"nome": "completar_servicos_v1"})
    if r.rowcount == 0:
        db.commit()
        return 0
    return completar(db)


if __name__ == '__main__':
    with SessionLocal() as db:
        print('Novos vínculos:', completar(db))
