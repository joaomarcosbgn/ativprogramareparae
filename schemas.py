from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    tipo: Literal["cliente", "profissional"]


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6, max_length=72)


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    tipo: Literal["cliente", "profissional"] | None = None
    senha: str | None = Field(None, min_length=6, max_length=72)


class UsuarioOut(UsuarioBase):
    id: int

    # Nunca devolvemos o campo "senha" no response
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
