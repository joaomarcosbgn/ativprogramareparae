from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db
from security import verificar_senha


models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Reparaê API",
    description="API de cadastro e serviços do Reparaê",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def raiz():
    return {"mensagem": "API Reparaê no ar 🚀"}


# ============================================================
# USUÁRIOS
# ============================================================

@app.post(
    "/usuarios",
    response_model=schemas.UsuarioOut,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_usuario(
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
):
    if crud.get_usuario_por_email(db, usuario.email):
        raise HTTPException(
            status_code=400,
            detail="Este e-mail já está cadastrado.",
        )

    return crud.criar_usuario(db, usuario)


@app.get(
    "/usuarios",
    response_model=list[schemas.UsuarioOut],
)
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud.listar_usuarios(db, skip=skip, limit=limit)


@app.get(
    "/usuarios/{usuario_id}",
    response_model=schemas.UsuarioOut,
)
def buscar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
):
    db_usuario = crud.get_usuario(db, usuario_id)

    if not db_usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return db_usuario


@app.put(
    "/usuarios/{usuario_id}",
    response_model=schemas.UsuarioOut,
)
def atualizar_usuario(
    usuario_id: int,
    dados: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
):
    if dados.email:
        existente = crud.get_usuario_por_email(db, dados.email)

        if existente and existente.id != usuario_id:
            raise HTTPException(
                status_code=400,
                detail="Este e-mail já está em uso por outro usuário.",
            )

    db_usuario = crud.atualizar_usuario(
        db,
        usuario_id,
        dados,
    )

    if not db_usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return db_usuario


@app.delete(
    "/usuarios/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
):
    sucesso = crud.deletar_usuario(
        db,
        usuario_id,
    )

    if not sucesso:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return None


# ============================================================
# LOGIN
# ============================================================

@app.post(
    "/login",
    response_model=schemas.UsuarioOut,
)
def login(
    dados: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    db_usuario = crud.get_usuario_por_email(
        db,
        dados.email,
    )

    if not db_usuario or not verificar_senha(
        dados.senha,
        db_usuario.senha,
    ):
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos.",
        )

    return db_usuario


# ============================================================
# CATEGORIAS
# ============================================================

@app.post(
    "/categorias",
    response_model=schemas.CategoriaOut,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_categoria(
    categoria: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
):
    if crud.get_categoria_por_nome(
        db,
        categoria.nome,
    ):
        raise HTTPException(
            status_code=400,
            detail="Esta categoria já está cadastrada.",
        )

    return crud.criar_categoria(
        db,
        categoria,
    )


@app.get(
    "/categorias",
    response_model=list[schemas.CategoriaOut],
)
def listar_categorias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud.listar_categorias(
        db,
        skip=skip,
        limit=limit,
    )


@app.get(
    "/categorias/{categoria_id}",
    response_model=schemas.CategoriaOut,
)
def buscar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
):
    db_categoria = crud.get_categoria(
        db,
        categoria_id,
    )

    if not db_categoria:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada.",
        )

    return db_categoria


@app.put(
    "/categorias/{categoria_id}",
    response_model=schemas.CategoriaOut,
)
def atualizar_categoria(
    categoria_id: int,
    dados: schemas.CategoriaUpdate,
    db: Session = Depends(get_db),
):
    if dados.nome:
        existente = crud.get_categoria_por_nome(
            db,
            dados.nome,
        )

        if existente and existente.id != categoria_id:
            raise HTTPException(
                status_code=400,
                detail="Esta categoria já está cadastrada.",
            )

    db_categoria = crud.atualizar_categoria(
        db,
        categoria_id,
        dados,
    )

    if not db_categoria:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada.",
        )

    return db_categoria


@app.delete(
    "/categorias/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
):
    try:
        sucesso = crud.deletar_categoria(
            db,
            categoria_id,
        )

        if not sucesso:
            raise HTTPException(
                status_code=404,
                detail="Categoria não encontrada.",
            )

        return None

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "Não é possível excluir esta categoria "
                "porque existem serviços vinculados a ela."
            ),
        )


# ============================================================
# SERVIÇOS
# ============================================================

@app.post(
    "/servicos",
    response_model=schemas.ServicoOut,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_servico(
    servico: schemas.ServicoCreate,
    db: Session = Depends(get_db),
):
    if not crud.get_categoria(
        db,
        servico.categoria_id,
    ):
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada.",
        )

    return crud.criar_servico(
        db,
        servico,
    )


@app.get(
    "/servicos",
    response_model=list[schemas.ServicoOut],
)
def listar_servicos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud.listar_servicos(
        db,
        skip=skip,
        limit=limit,
    )


# IMPORTANTE:
# Esta rota precisa ficar antes de /servicos/{servico_id}.
@app.get(
    "/servicos/categoria/{categoria_id}",
    response_model=list[schemas.ServicoOut],
)
def listar_servicos_por_categoria(
    categoria_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if not crud.get_categoria(
        db,
        categoria_id,
    ):
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada.",
        )

    return crud.listar_servicos_por_categoria(
        db,
        categoria_id,
        skip=skip,
        limit=limit,
    )


@app.get(
    "/servicos/{servico_id}",
    response_model=schemas.ServicoOut,
)
def buscar_servico(
    servico_id: int,
    db: Session = Depends(get_db),
):
    db_servico = crud.get_servico(
        db,
        servico_id,
    )

    if not db_servico:
        raise HTTPException(
            status_code=404,
            detail="Serviço não encontrado.",
        )

    return db_servico


@app.put(
    "/servicos/{servico_id}",
    response_model=schemas.ServicoOut,
)
def atualizar_servico(
    servico_id: int,
    dados: schemas.ServicoUpdate,
    db: Session = Depends(get_db),
):
    if dados.categoria_id is not None:
        if not crud.get_categoria(
            db,
            dados.categoria_id,
        ):
            raise HTTPException(
                status_code=404,
                detail="Categoria não encontrada.",
            )

    db_servico = crud.atualizar_servico(
        db,
        servico_id,
        dados,
    )

    if not db_servico:
        raise HTTPException(
            status_code=404,
            detail="Serviço não encontrado.",
        )

    return db_servico


@app.delete(
    "/servicos/{servico_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_servico(
    servico_id: int,
    db: Session = Depends(get_db),
):
    sucesso = crud.deletar_servico(
        db,
        servico_id,
    )

    if not sucesso:
        raise HTTPException(
            status_code=404,
            detail="Serviço não encontrado.",
        )

    return None
