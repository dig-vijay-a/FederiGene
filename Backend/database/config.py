from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# We will use SQLite by default for standalone desktop installations,
# but you can provide a MySQL/PostgreSQL URL in the .env file in this format:
# DATABASE_URL=mysql+pymysql://username:password@localhost:3306/federigene
# DATABASE_URL=postgresql://user:password@localhost:5432/federigene
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./federigene.db" # Default fallback for standalone .exe
)

# Normalize PostgreSQL URLs for SQLAlchemy & cloud hosting providers (Render, Supabase, Neon)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure PostgreSQL uses psycopg2 if psycopg (v3) is not installed
if SQLALCHEMY_DATABASE_URL.startswith("postgresql+psycopg://") or SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    try:
        import psycopg  # noqa: F401
    except ImportError:
        if SQLALCHEMY_DATABASE_URL.startswith("postgresql+psycopg://"):
            SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
        elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
            SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite concurrency optimizations
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args=connect_args,
        pool_size=50,
        max_overflow=100
    )
    
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
else:
    # Production Database (MySQL/PostgreSQL) optimizations
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        pool_size=20, 
        max_overflow=50,
        pool_timeout=30,
        pool_recycle=1800
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
