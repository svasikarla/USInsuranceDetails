from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas
from app.utils.db import get_db
from app.services import auth_service
from app.core.config import settings

import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=schemas.User)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register a new user using Supabase Auth
    """
    try:
        user = await auth_service.register_user(db, user_in=user_in)
        return user
    except Exception as e:
        logger.error(f"An unexpected error occurred during registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration.",
        )


@router.post("/login", response_model=schemas.TokenWithUser)
async def login(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    Uses Supabase Auth for authentication
    Also sets HttpOnly cookies for access and refresh tokens
    """
    logger.info(f"Login attempt with form data: {form_data}")
    auth_result = await auth_service.login_user(
        db, email=form_data.username, password=form_data.password
    )

    # Set HttpOnly cookies
    access_token = auth_result.get("access_token")
    refresh_token = auth_result.get("refresh_token")

    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
    if refresh_token:
        # 30 days in seconds by default
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
            path="/",
        )

    return auth_result


@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_token(
    *,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    token: str | None = Body(None, embed=True)
) -> Any:
    """
    Refresh access token. Accepts refresh token in body or reads from HttpOnly cookie.
    Also resets cookies on success.
    """
    # Prefer body token; fallback to cookie
    refresh_token_value = token or request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    tokens = await auth_service.refresh_auth_token(db, refresh_token=refresh_token_value)

    # Reset cookies with new tokens
    if tokens.get("access_token"):
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
    if tokens.get("refresh_token"):
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
            path="/",
        )

    return tokens


@router.post("/logout")
async def logout(response: Response) -> Any:
    """
    Clear auth cookies on logout
    """
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}
