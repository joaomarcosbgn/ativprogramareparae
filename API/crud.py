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
