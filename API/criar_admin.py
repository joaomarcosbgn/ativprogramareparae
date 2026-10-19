
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import Usuario
from security import hash_senha


def criar_admin():
    print("\n=== Cadastro do administrador do Reparaê ===\n")

    nome = input("Nome do administrador: ").strip()
    email = input("E-mail do administrador: ").strip().lower()

    if len(nome) < 2:
        print("Erro: o nome deve ter pelo menos 2 caracteres.")
        return

    if not email or "@" not in email:
        print("Erro: informe um e-mail válido.")
        return

    senha = getpass("Crie uma senha (mínimo de 12 caracteres): ")
    confirmar_senha = getpass("Confirme a senha: ")

    if len(senha) < 12:
        print("Erro: a senha deve ter pelo menos 12 caracteres.")
        return

    if senha != confirmar_senha:
        print("Erro: as senhas não são iguais.")
        return

    db = SessionLocal()

    try:
        usuario_existente = (
            db.query(Usuario)
            .filter(Usuario.email == email)
            .first()
        )

        if usuario_existente:
            print("Erro: já existe um usuário com esse e-mail.")
            return

        novo_admin = Usuario(
            nome=nome,
            email=email,
            senha=hash_senha(senha),
            tipo="admin",
        )

        db.add(novo_admin)
        db.commit()
        db.refresh(novo_admin)

        print("\nAdministrador criado com sucesso!")
        print(f"ID: {novo_admin.id}")
        print(f"Nome: {novo_admin.nome}")
        print(f"E-mail: {novo_admin.email}")
        print(f"Tipo: {novo_admin.tipo}")

    except IntegrityError:
        db.rollback()
        print("Erro: não foi possível criar o administrador.")
        print("Verifique se o e-mail já está cadastrado.")

    except Exception as erro:
        db.rollback()
        print(f"Erro inesperado: {erro}")

    finally:
        db.close()


if __name__ == "__main__":
    criar_admin()
