
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db
from security import (
    verificar_senha,
    criar_token_acesso,
    obter_id_usuario_token,
)


# ============================================================
# INICIALIZAÇÃO
# ============================================================

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Reparaê API",
    description="API de cadastro e serviços do Reparaê",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTENTICAÇÃO E PERMISSÕES
# ============================================================

def obter_usuario_atual(
    usuario_id: int = Depends(obter_id_usuario_token),
    db: Session = Depends(get_db),
):
    """Obtém o usuário identificado pelo token JWT."""

    usuario = crud.get_usuario(db, usuario_id)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado. Faça login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


def exigir_admin(
    usuario=Depends(obter_usuario_atual),
):
    """Permite o acesso somente a administradores."""

    if usuario.tipo != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido somente para administradores.",
        )

    return usuario


def exigir_proprio_usuario_ou_admin(
    usuario_id: int,
    usuario_atual=Depends(obter_usuario_atual),
):
    """Permite acessar os próprios dados ou agir como administrador."""

    if usuario_atual.id != usuario_id and usuario_atual.tipo != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este usuário.",
        )

    return usuario_atual


# ============================================================
# ROTA INICIAL
# ============================================================

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
    """Cadastro público de clientes e profissionais."""

    if crud.get_usuario_por_email(db, usuario.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado.",
        )

    # UsuarioCreate só aceita cliente ou profissional.
    # A criação de administradores deve ser feita separadamente.
    
    if usuario.tipo == "profissional":
        if not usuario.telefone or not usuario.especialidade:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Telefone e especialidade são obrigatórios para profissionais.",
            )

    try:
        return crud.criar_usuario(db, usuario)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível cadastrar o usuário. Verifique os dados informados.",
        )



@app.get(
    "/usuarios",
    response_model=list[schemas.UsuarioOut],
)
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin=Depends(exigir_admin),
):
    """Somente administradores podem listar todos os usuários."""

    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use skip >= 0 e limit entre 1 e 100.",
        )

    return crud.listar_usuarios(db, skip=skip, limit=limit)


@app.get(
    "/usuarios/{usuario_id}",
    response_model=schemas.UsuarioOut,
)
def buscar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(exigir_proprio_usuario_ou_admin),
):
    """O usuário consulta os próprios dados; o admin consulta qualquer um."""

    db_usuario = crud.get_usuario(db, usuario_id)

    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    usuario_atual=Depends(exigir_proprio_usuario_ou_admin),
):
    """Atualiza os dados permitidos do usuário."""

    db_usuario = crud.get_usuario(db, usuario_id)

    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Impede que alguém mude o próprio tipo de conta.
    # O administrador também não pode criar outro admin por esta rota.
    if dados.tipo is not None and dados.tipo != db_usuario.tipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O tipo da conta não pode ser alterado por esta rota.",
        )

    if dados.email:
        existente = crud.get_usuario_por_email(db, dados.email)

        if existente and existente.id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está em uso por outro usuário.",
            )

    try:
        usuario_atualizado = crud.atualizar_usuario(
            db,
            usuario_id,
            dados,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível atualizar os dados informados.",
        )

    if not usuario_atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return usuario_atualizado


@app.delete(
    "/usuarios/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(exigir_proprio_usuario_ou_admin),
):
    """O próprio usuário ou um administrador pode solicitar a exclusão."""

    # Não permitir que o administrador apague a própria conta pelo painel.
    if usuario_atual.tipo == "admin" and usuario_atual.id == usuario_id:
        raise HTTPException(status_code=400, detail="Não é permitido excluir sua própria conta administrativa.")

    if not crud.get_usuario(db, usuario_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    try:
        sucesso = crud.deletar_usuario(db, usuario_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não é possível excluir este usuário porque existem "
                "registros vinculados a ele."
            ),
        )

    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return None


# ============================================================
# LOGIN
# ============================================================

