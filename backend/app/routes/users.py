from typing import Any
from fastapi import APIRouter, Depends

from app import schemas
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=schemas.User)
async def get_current_user_info(
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Get current user information
    """
    return current_user
