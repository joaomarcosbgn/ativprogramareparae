"""Popula o banco de demonstração com 5 categorias, 15 serviços e 30 profissionais.

Execute com as dependências da API instaladas: python popular_catalogo.py
Idempotente: contas e serviços com os mesmos nomes não são duplicados.
As senhas são geradas aleatoriamente e gravadas em arquivo local NÃO versionado.
"""
import csv
import secrets
from pathlib import Path
from sqlalchemy import func
from database import SessionLocal, engine
from models import Base, Usuario, Profissional, Categoria, Servico, ProfissionalServico, PerfilProfissionalExtra
from security import hash_senha

CATALOGO = {
    'Tecnologia': [('Manutenção de Computador', 100), ('Limpeza de Gabinete e Periféricos', 70), ('Manutenção de TV', 150)],
    'Elétrica': [('Instalação de Tomadas', 90), ('Troca de Disjuntores', 120), ('Instalação de Ventilador de Teto', 140)],
    'Hidráulica': [('Reparo de Vazamentos', 110), ('Desentupimento de Pia', 100), ('Instalação de Torneiras', 80)],
    'Limpeza': [('Limpeza Residencial', 160), ('Limpeza Pós-Obra', 300), ('Higienização de Sofá', 190)],
    'Automotivo': [('Troca de Óleo', 90), ('Revisão de Freios', 170), ('Higienização Interna de Veículo', 140)],
}
REGIOES = ['Fortaleza - CE', 'Eusébio - CE', 'Aquiraz - CE', 'Maracanaú - CE', 'Caucaia - CE']
NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Mateus', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sabrina', 'Tiago', 'Vanessa', 'Wesley', 'Alice', 'Caio', 'Débora', 'Eduardo', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana', 'Lucas']


def popular():
    Base.metadata.create_all(bind=engine)
    credenciais = []
    with SessionLocal() as db:
        try:
            for indice_categoria, (nome_categoria, servicos) in enumerate(CATALOGO.items()):
                categoria = db.query(Categoria).filter(func.lower(Categoria.nome) == nome_categoria.lower()).first()
                if not categoria:
                    categoria = Categoria(nome=nome_categoria, descricao=f'Serviços de {nome_categoria.lower()}')
                    db.add(categoria)
                    db.flush()
                for indice_servico, (nome_servico, preco) in enumerate(servicos):
                    servico = db.query(Servico).filter(Servico.categoria_id == categoria.id, func.lower(Servico.nome) == nome_servico.lower()).first()
                    if not servico:
                        servico = Servico(categoria_id=categoria.id, nome=nome_servico, descricao=f'Atendimento de {nome_servico.lower()} com orçamento confirmado antes da execução.', preco=preco)
                        db.add(servico)
                        db.flush()
                    for posicao in range(2):
                        numero = indice_categoria * 6 + indice_servico * 2 + posicao
                        email = f'demo.prof{numero+1:02d}@reparae.example'
                        usuario = db.query(Usuario).filter(Usuario.email == email).first()
                        if not usuario:
                            senha = secrets.token_urlsafe(15)
                            usuario = Usuario(nome=f'{NOMES[numero]} {"Silva" if posicao == 0 else "Costa"}', email=email, senha=hash_senha(senha), tipo='profissional')
                            db.add(usuario)
                            db.flush()
                            credenciais.append((email, senha))
                        profissional = db.query(Profissional).filter(Profissional.usuario_id == usuario.id).first()
                        if not profissional:
                            profissional = Profissional(usuario_id=usuario.id, especialidade=nome_categoria, telefone=f'8599{numero+1:07d}', disponivel=1)
                            db.add(profissional)
                            db.flush()
                        if not db.get(ProfissionalServico, (profissional.id, servico.id)):
                            db.add(ProfissionalServico(profissional_id=profissional.id, servico_id=servico.id))
                        extra = db.get(PerfilProfissionalExtra, profissional.id)
                        if not extra:
                            db.add(PerfilProfissionalExtra(profissional_id=profissional.id, descricao=f'Atendimento em {nome_servico.lower()}', biografia='Perfil fictício para demonstração acadêmica.', experiencia='Profissional de demonstração', regiao=REGIOES[numero % len(REGIOES)]))
            db.commit()
        except Exception:
            db.rollback()
            raise
    if credenciais:
        caminho = Path(__file__).parent / 'CREDENCIAIS_DEMONSTRACAO_PRIVADO.csv'
        with caminho.open('w', encoding='utf-8', newline='') as f:
            w = csv.writer(f)
            w.writerow(['email', 'senha'])
            w.writerows(credenciais)
        print(f'Criadas {len(credenciais)} contas. Senhas novas em {caminho} (NÃO publicar).')
    else:
        print('Catálogo já existente: nenhuma nova conta criada.')

if __name__ == '__main__':
    popular()
