import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# We default to a standard local path if DATABASE_URL is somehow missing from the environment
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://holovault:password123@localhost:5432/holovault_db"
)

# Create the SQLAlchemy engine that will interact with the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a sessionmaker which generates local sessions for each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy declarative models
Base = declarative_base()

# Dependency for FastAPI to inject a database session per HTTP request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
