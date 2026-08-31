"""
Script único: converte senhas antigas (texto puro) do banco para hash bcrypt.
Rode UMA VEZ, antes de subir a API pela primeira vez, se o seu banco já tiver
usuários cadastrados com senha em texto puro (como no dump original do Reparaê).

Uso:
    python3 migrar_senhas.py
"""
from database import SessionLocal
import models
from security import hash_senha


def parece_hash_bcrypt(valor: str) -> bool:
    # hashes bcrypt sempre começam com $2a$, $2b$ ou $2y$
    return valor.startswith(("$2a$", "$2b$", "$2y$"))


def main():
    db = SessionLocal()
    usuarios = db.query(models.Usuario).all()
    convertidos = 0

    for usuario in usuarios:
        if not parece_hash_bcrypt(usuario.senha):
            usuario.senha = hash_senha(usuario.senha)
            convertidos += 1

    db.commit()
    db.close()
    print(f"Concluído. {convertidos} senha(s) convertida(s) para bcrypt.")


if __name__ == "__main__":
    main()
