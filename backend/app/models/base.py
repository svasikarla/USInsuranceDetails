from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime, func
import uuid

Base = declarative_base()

class BaseModel:
    """Base model with common columns for all tables"""

    created_at = Column(DateTime, default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    @classmethod
    def generate_uuid(cls):
        """Generate a UUID for primary keys"""
        return str(uuid.uuid4())
