from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

database_url = settings.DATABASE_URL

# Dual DB dialect configurations (connect_args is only needed for SQLite)
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
