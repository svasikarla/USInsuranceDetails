from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas
from app.utils.db import get_db
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=schemas.User)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register a new user using Supabase Auth
    """
    user = await auth_service.register_user(db, user_in=user_in)
    return user


@router.post("/login", response_model=schemas.TokenWithUser)
async def login(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    Uses Supabase Auth for authentication
    """
    auth_result = await auth_service.login_user(
        db, email=form_data.username, password=form_data.password
    )
    
    return auth_result


@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_token(
    *, 
    db: Session = Depends(get_db), 
    token: str = Body(..., embed=True)
) -> Any:
    """
    Refresh access token
    """
    tokens = await auth_service.refresh_auth_token(db, refresh_token=token)
    return tokens
