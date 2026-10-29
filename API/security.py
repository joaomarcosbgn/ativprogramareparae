
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


SECRET_KEY = os.getenv("REPARAE_SECRET_KEY")

if not SECRET_KEY:
    SECRET_KEY = "chave-temporaria-apenas-desenvolvimento"

ALGORITHM = "HS256"
TEMPO_TOKEN_MINUTOS = 60

# Recebe diretamente o token Bearer no Swagger
bearer_scheme = HTTPBearer()


def hash_senha(senha: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    senha_bytes = senha.encode("utf-8")
    hashed = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere se a senha bate com o hash armazenado."""
    return bcrypt.checkpw(
        senha.encode("utf-8"),
        senha_hash.encode("utf-8"),
    )


def criar_token_acesso(usuario_id: int) -> str:
    """Cria um token JWT associado ao ID do usuário."""
    agora = datetime.now(timezone.utc)
    expiracao = agora + timedelta(minutes=TEMPO_TOKEN_MINUTOS)

    dados_token = {
        "sub": str(usuario_id),
        "iat": agora,
        "exp": expiracao,
    }

    return jwt.encode(
        dados_token,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def obter_id_usuario_token(
    credenciais: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    """Valida o token JWT e retorna o ID do usuário."""

    erro_autenticacao = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado. Faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credenciais.credentials

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        usuario_id = payload.get("sub")

        if usuario_id is None:
            raise erro_autenticacao

        return int(usuario_id)

    except (JWTError, ValueError, TypeError):
        raise erro_autenticacao
