from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    senha = Column(String, nullable=False)
    tipo = Column(String, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('cliente', 'profissional', 'admin')",
            name="ck_usuario_tipo",
        ),
    )

    profissional = relationship(
        "Profissional",
        back_populates="usuario",
        uselist=False,
    )


class Profissional(Base):
    __tablename__ = "profissionais"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
        unique=True,
    )
    especialidade = Column(String, nullable=False)
    telefone = Column(String, nullable=False)
    disponivel = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint(
            "disponivel IN (0, 1)",
            name="ck_profissional_disponivel",
        ),
    )

    usuario = relationship(
        "Usuario",
        back_populates="profissional",
    )
    solicitacoes = relationship(
        "Solicitacao",
        back_populates="profissional",
    )


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)
    descricao = Column(String, nullable=True)

    servicos = relationship(
        "Servico",
        back_populates="categoria",
    )


class Servico(Base):
    __tablename__ = "servicos"

    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(
        Integer,
        ForeignKey(
            "categorias.id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    nome = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
    preco = Column(Float, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "preco >= 0",
            name="ck_servico_preco",
        ),
    )

    categoria = relationship(
        "Categoria",
        back_populates="servicos",
    )
    solicitacoes = relationship(
        "Solicitacao",
        back_populates="servico",
    )


class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    profissional_id = Column(
        Integer,
        ForeignKey(
            "profissionais.id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    servico_id = Column(
        Integer,
        ForeignKey(
            "servicos.id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    status = Column(String, nullable=False, default="Pendente")
    data = Column(String, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "status IN ('Pendente', 'Aceita', 'Recusada', "
            "'Concluída', 'Cancelada')",
            name="ck_solicitacao_status",
        ),
    )

    profissional = relationship(
        "Profissional",
        back_populates="solicitacoes",
    )
    servico = relationship(
        "Servico",
        back_populates="solicitacoes",
    )
