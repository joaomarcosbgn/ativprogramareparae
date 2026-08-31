from sqlalchemy.orm import Session
import models
import schemas
from security import hash_senha


def get_usuario(db: Session, usuario_id: int) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()


def get_usuario_por_email(db: Session, email: str) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def listar_usuarios(db: Session, skip: int = 0, limit: int = 100) -> list[models.Usuario]:
    return db.query(models.Usuario).offset(skip).limit(limit).all()


def criar_usuario(db: Session, usuario: schemas.UsuarioCreate) -> models.Usuario:
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
