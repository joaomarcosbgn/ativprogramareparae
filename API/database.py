
import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Verifica se existe uma conexão PostgreSQL configurada
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Conexão com PostgreSQL no Render/Neon
    SQLALCHEMY_DATABASE_URL = DATABASE_URL

    # Utiliza o driver psycopg 3
    if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1,
        )

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
    )

else:
    # Conexão SQLite para desenvolvimento local
    BASE_DIR = Path(__file__).resolve().parent
    DATABASE_PATH = BASE_DIR / "reparae.db"

    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

    # Habilita chaves estrangeiras somente no SQLite
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
