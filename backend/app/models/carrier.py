from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, BaseModel
import uuid

class InsuranceCarrier(Base, BaseModel):
    __tablename__ = "insurance_carriers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)  # 'BCBS', 'AETNA', 'CIGNA'
    api_endpoint = Column(String(500))
    api_auth_method = Column(String(100))  # 'api_key', 'oauth', 'basic_auth'
    api_key_name = Column(String(100))  # Name of the API key parameter
    is_active = Column(Boolean, default=True, nullable=False)
    logo_url = Column(String(500))
