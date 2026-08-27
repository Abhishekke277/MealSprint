from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from backend.config import settings

# Agar Aiven Cloud database use ho raha hai to PyMySQL ke liye SSL enable karein
connect_args = {}
if "aivencloud.com" in settings.DATABASE_URL:
    connect_args = {"ssl": {"ssl_mode": "REQUIRED"}}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """Yields a database session and handles closure automatically."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()