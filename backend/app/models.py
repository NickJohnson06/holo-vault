# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # A user can have many binders
    binders = relationship("Binder", back_populates="owner", cascade="all, delete-orphan")
    oauth_connections = relationship("UserOAuthConnection", back_populates="user", cascade="all, delete-orphan")


class Binder(Base):
    __tablename__ = "binders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True, nullable=False)
    description = Column(String(255), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship back to the user
    owner = relationship("User", back_populates="binders")
    
    # A binder can have many pages
    pages = relationship("Page", back_populates="binder", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    binder_id = Column(Integer, ForeignKey("binders.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    title = Column(String(100), nullable=True) # Example: "Gen 1 Starters" 

    # Relationship back to the binder
    binder = relationship("Binder", back_populates="pages")
    
    # A page has many card slots (specifically 9 for a standard binder page)
    card_slots = relationship("CardSlot", back_populates="page", cascade="all, delete-orphan")


class CardSlot(Base):
    __tablename__ = "card_slots"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id"), nullable=False)
    slot_index = Column(Integer, nullable=False) # 0 to 8 
    
    # For custom image uploads (AWS S3 URL)
    image_url = Column(String(255), nullable=True)
    
    # For official Pokémon TCG API integration
    tcg_id = Column(String(100), nullable=True)
    name = Column(String(100), nullable=True)
    set_name = Column(String(100), nullable=True)
    
    # Market & Pricing Integration
    market_price = Column(Float, nullable=True)
    last_pricing_update = Column(DateTime(timezone=True), nullable=True)

    # Relationship back to the page
    page = relationship("Page", back_populates="card_slots")


class UserOAuthConnection(Base):
    __tablename__ = "user_oauth_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # 'google' or 'github'
    provider_user_id = Column(String(100), nullable=False)
    provider_email = Column(String(100), nullable=True)
    provider_username = Column(String(100), nullable=True)
    access_token = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to the user
    user = relationship("User", back_populates="oauth_connections")
