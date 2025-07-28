from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    company_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    password_confirm: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserInDBBase(UserBase):
    id: UUID
    role: str
    subscription_tier: str
    is_active: bool
    email_verified: bool
    supabase_uid: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class User(UserInDBBase):
    """User data returned to client"""
    pass


class UserInDB(UserInDBBase):
    """User data stored in DB"""
    password_hash: str
