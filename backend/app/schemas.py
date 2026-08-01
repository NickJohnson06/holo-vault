# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# CardSlot Schemas
class CardSlotBase(BaseModel):
    slot_index: int = Field(ge=0, le=8, description="0-8 for a standard 9-pocket page")
    image_url: Optional[str] = None
    tcg_id: Optional[str] = None
    name: Optional[str] = None
    set_name: Optional[str] = None
    market_price: Optional[float] = None

class CardSlotCreate(CardSlotBase):
    page_id: int

class CardSlotUpdate(BaseModel):
    image_url: Optional[str] = None
    tcg_id: Optional[str] = None
    name: Optional[str] = None
    set_name: Optional[str] = None
    market_price: Optional[float] = None

class CardSlotResponse(CardSlotBase):
    id: int
    page_id: int
    last_pricing_update: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Page Schemas
class PageBase(BaseModel):
    page_number: int
    title: Optional[str] = None

class PageCreate(PageBase):
    binder_id: int

class PageUpdate(BaseModel):
    title: Optional[str] = None

class PageResponse(PageBase):
    id: int
    binder_id: int
    card_slots: List[CardSlotResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Binder Schemas
class BinderBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: Optional[str] = None

class BinderCreate(BinderBase):
    pass

class BinderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class BinderResponse(BinderBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    pages: List[PageResponse] = []

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    binders: List[BinderResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OAuthConnectionResponse(BaseModel):
    provider: str
    connected: bool
    email: Optional[str] = None
    username: Optional[str] = None

