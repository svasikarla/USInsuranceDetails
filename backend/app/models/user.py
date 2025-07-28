from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, BaseModel
import uuid

class User(Base, BaseModel):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    company_name = Column(String(255))
    role = Column(String(50), default="user")  # 'user', 'admin', 'analyst'
    subscription_tier = Column(String(50), default="free")  # 'free', 'pro', 'enterprise'
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    supabase_uid = Column(String(255), unique=True)  # Supabase user ID for auth integration
    last_login_at = Column(DateTime)
