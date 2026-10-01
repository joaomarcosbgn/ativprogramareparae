```python
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
            raise ValueError(
                "O nome deve conter apenas letras e caracteres válidos."
            )

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
            raise ValueError(
                "O nome deve conter apenas letras e caracteres válidos."
            )

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


# ---------- CATEGORIAS ----------

class CategoriaBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(..., min_length=2, max_length=100)
    descricao: str | None = Field(None, max_length=255)


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str | None = Field(None, min_length=2, max_length=100)
    descricao: str | None = Field(None, max_length=255)


class CategoriaOut(CategoriaBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True
    )


# ---------- SERVIÇOS ----------

class ServicoBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    categoria_id: int
    nome: str = Field(..., min_length=2, max_length=100)
    descricao: str | None = Field(None, max_length=255)
    preco: float = Field(..., ge=0)


class ServicoCreate(ServicoBase):
    pass


class ServicoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    categoria_id: int | None = None
    nome: str | None = Field(None, min_length=2, max_length=100)
    descricao: str | None = Field(None, max_length=255)
    preco: float | None = Field(None, ge=0)


class ServicoOut(ServicoBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True
    )


# ---------- PROFISSIONAIS ----------

class ProfissionalBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    usuario_id: int
    especialidade: str = Field(..., min_length=2, max_length=100)
    telefone: str = Field(..., min_length=11, max_length=11)
    disponivel: int = Field(default=1, ge=0, le=1)

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, valor: str) -> str:
        if not valor.isdigit():
            raise ValueError(
                "O telefone deve conter apenas números."
            )

        if len(valor) != 11:
            raise ValueError(
                "O telefone deve conter exatamente 11 dígitos."
            )

        return valor


class ProfissionalCreate(ProfissionalBase):
    pass


class ProfissionalUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    usuario_id: int | None = None
    especialidade: str | None = Field(
        None,
        min_length=2,
        max_length=100
    )
    telefone: str | None = Field(
        None,
        min_length=11,
        max_length=11
    )
    disponivel: int | None = Field(
        None,
        ge=0,
        le=1
    )

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        if not valor.isdigit():
            raise ValueError(
                "O telefone deve conter apenas números."
            )

        if len(valor) != 11:
            raise ValueError(
                "O telefone deve conter exatamente 11 dígitos."
            )

        return valor


class ProfissionalOut(ProfissionalBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )
```
