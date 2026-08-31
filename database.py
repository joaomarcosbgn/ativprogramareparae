from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Caminho do banco SQLite (o mesmo gerado a partir do Reparae.sql)
SQLALCHEMY_DATABASE_URL = "sqlite:///./reparae.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency do FastAPI: abre uma sessão e garante que ela é fechada depois."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
