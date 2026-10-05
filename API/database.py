from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Garante que o banco usado seja sempre o reparae.db
# localizado dentro da pasta API
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "reparae.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Habilita as chaves estrangeiras do SQLite
@event.listens_for(engine, "connect")
def habilitar_chaves_estrangeiras(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """Abre uma sessão do banco e fecha ao terminar a requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
