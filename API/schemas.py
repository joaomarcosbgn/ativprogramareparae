from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Literal
import re


class UsuarioBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    tipo: Literal["cliente", "profissional"]

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        # Permite letras, espaços, acentos, hífen e apóstrofo.
        padrao = r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$"

        if not re.fullmatch(padrao, valor):
            raise ValueError("O nome deve conter apenas letras e caracteres válidos.")

        return " ".join(valor.split())


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=8, max_length=72)


class UsuarioUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    tipo: Literal["cliente", "profissional"] | None = None
    senha: str | None = Field(None, min_length=8, max_length=72)

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        padrao = r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$"

        if not re.fullmatch(padrao, valor):
            raise ValueError("O nome deve conter apenas letras e caracteres válidos.")

        return " ".join(valor.split())


class UsuarioOut(UsuarioBase):
    id: int

    # Nunca devolvemos o campo "senha" no response
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True
    )


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    senha: str = Field(..., min_length=8, max_length=72)