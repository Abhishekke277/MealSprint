from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from backend.config import settings

# Cloud databases (Aiven ya TiDB Cloud) ke liye PyMySQL SSL require karta hai
connect_args = {}
if any(cloud_provider in settings.DATABASE_URL for cloud_provider in ["aivencloud.com", "tidbcloud.com"]):
    connect_args = {"ssl": {"ssl_mode": "REQUIRED"}}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300  # Serverless databases ke idle timeouts ke liye 300 seconds best hota hai
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