from sqlalchemy.orm import Session
from sqlalchemy import or_, func

import models
import schemas
from security import hash_senha


# ============================================================
# USUÁRIOS
# ============================================================

def get_usuario(db: Session, usuario_id: int) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()


def get_usuario_por_email(db: Session, email: str) -> models.Usuario | None:
    return db.query(models.Usuario).filter(func.lower(models.Usuario.email) == email.strip().lower()).first()


def listar_usuarios(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Usuario]:
    return db.query(models.Usuario).offset(skip).limit(limit).all()



def criar_usuario(
    db: Session, usuario: schemas.UsuarioCreate
) -> models.Usuario:

    if usuario.tipo == "profissional":
        if not usuario.telefone or not usuario.especialidade:
            raise ValueError(
                "Telefone e especialidade são obrigatórios para profissionais."
            )

    try:
        db_usuario = models.Usuario(
            nome=usuario.nome,
            email=str(usuario.email).strip().lower(),
            senha=hash_senha(usuario.senha),
            tipo=usuario.tipo,
        )

        db.add(db_usuario)
        db.flush()

        if usuario.tipo == "profissional":
            db_profissional = models.Profissional(
                usuario_id=db_usuario.id,
                especialidade=usuario.especialidade,
                telefone=usuario.telefone,
                disponivel=1,
            )

            db.add(db_profissional)

        db.commit()
        db.refresh(db_usuario)

        return db_usuario

    except Exception:
        db.rollback()
        raise



def atualizar_usuario(
    db: Session, usuario_id: int, dados: schemas.UsuarioUpdate
) -> models.Usuario | None:
    db_usuario = get_usuario(db, usuario_id)

    if not db_usuario:
        return None

    dados_dict = dados.model_dump(exclude_unset=True, exclude_none=True)
    dados_dict.pop("tipo", None)  # O tipo não muda pelo CRUD comum.

    if "email" in dados_dict:
        dados_dict["email"] = str(dados_dict["email"]).strip().lower()

    if "senha" in dados_dict:
        dados_dict["senha"] = hash_senha(dados_dict["senha"])

    for campo, valor in dados_dict.items():
        setattr(db_usuario, campo, valor)

    db.commit()
    db.refresh(db_usuario)

    return db_usuario


def deletar_usuario(db: Session, usuario_id: int) -> bool:
    db_usuario = get_usuario(db, usuario_id)

    if not db_usuario:
        return False

    # Respeita vínculos existentes e evita excluir contas com dados relacionados.
    if db_usuario.profissional is not None:
        db.delete(db_usuario.profissional)
        db.flush()
    db.delete(db_usuario)
    db.commit()

    return True


# ============================================================
# CATEGORIAS
# ============================================================

def get_categoria(
    db: Session, categoria_id: int
) -> models.Categoria | None:
    return (
        db.query(models.Categoria)
        .filter(models.Categoria.id == categoria_id)
        .first()
    )


def get_categoria_por_nome(
    db: Session, nome: str
) -> models.Categoria | None:
    return (
        db.query(models.Categoria)
        .filter(models.Categoria.nome == nome)
        .first()
    )


def listar_categorias(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Categoria]:
    return (
        db.query(models.Categoria)
        .offset(skip)
        .limit(limit)
        .all()
    )


def criar_categoria(
    db: Session, categoria: schemas.CategoriaCreate
) -> models.Categoria:
    db_categoria = models.Categoria(
        nome=categoria.nome,
        descricao=categoria.descricao,
    )

    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)

    return db_categoria


def atualizar_categoria(
    db: Session,
    categoria_id: int,
    dados: schemas.CategoriaUpdate,
) -> models.Categoria | None:
    db_categoria = get_categoria(db, categoria_id)

    if not db_categoria:
        return None

    dados_dict = dados.model_dump(exclude_unset=True)

    for campo, valor in dados_dict.items():
        setattr(db_categoria, campo, valor)

    db.commit()
    db.refresh(db_categoria)

    return db_categoria


def deletar_categoria(
    db: Session, categoria_id: int
) -> bool:
    db_categoria = get_categoria(db, categoria_id)

    if not db_categoria:
        return False

    db.delete(db_categoria)
    db.commit()

    return True


# ============================================================
# SERVIÇOS
# ============================================================

def get_servico(
    db: Session, servico_id: int
) -> models.Servico | None:
    return (
        db.query(models.Servico)
        .filter(models.Servico.id == servico_id)
        .first()
    )


