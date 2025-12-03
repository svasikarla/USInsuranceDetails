from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas
from app.utils.db import get_db
from app.services import policy_service
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/recent", response_model=List[schemas.RedFlag])
async def get_recent_red_flags(
    db: Session = Depends(get_db),
    limit: int = 5,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve recent red flags for the current user
    """
    red_flags = policy_service.get_recent_red_flags_lightweight(
        db=db, user_id=current_user.id, limit=limit
    )
    return red_flags


@router.get("", response_model=List[schemas.RedFlag])
async def get_red_flags(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all red flags for the current user
    """
    red_flags = policy_service.get_red_flags_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return red_flags
