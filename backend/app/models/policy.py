from sqlalchemy import Column, String, ForeignKey, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, BaseModel
import uuid

class InsurancePolicy(Base, BaseModel):
    __tablename__ = "insurance_policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("policy_documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("insurance_carriers.id"), index=True)
    policy_number = Column(String(100))
    policy_name = Column(String(255), nullable=False)
    policy_type = Column(String(100), index=True)  # 'health', 'dental', 'vision', 'life'
    plan_year = Column(String(4))
    effective_date = Column(Date)
    expiration_date = Column(Date)
    group_number = Column(String(100))
    network_type = Column(String(50))  # 'HMO', 'PPO', 'EPO', 'POS'
    deductible_individual = Column(Numeric(10, 2))
    deductible_family = Column(Numeric(10, 2))
    out_of_pocket_max_individual = Column(Numeric(10, 2))
    out_of_pocket_max_family = Column(Numeric(10, 2))
    premium_monthly = Column(Numeric(10, 2))
    premium_annual = Column(Numeric(10, 2))
    
    # Relationships
    document = relationship("PolicyDocument", backref="policies")
    user = relationship("User", backref="policies")
    carrier = relationship("InsuranceCarrier", backref="policies")
    benefits = relationship("CoverageBenefit", back_populates="policy", cascade="all, delete-orphan")
    red_flags = relationship("RedFlag", back_populates="policy", cascade="all, delete-orphan")