@app.post(
    "/login",
    response_model=schemas.LoginResponse,
)
def login(
    dados: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    """Valida as credenciais e devolve um token JWT."""

    db_usuario = crud.get_usuario_por_email(
        db,
        dados.email,
    )

    if not db_usuario or not verificar_senha(
        dados.senha,
        db_usuario.senha,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = criar_token_acesso(db_usuario.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": db_usuario,
    }


# ============================================================
# PESQUISA PÚBLICA DE PROFISSIONAIS REAIS
# ============================================================

@app.get("/profissionais", response_model=list[schemas.ProfissionalBuscaOut])
def pesquisar_profissionais(
    q: str = "",
    categoria: str = "",
    regiao: str = "",
    ordenar: str = "nome_asc",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Consulta profissionais reais com filtros e ordenação."""
    if skip < 0 or not 1 <= limit <= 100:
        raise HTTPException(status_code=400, detail="Use skip >= 0 e limit entre 1 e 100.")
    if ordenar not in ("nome_asc", "nome_desc", "especialidade_asc", "especialidade_desc"):
        raise HTTPException(status_code=400, detail="Ordenação inválida.")
    return crud.pesquisar_profissionais(db, q=q, categoria=categoria, regiao=regiao, ordenar=ordenar, skip=skip, limit=limit)


@app.get("/profissionais/total")
def contar_profissionais(q: str = "", categoria: str = "", regiao: str = "", db: Session = Depends(get_db)):
    """Total de profissionais que correspondem aos filtros, sem limite de página."""
    return {"total": crud.pesquisar_profissionais(db, q=q, categoria=categoria, regiao=regiao, contar=True)}


@app.get("/profissionais/paginados")
def listar_profissionais_paginados(
    q: str = "",
    categoria: str = "",
    regiao: str = "",
    ordenar: str = "nome_asc",
    pagina: int = 1,
    por_pagina: int = 9,
    db: Session = Depends(get_db),
):
    """Busca paginada com total real, mantendo /profissionais compatível."""
    if pagina < 1 or not 1 <= por_pagina <= 100:
        raise HTTPException(status_code=400, detail="Use pagina >= 1 e por_pagina entre 1 e 100.")
    if ordenar not in ("nome_asc", "nome_desc", "especialidade_asc", "especialidade_desc"):
        raise HTTPException(status_code=400, detail="Ordenação inválida.")
    total = crud.contar_profissionais(db, q=q, categoria=categoria, regiao=regiao)
    total_paginas = (total + por_pagina - 1) // por_pagina
    itens = crud.pesquisar_profissionais(
        db, q=q, categoria=categoria, regiao=regiao, ordenar=ordenar,
        skip=(pagina - 1) * por_pagina, limit=por_pagina,
    )
    return {
        "itens": itens,
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_paginas": total_paginas,
    }


@app.get("/profissionais/{profissional_id}", response_model=schemas.ProfissionalBuscaOut)
def obter_profissional_publico(profissional_id: int, db: Session = Depends(get_db)):
    profissional = crud.obter_profissional_publico(db, profissional_id)
    if not profissional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado.")
    return profissional


# ============================================================
# CATEGORIAS
# CONSULTAS PÚBLICAS; ALTERAÇÕES SOMENTE ADMINISTRATIVAS
# ============================================================

@app.post(
    "/categorias",
    response_model=schemas.CategoriaOut,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_categoria(
    categoria: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    admin=Depends(exigir_admin),
):
    if crud.get_categoria_por_nome(db, categoria.nome):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta categoria já está cadastrada.",
        )

    return crud.criar_categoria(db, categoria)


@app.get(
    "/categorias",
    response_model=list[schemas.CategoriaOut],
)
def listar_categorias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use skip >= 0 e limit entre 1 e 100.",
        )

    return crud.listar_categorias(db, skip=skip, limit=limit)


@app.get(
    "/categorias/{categoria_id}",
    response_model=schemas.CategoriaOut,
)
def buscar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
):
    db_categoria = crud.get_categoria(db, categoria_id)

    if not db_categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    admin=Depends(exigir_admin),
):
    if dados.nome:
        existente = crud.get_categoria_por_nome(db, dados.nome)

        if existente and existente.id != categoria_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta categoria já está cadastrada.",
            )

    try:
        db_categoria = crud.atualizar_categoria(
            db,
            categoria_id,
            dados,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível atualizar esta categoria.",
        )

    if not db_categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    admin=Depends(exigir_admin),
):
    try:
        sucesso = crud.deletar_categoria(db, categoria_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não é possível excluir esta categoria porque "
                "existem serviços vinculados a ela."
            ),
        )

    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada.",
        )

    return None


# ============================================================
# SERVIÇOS
# CONSULTAS PÚBLICAS; ALTERAÇÕES SOMENTE ADMINISTRATIVAS
# ============================================================

@app.post(
    "/servicos",
    response_model=schemas.ServicoOut,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_servico(
    servico: schemas.ServicoCreate,
    db: Session = Depends(get_db),
    admin=Depends(exigir_admin),
):
    if not crud.get_categoria(db, servico.categoria_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada.",
        )

    return crud.criar_servico(db, servico)


@app.get(
    "/servicos",
    response_model=list[schemas.ServicoOut],
)
def listar_servicos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use skip >= 0 e limit entre 1 e 100.",
        )

    return crud.listar_servicos(db, skip=skip, limit=limit)


# Esta rota deve ficar antes de /servicos/{servico_id}.
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
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use skip >= 0 e limit entre 1 e 100.",
        )

    if not crud.get_categoria(db, categoria_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    db_servico = crud.get_servico(db, servico_id)

    if not db_servico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    admin=Depends(exigir_admin),
):
    if dados.categoria_id is not None:
        if not crud.get_categoria(db, dados.categoria_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoria não encontrada.",
            )

    try:
        db_servico = crud.atualizar_servico(
            db,
            servico_id,
            dados,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível atualizar este serviço.",
        )

    if not db_servico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    admin=Depends(exigir_admin),
):
    try:
        sucesso = crud.deletar_servico(db, servico_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não é possível excluir este serviço porque "
                "existem solicitações vinculadas a ele."
            ),
        )

    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado.",
        )

    return None

# ============================================================
# SOLICITAÇÕES — CLIENTES E PROFISSIONAIS
# ============================================================

from datetime import datetime, timezone


def _solicitacao_permitida(item, usuario, db):
    if usuario.tipo == "admin" or item.usuario_id == usuario.id:
        return True
    return bool(
        db.query(models.Profissional.id)
        .filter(
            models.Profissional.id == item.profissional_id,
            models.Profissional.usuario_id == usuario.id,
        )
        .first()
    )


@app.post("/solicitacoes", response_model=schemas.SolicitacaoOut, status_code=201)
def criar_solicitacao(
    dados: schemas.SolicitacaoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    if usuario.tipo != "cliente":
        raise HTTPException(status_code=403, detail="Somente clientes podem solicitar serviços.")
    profissional = db.get(models.Profissional, dados.profissional_id)
    if not profissional or not profissional.disponivel:
        raise HTTPException(status_code=404, detail="Profissional indisponível ou não encontrado.")
    if not db.get(models.Servico, dados.servico_id):
        raise HTTPException(status_code=404, detail="Serviço não encontrado.")
    # Compatibilidade: profissionais antigos sem vínculos ainda podem receber solicitações.
    vinculos = db.query(models.ProfissionalServico).filter_by(profissional_id=profissional.id).count()
    if vinculos and not db.get(models.ProfissionalServico, (profissional.id, dados.servico_id)):
        raise HTTPException(status_code=400, detail="O profissional não oferece esse serviço.")
    item = models.Solicitacao(
        usuario_id=usuario.id,
        profissional_id=dados.profissional_id,
        servico_id=dados.servico_id,
        status="Pendente",
        data=datetime.now(timezone.utc).isoformat(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/solicitacoes", response_model=list[schemas.SolicitacaoOut])
def listar_solicitacoes(
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    consulta = db.query(models.Solicitacao)
    if usuario.tipo == "cliente":
        consulta = consulta.filter(models.Solicitacao.usuario_id == usuario.id)
    elif usuario.tipo == "profissional":
        consulta = consulta.join(models.Profissional).filter(
            models.Profissional.usuario_id == usuario.id
        )
    elif usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return consulta.order_by(models.Solicitacao.id.desc()).all()


@app.get("/solicitacoes/{solicitacao_id}", response_model=schemas.SolicitacaoOut)
def buscar_solicitacao(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    item = db.get(models.Solicitacao, solicitacao_id)
    if not item:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")
    if not _solicitacao_permitida(item, usuario, db):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return item


@app.patch("/solicitacoes/{solicitacao_id}/status", response_model=schemas.SolicitacaoOut)
def atualizar_status_solicitacao(
    solicitacao_id: int,
    dados: schemas.SolicitacaoStatusUpdate,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    item = db.get(models.Solicitacao, solicitacao_id)
    if not item:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")
    if not _solicitacao_permitida(item, usuario, db):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    eh_cliente = item.usuario_id == usuario.id and usuario.tipo == "cliente"
    if eh_cliente:
        permitido = dados.status == "Cancelada" and item.status == "Pendente"
    elif usuario.tipo == "profissional":
        permitido = (
            (dados.status in ("Aceita", "Recusada") and item.status == "Pendente")
            or (dados.status == "Concluída" and item.status == "Aceita")
        )
    else:
        permitido = False
    if not permitido:
        raise HTTPException(status_code=409, detail="Transição de status não permitida.")
    item.status = dados.status
    db.commit()
    db.refresh(item)
    return item


# ============================================================
# INTEGRAÇÃO DO PAINEL PROFISSIONAL
# ============================================================
from pydantic import BaseModel, Field

class PerfilExtraEntrada(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    descricao: str = Field(default="", max_length=1000)
    biografia: str = Field(default="", max_length=500)
    experiencia: str = Field(default="", max_length=150)
    regiao: str = Field(default="", max_length=150)


def _meu_profissional(db, usuario):
    if usuario.tipo != "profissional":
        raise HTTPException(status_code=403, detail="Apenas profissionais podem acessar este recurso.")
    profissional = db.query(models.Profissional).filter(models.Profissional.usuario_id == usuario.id).first()
    if not profissional:
        raise HTTPException(status_code=404, detail="Cadastro profissional não encontrado.")
    return profissional


@app.get("/me/profissional")
def meu_perfil_profissional(db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    profissional = _meu_profissional(db, usuario)
    extra = db.get(models.PerfilProfissionalExtra, profissional.id)
    return {"id": profissional.id, "usuario_id": usuario.id, "nome": usuario.nome,
            "especialidade": profissional.especialidade, "telefone": profissional.telefone,
            "disponivel": profissional.disponivel,
            **{campo: getattr(extra, campo, "") if extra else "" for campo in ("descricao", "biografia", "experiencia", "regiao")}}


@app.put("/me/profissional")
def editar_meu_perfil_profissional(dados: PerfilExtraEntrada, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    profissional = _meu_profissional(db, usuario)
    usuario.nome = dados.nome.strip()
    extra = db.get(models.PerfilProfissionalExtra, profissional.id)
    if extra is None:
        extra = models.PerfilProfissionalExtra(profissional_id=profissional.id)
        db.add(extra)
    for campo in ("descricao", "biografia", "experiencia", "regiao"):
        setattr(extra, campo, getattr(dados, campo).strip())
    db.commit()
    return meu_perfil_profissional(db, usuario)


@app.get("/me/servicos", response_model=list[schemas.ServicoOut])
def meus_servicos(db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    profissional = _meu_profissional(db, usuario)
    return db.query(models.Servico).join(models.ProfissionalServico,
        models.ProfissionalServico.servico_id == models.Servico.id).filter(
        models.ProfissionalServico.profissional_id == profissional.id).order_by(models.Servico.nome).all()


@app.post("/me/servicos/{servico_id}", status_code=201)
def vincular_meu_servico(servico_id: int, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    profissional = _meu_profissional(db, usuario)
    if not db.get(models.Servico, servico_id):
        raise HTTPException(status_code=404, detail="Serviço não encontrado.")
    vinculo = db.get(models.ProfissionalServico, (profissional.id, servico_id))
    if vinculo:
        raise HTTPException(status_code=409, detail="Serviço já vinculado.")
    db.add(models.ProfissionalServico(profissional_id=profissional.id, servico_id=servico_id))
    db.commit()
    return {"mensagem": "Serviço vinculado", "servico_id": servico_id}


@app.delete("/me/servicos/{servico_id}", status_code=204)
def desvincular_meu_servico(servico_id: int, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    profissional = _meu_profissional(db, usuario)
    vinculo = db.get(models.ProfissionalServico, (profissional.id, servico_id))
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado.")
    db.delete(vinculo)
    db.commit()
