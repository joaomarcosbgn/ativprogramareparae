from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db
from security import verificar_senha

# Cria as tabelas caso ainda não existam (não apaga dados existentes)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Reparaê API",
    description="API de cadastro de usuários do Reparaê",
    version="1.0.0",
)


@app.get("/")
def raiz():
    return {"mensagem": "API Reparaê no ar 🚀"}


# ---------- CADASTRO DE USUÁRIOS ----------

@app.post("/usuarios", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if crud.get_usuario_por_email(db, usuario.email):
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
    return crud.criar_usuario(db, usuario)


@app.get("/usuarios", response_model=list[schemas.UsuarioOut])
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.listar_usuarios(db, skip=skip, limit=limit)


@app.get("/usuarios/{usuario_id}", response_model=schemas.UsuarioOut)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    db_usuario = crud.get_usuario(db, usuario_id)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return db_usuario


@app.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioOut)
def atualizar_usuario(usuario_id: int, dados: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    if dados.email:
        existente = crud.get_usuario_por_email(db, dados.email)
        if existente and existente.id != usuario_id:
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso por outro usuário.")

    db_usuario = crud.atualizar_usuario(db, usuario_id, dados)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return db_usuario


@app.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    sucesso = crud.deletar_usuario(db, usuario_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return None


# ---------- LOGIN (bônus, útil pra validar a senha cadastrada) ----------

@app.post("/login", response_model=schemas.UsuarioOut)
def login(dados: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_usuario = crud.get_usuario_por_email(db, dados.email)
    if not db_usuario or not verificar_senha(dados.senha, db_usuario.senha):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    return db_usuario
