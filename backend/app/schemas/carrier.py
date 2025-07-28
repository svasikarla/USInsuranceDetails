from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class InsuranceCarrierBase(BaseModel):
    name: str
    code: str
    api_endpoint: Optional[str] = None
    api_auth_method: Optional[str] = None
    api_key_name: Optional[str] = None
    logo_url: Optional[str] = None


class InsuranceCarrierCreate(InsuranceCarrierBase):
    pass


class InsuranceCarrierUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_auth_method: Optional[str] = None
    api_key_name: Optional[str] = None
    is_active: Optional[bool] = None
    logo_url: Optional[str] = None


class InsuranceCarrierInDBBase(InsuranceCarrierBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InsuranceCarrier(InsuranceCarrierInDBBase):
    """Insurance carrier data returned to client"""
    pass
