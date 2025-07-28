from typing import List, Optional, Union, Dict, Any
from sqlalchemy.orm import Session, selectinload
import uuid

from app import models, schemas


def get_carrier(db: Session, carrier_id: uuid.UUID) -> Optional[models.InsuranceCarrier]:
    """
    Get insurance carrier by ID
    """
    return db.query(models.InsuranceCarrier).filter(models.InsuranceCarrier.id == carrier_id).first()


def get_carrier_by_code(db: Session, code: str) -> Optional[models.InsuranceCarrier]:
    """
    Get insurance carrier by code
    """
    return db.query(models.InsuranceCarrier).filter(models.InsuranceCarrier.code == code).first()


def get_carriers(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.InsuranceCarrier]:
    """
    Get all insurance carriers with eager loading of related data
    """
    return (
        db.query(models.InsuranceCarrier)
        .options(
            selectinload(models.InsuranceCarrier.policies),
            selectinload(models.InsuranceCarrier.documents)
        )
        .filter(models.InsuranceCarrier.is_active == True)
        .order_by(models.InsuranceCarrier.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_carrier(
    db: Session, obj_in: schemas.InsuranceCarrierCreate
) -> models.InsuranceCarrier:
    """
    Create a new insurance carrier
    """
    db_obj = models.InsuranceCarrier(
        id=uuid.uuid4(),
        name=obj_in.name,
        code=obj_in.code,
        api_endpoint=obj_in.api_endpoint,
        api_auth_method=obj_in.api_auth_method,
        api_key_name=obj_in.api_key_name,
        is_active=True,
        logo_url=obj_in.logo_url,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_carrier(
    db: Session,
    carrier: models.InsuranceCarrier,
    obj_in: Union[schemas.InsuranceCarrierUpdate, Dict[str, Any]],
) -> models.InsuranceCarrier:
    """
    Update an insurance carrier
    """
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    # Update carrier attributes
    for field, value in update_data.items():
        if hasattr(carrier, field):
            setattr(carrier, field, value)
    
    db.add(carrier)
    db.commit()
    db.refresh(carrier)
    return carrier


def delete_carrier(db: Session, carrier_id: uuid.UUID) -> None:
    """
    Delete an insurance carrier (soft delete)
    """
    carrier = get_carrier(db, carrier_id)
    if carrier:
        carrier.is_active = False
        db.add(carrier)
        db.commit()
