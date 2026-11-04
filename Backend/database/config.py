from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# We will use SQLite by default for standalone desktop installations,
# but you can provide a MySQL/PostgreSQL URL in the .env file in this format:
# DATABASE_URL=mysql+pymysql://username:password@localhost:3306/federigene
# DATABASE_URL=postgresql://user:password@localhost:5432/federigene
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_default_db_path = os.path.join(_backend_dir, "federigene.db").replace("\\", "/")

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"sqlite:///{_default_db_path}"
)

# Normalize PostgreSQL URLs for SQLAlchemy & cloud hosting providers (Render, Supabase, Neon)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Detect Supabase connection pooler
is_supabase_pooler = "pooler.supabase.com" in SQLALCHEMY_DATABASE_URL

# In Supabase Pooler, port 5432 is Session mode (restricted to max 15 clients: EMAXCONNSESSION).
# Port 6543 is Transaction mode (designed for serverless/multi-client web servers like Render).
if is_supabase_pooler and ":5432" in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(":5432", ":6543")

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
elif is_supabase_pooler or ":6543" in SQLALCHEMY_DATABASE_URL:
    # Supabase Transaction Pooler (Supavisor on port 6543)
    # Using NullPool and disabling prepared statements prevents EMAXCONNSESSION (pool_size: 15) and prepared statement errors
    connect_args = {"prepare_threshold": None}
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool,
        connect_args=connect_args,
        pool_pre_ping=True
    )
else:
    # Production Database (MySQL/PostgreSQL) with conservative pool sizes
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        pool_size=5, 
        max_overflow=5,
        pool_timeout=30,
        pool_recycle=300,
        pool_pre_ping=True
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
