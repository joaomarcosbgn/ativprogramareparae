import bcrypt


def hash_senha(senha: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    senha_bytes = senha.encode("utf-8")
    hashed = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere se a senha em texto puro bate com o hash armazenado."""
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
