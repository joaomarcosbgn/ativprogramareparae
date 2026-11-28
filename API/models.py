from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
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


class ProfissionalServico(Base):
    __tablename__ = "profissional_servicos"
    profissional_id = Column(Integer, ForeignKey("profissionais.id", ondelete="CASCADE"), primary_key=True)
    servico_id = Column(Integer, ForeignKey("servicos.id", ondelete="CASCADE"), primary_key=True)


class PerfilProfissionalExtra(Base):
    __tablename__ = "perfis_profissionais_extra"
    profissional_id = Column(Integer, ForeignKey("profissionais.id", ondelete="CASCADE"), primary_key=True)
    descricao = Column(String, nullable=False, default="")
    biografia = Column(String, nullable=False, default="")
    experiencia = Column(String, nullable=False, default="")
    regiao = Column(String, nullable=False, default="")


class Pagamento(Base):
    """Cobrança Pix (Mercado Pago). Uma linha por solicitação (UNIQUE) impede duplicidade."""
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    solicitacao_id = Column(
        Integer,
        ForeignKey("solicitacoes.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    valor_centavos = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="criando")
    tentativa = Column(Integer, nullable=False, default=1)
    mp_payment_id = Column(String, nullable=True, unique=True)
    qr_code = Column(Text, nullable=True)
    qr_code_base64 = Column(Text, nullable=True)
    expiracao = Column(String, nullable=False)
    criado_em = Column(String, nullable=False)
    atualizado_em = Column(String, nullable=False)
    pago_em = Column(String, nullable=True)
    consultado_em = Column(Float, nullable=True)

    __table_args__ = (
        CheckConstraint("valor_centavos > 0", name="ck_pagamento_valor"),
        CheckConstraint(
            "status IN ('criando', 'pendente', 'pago', 'expirado', "
            "'rejeitado', 'cancelado', 'estornado', 'divergente')",
            name="ck_pagamento_status",
        ),
    )

    solicitacao = relationship("Solicitacao")