def listar_servicos(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Servico]:
    return (
        db.query(models.Servico)
        .offset(skip)
        .limit(limit)
        .all()
    )


def listar_servicos_por_categoria(
    db: Session,
    categoria_id: int,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Servico]:
    return (
        db.query(models.Servico)
        .filter(models.Servico.categoria_id == categoria_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def criar_servico(
    db: Session, servico: schemas.ServicoCreate
) -> models.Servico:
    db_servico = models.Servico(
        categoria_id=servico.categoria_id,
        nome=servico.nome,
        descricao=servico.descricao,
        preco=servico.preco,
    )

    db.add(db_servico)
    db.commit()
    db.refresh(db_servico)

    return db_servico


def atualizar_servico(
    db: Session,
    servico_id: int,
    dados: schemas.ServicoUpdate,
) -> models.Servico | None:
    db_servico = get_servico(db, servico_id)

    if not db_servico:
        return None

    dados_dict = dados.model_dump(exclude_unset=True)

    for campo, valor in dados_dict.items():
        setattr(db_servico, campo, valor)

    db.commit()
    db.refresh(db_servico)

    return db_servico


def deletar_servico(
    db: Session, servico_id: int
) -> bool:
    db_servico = get_servico(db, servico_id)

    if not db_servico:
        return False

    db.delete(db_servico)
    db.commit()

    return True


# ============================================================
# PROFISSIONAIS REAIS (PESQUISA PÚBLICA)
# ============================================================

def _profissional_publico(profissional, db):
    extra = db.get(models.PerfilProfissionalExtra, profissional.id)
    return {
        "id": profissional.id,
        "usuario_id": profissional.usuario_id,
        "nome": profissional.usuario.nome,
        "especialidade": profissional.especialidade,
        "telefone": profissional.telefone,
        "disponivel": profissional.disponivel,
        **{campo: getattr(extra, campo, "") if extra else "" for campo in ("descricao", "biografia", "experiencia", "regiao")},
    }


def _consulta_profissionais_filtrada(db, q="", categoria="", regiao=""):
    """Consulta compartilhada para resultados e contagem, sem divergir filtros."""
    consulta = (db.query(models.Profissional)
                .join(models.Usuario)
                .filter(models.Profissional.disponivel == 1,
                        models.Usuario.tipo == "profissional"))
    if q.strip():
        termo = f"%{q.strip()}%"
        consulta = consulta.filter(or_(models.Usuario.nome.ilike(termo),
                                       models.Profissional.especialidade.ilike(termo)))
    if categoria.strip():
        consulta = consulta.filter(models.Profissional.especialidade.ilike(categoria.strip()))
    if regiao.strip():
        consulta = (consulta.join(models.PerfilProfissionalExtra,
                                 models.PerfilProfissionalExtra.profissional_id == models.Profissional.id)
                    .filter(models.PerfilProfissionalExtra.regiao.ilike(f"%{regiao.strip()}%")))
    return consulta


def contar_profissionais(db, q="", categoria="", regiao=""):
    """Total de profissionais que correspondem aos filtros, antes da paginação."""
    return _consulta_profissionais_filtrada(db, q, categoria, regiao).count()


def pesquisar_profissionais(db, q="", categoria="", regiao="", ordenar="nome_asc", skip=0, limit=50):
    """Filtra, ordena e pagina profissionais disponíveis diretamente no banco."""
    consulta = _consulta_profissionais_filtrada(db, q, categoria, regiao)
    ordens = {
        "nome_asc": (models.Usuario.nome.asc(), models.Profissional.id.asc()),
        "nome_desc": (models.Usuario.nome.desc(), models.Profissional.id.asc()),
        "especialidade_asc": (models.Profissional.especialidade.asc(), models.Usuario.nome.asc(), models.Profissional.id.asc()),
        "especialidade_desc": (models.Profissional.especialidade.desc(), models.Usuario.nome.asc(), models.Profissional.id.asc()),
    }
    return [_profissional_publico(p, db) for p in consulta.order_by(*ordens.get(ordenar, ordens["nome_asc"])).offset(skip).limit(limit).all()]


def obter_profissional_publico(db, profissional_id):
    p = (db.query(models.Profissional).join(models.Usuario)
         .filter(models.Profissional.id == profissional_id,
                 models.Profissional.disponivel == 1,
                 models.Usuario.tipo == "profissional").first())
    return _profissional_publico(p, db) if p else None
