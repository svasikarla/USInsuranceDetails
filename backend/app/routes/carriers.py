from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas
from app.utils.db import get_db
from app.services import carrier_service
from app.core.dependencies import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("", response_model=List[schemas.InsuranceCarrier])
async def get_carriers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all insurance carriers
    """
    carriers = carrier_service.get_carriers(
        db=db, skip=skip, limit=limit
    )
    return carriers


@router.get("/{carrier_id}", response_model=schemas.InsuranceCarrier)
async def get_carrier(
    *,
    db: Session = Depends(get_db),
    carrier_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve a specific carrier by ID
    """
    carrier = carrier_service.get_carrier(db=db, carrier_id=carrier_id)
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance carrier not found",
        )
    
    return carrier


@router.post("", response_model=schemas.InsuranceCarrier, status_code=status.HTTP_201_CREATED)
async def create_carrier(
    *,
    db: Session = Depends(get_db),
    carrier_in: schemas.InsuranceCarrierCreate,
    current_user: schemas.User = Depends(get_current_admin_user),
) -> Any:
    """
    Create a new insurance carrier (admin only)
    """
    # Check if carrier with same code already exists
    existing_carrier = carrier_service.get_carrier_by_code(db=db, code=carrier_in.code)
    if existing_carrier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Carrier with code {carrier_in.code} already exists",
        )
    
    carrier = carrier_service.create_carrier(db=db, obj_in=carrier_in)
    return carrier


@router.put("/{carrier_id}", response_model=schemas.InsuranceCarrier)
async def update_carrier(
    *,
    db: Session = Depends(get_db),
    carrier_id: UUID,
    carrier_in: schemas.InsuranceCarrierUpdate,
    current_user: schemas.User = Depends(get_current_admin_user),
) -> Any:
    """
    Update an insurance carrier (admin only)
    """
    carrier = carrier_service.get_carrier(db=db, carrier_id=carrier_id)
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance carrier not found",
        )
    
    # If code is being updated, check if it already exists
    if carrier_in.code and carrier_in.code != carrier.code:
        existing_carrier = carrier_service.get_carrier_by_code(db=db, code=carrier_in.code)
        if existing_carrier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Carrier with code {carrier_in.code} already exists",
            )
    
    carrier = carrier_service.update_carrier(
        db=db, carrier=carrier, obj_in=carrier_in
    )
    
    return carrier


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrier(
    *,
    db: Session = Depends(get_db),
    carrier_id: UUID,
    current_user: schemas.User = Depends(get_current_admin_user),
):
    """
    Delete an insurance carrier (admin only)
    """
    carrier = carrier_service.get_carrier(db=db, carrier_id=carrier_id)
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance carrier not found",
        )
    
    carrier_service.delete_carrier(db=db, carrier_id=carrier_id)
    return None
