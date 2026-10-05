from sqlalchemy.orm import Session

import models
import schemas
from security import hash_senha


# ============================================================
# USUÁRIOS
# ============================================================

def get_usuario(db: Session, usuario_id: int) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()


def get_usuario_por_email(db: Session, email: str) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def listar_usuarios(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Usuario]:
    return db.query(models.Usuario).offset(skip).limit(limit).all()


def criar_usuario(
    db: Session, usuario: schemas.UsuarioCreate
) -> models.Usuario:
    db_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=hash_senha(usuario.senha),
        tipo=usuario.tipo,
    )

    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)

    return db_usuario


def atualizar_usuario(
    db: Session, usuario_id: int, dados: schemas.UsuarioUpdate
) -> models.Usuario | None:
    db_usuario = get_usuario(db, usuario_id)

    if not db_usuario:
        return None

    dados_dict = dados.model_dump(exclude_unset=True)

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
